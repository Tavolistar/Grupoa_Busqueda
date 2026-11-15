# Contrato de Búsqueda v2.0

**De:** Equipo A (Búsqueda) · **Para:** Equipo B (Catálogo y Host App) y Equipo C (Carrito)
**Fecha:** 14 de noviembre de 2026
**Se apoya en:** Contrato de Catálogo v2.4 (sección 5, eventos) y Contrato del Host App v1.2 (secciones 3, 4 y 9).
**Reemplaza a:** `docs/contrato-busqueda-v1.1.md`. Todo lo de la v1.1 sigue funcionando igual: los cambios son compatibles.

Este contrato dice qué ofrece Búsqueda a los demás equipos (API REST y micro-frontend), qué eventos consume y qué garantías da.

## Qué le toca a cada equipo

| Equipo | Qué necesita de este contrato | Sección |
| ------ | ----------------------------- | ------- |
| B — Host App | Cargar el frontend de Búsqueda en el puerto `5174` y atender el mensaje `navegar` | 3 |
| B — Kong | Ruta `/api/busqueda` hacia `busqueda:3000`, sin quitar el prefijo | 1 y 4 |
| B — Catálogo | Seguir publicando según su sección 5; Búsqueda no llama a Catálogo | 2 |
| B — docker-compose de integración | Construir Búsqueda desde `main` con las variables de la sección 4, incluida `EUREKA_URL` | 4 |
| C — Carrito | Nada: Carrito no usa Búsqueda | — |

---

## 1. API REST

Búsqueda es **pública**: no pide token. Se consume **solo por Kong**:

```
http://localhost:8000/api/busqueda
```

Kong no quita el prefijo: el servicio atiende las rutas `/api/busqueda/...` tal cual. Todas las respuestas son JSON (UTF-8). Solo se aceptan peticiones `GET`.

### 1.1. `GET /api/busqueda/productos`

Busca productos **activos** en el índice de Búsqueda.

| Parámetro | Tipo | Por defecto | Reglas |
| --------- | ---- | ----------- | ------ |
| `q` | texto | vacío | Texto libre. Tolera errores de escritura (“camsia” encuentra “camisa”) y reconoce sinónimos (“tenis” encuentra “zapatillas”). Vacío devuelve todos los activos |
| `categoria` | texto, repetible | — | Una o varias: `categoria=cat-ropa&categoria=cat-zapatos` o `categoria=cat-ropa,cat-zapatos`. Se combinan con OR entre sí y con AND con el resto de filtros |
| `minPrice`, `maxPrice` | número | — | Inclusivos. Deben ser ≥ 0 y `minPrice ≤ maxPrice` |
| `orden` | `relevancia` · `precio` · `nombre` | `relevancia` | Desempate siempre por `id`, para que las páginas no repitan productos |
| `direccion` | `asc` · `desc` | `asc` | |
| `pagina` | entero | `1` | Mínimo 1 |
| `tamanoPagina` | entero | `20` | Se ajusta al rango 1–100 |

**Respuesta 200:**

```json
{
  "productos": [
    { "id": "674000000000000000000001", "nombre": "Camiseta básica algodón",
      "descripcion": "Camiseta unisex 100% algodón.", "precio": 49900,
      "categoria": "cat-ropa", "stock": 100, "activo": true }
  ],
  "total": 1,
  "pagina": 1,
  "tamanoPagina": 20,
  "totalPaginas": 1,
  "hayAnterior": false,
  "haySiguiente": false,
  "sugerenciaTermino": null,
  "categoriasPopulares": [],
  "facetas": { "categorias": [ { "key": "cat-ropa", "doc_count": 1 } ] }
}
```

- `id` es el mismo id de Catálogo: sirve para abrir su detalle.
- Cada producto trae los campos que llegaron en el último evento de Catálogo, más campos internos de Búsqueda (`actualizadoEn`, `sugerencia`) que los demás equipos deben ignorar.
- `facetas.categorias` cuenta los productos por categoría **sin aplicar el filtro de categoría**, para poder mostrar todas las opciones.
- **Sin resultados:** si no hay productos, hay texto en `q` y **no** hay filtros activos, `sugerenciaTermino` trae un término parecido (o `null`) y `categoriasPopulares` las 5 categorías con más productos activos (`[{ "id": "cat-ropa", "nombre": "ropa" }]`). Con filtros activos, ambos van vacíos.

**Encabezados de la respuesta:**

| Encabezado | Valor |
| ---------- | ----- |
| `X-Cache` | `HIT` si la respuesta salió de la caché de Redis, `MISS` si se consultó Elasticsearch |

**Errores:**

| Código | Cuerpo (`{ "error": "..." }`) | Cuándo |
| ------ | ----------------------------- | ------ |
| 400 | `minPrice y maxPrice deben ser números mayores o iguales a 0` | Precio negativo o no numérico |
| 400 | `minPrice no puede ser mayor que maxPrice` | Rango invertido |
| 400 | `orden debe ser relevancia, precio o nombre` | `orden` desconocido |
| 400 | `direccion debe ser asc o desc` | `direccion` desconocida |
| 400 | `pagina * tamanoPagina no puede superar 10000` | Página demasiado lejana (límite de Elasticsearch) |
| 500 | `Error en la búsqueda` | Falla interna (por ejemplo, Elasticsearch caído) |

### 1.2. `GET /api/busqueda/sugerencias?q={texto}`

Autocompletado mientras el usuario escribe. Con menos de **2 caracteres** devuelve la lista vacía.

```json
{
  "sugerencias": [
    { "tipo": "producto",  "texto": "Camiseta básica algodón" },
    { "tipo": "categoria", "texto": "cat-ropa" }
  ]
}
```

Hasta 5 productos (por prefijo, tolerando un error de escritura) y hasta 3 categorías.

Error: `500 { "error": "Error obteniendo sugerencias" }`.

---

## 2. Eventos que consume Búsqueda

Búsqueda **nunca** consulta la base de datos ni la API de Catálogo para buscar: mantiene su propio índice escuchando los eventos que Catálogo publica según su contrato (sección 5).

| Elemento | Valor |
| -------- | ----- |
| Broker | El RabbitMQ único de la tienda (`RABBITMQ_URL`) |
| Exchange | `catalogo.eventos`, tipo `topic`, durable. Búsqueda lo declara con esos mismos parámetros |
| Cola | `busqueda.catalogo.eventos`, durable, propiedad de Búsqueda |
| Mensajes fallidos | Van a la cola `busqueda.catalogo.events.dlq` (exchange `busqueda.dlx`) en lugar de perderse |
| Orden | Se procesa **un evento a la vez** (`prefetch 1`), así que los eventos de un mismo producto se aplican en el orden en que se publicaron |

| Routing key | Qué hace Búsqueda | Campos que usa |
| ----------- | ----------------- | -------------- |
| `producto.creado` | Agrega el producto al índice y borra **todas** las búsquedas guardadas | `id`, `nombre`, `descripcion`, `precio`, `categoria`, `stock`, `activo`, `fecha` |
| `producto.actualizado` | Reemplaza sus datos (también el stock) y borra **solo las búsquedas donde aparecía**. Respeta `activo`: si llega `activo: false`, sigue fuera de la búsqueda | Los mismos |
| `producto.reactivado` | Lo vuelve a mostrar y borra **todas** las búsquedas guardadas | Los mismos |
| `producto.desactivado` | Lo oculta (no se borra del índice) y borra las búsquedas donde aparecía | `id` |

**Cuándo se ve un cambio:** cuando Búsqueda procesa el evento, el cambio queda visible en la siguiente búsqueda, también si esa búsqueda estaba en caché. Las búsquedas se guardan en Redis 5 minutos.

**Si se pierden eventos:** hoy Búsqueda no reconstruye su índice desde `GET /api/catalogo/productos?activo=todos` (contrato de Catálogo, sección 5.1). Queda como trabajo futuro.

---

## 3. Micro-frontend dentro del Host App

| Elemento | Valor |
| -------- | ----- |
| Puerto | `5174`, fijo (`strictPort`) |
| API que consume | `http://localhost:8000/api/busqueda` (Kong). Se puede cambiar con `VITE_API_URL` |
| Dentro del Host App | Detecta que corre en un iframe (`window.self !== window.top`) y **oculta su título** «Búsqueda de productos» |
| Fuera del Host App | Funciona solo, con su título |

**Mensaje que envía al Host App** al pulsar un resultado:

```js
window.parent.postMessage({ tipo: 'navegar', ruta: '/catalogo/{id}' }, '*')
```

`{id}` es el id de Catálogo del producto. Búsqueda **no** espera ningún mensaje del Host App. Fuera del Host App, pulsar un resultado no hace nada.

---

## 4. Despliegue en el docker-compose de integración

| Elemento | Valor |
| -------- | ----- |
| Repositorio | `https://github.com/Tavolistar/Grupoa_Busqueda`, rama `main` |
| Imagen | `Dockerfile` de la raíz (Node.js 20) |
| Puerto interno | `3000`. No se publica: solo Kong llega a él |
| Dependencias propias | Elasticsearch 8.14 (`9200`) y Redis 7 (`6379`), solo de Búsqueda |
| Orden de arranque | Elasticsearch, Redis y RabbitMQ listos antes de Búsqueda; Catálogo después de Búsqueda, para que su cola ya esté enlazada cuando salgan los eventos iniciales |

| Variable | Ejemplo |
| -------- | ------- |
| `PORT` | `3000` |
| `ELASTICSEARCH_URL` | `http://elasticsearch:9200` |
| `REDIS_URL` | `redis://redis:6379` |
| `RABBITMQ_URL` | `amqp://usuario:clave@rabbitmq:5672` (el RabbitMQ de Catálogo) |
| `EUREKA_URL` | `http://eureka:8761/eureka`. Opcional: sin ella, Búsqueda no se registra |

Al arrancar, Búsqueda crea su índice si no existe. Si Redis no responde, la búsqueda sigue funcionando sin caché.

### 4.1. Registro en Eureka

Búsqueda se anuncia en el registro de servicios de la tienda (consola en `http://localhost:8761`) usando la API REST de Eureka:

| Elemento | Valor |
| -------- | ----- |
| Nombre de la aplicación | `BUSQUEDA` |
| Instancia | `{hostname}:busqueda:3000`, con la IP del contenedor en la red de Docker y el puerto `3000` |
| URL de salud | `http://{ip}:3000/api/busqueda/productos` |
| Estado | `UP` mientras Elasticsearch responde; `DOWN` si deja de responder, y vuelve a `UP` cuando se recupera |
| Latido | Cada 10 s. Eureka lo saca si pasan 30 s sin latido |
| Al apagarse | Con `SIGTERM` o `SIGINT` (por ejemplo, `docker stop`) se da de baja en Eureka |
| Si Eureka no responde | Búsqueda sigue funcionando y reintenta el registro en el siguiente latido |

---

## 5. Garantías de servicio

Medidas con 10 000 productos y 20 conexiones concurrentes (`npm run carga`):

| Escenario | P95 | Peticiones por segundo |
| --------- | --- | ---------------------- |
| Búsqueda repetida (desde la caché) | 3 ms | 9 361 |
| Búsqueda nueva (Elasticsearch) | 102 ms | 436 |

---

## 6. Cambios respecto a la v1.1

| Cambio | Compatible |
| ------ | ---------- |
| Paginación: `totalPaginas`, `hayAnterior`, `haySiguiente` y error por página lejana | Sí, campos nuevos |
| Encabezado `X-Cache` | Sí |
| Eventos de Catálogo: exchange `catalogo.eventos`, routing keys `producto.*`, nuevo `producto.reactivado`, se respeta `activo` | Interno de Búsqueda |
| Frontend en el puerto 5174, por Kong y con el mensaje `navegar` | Sí |
| Registro en Eureka (`EUREKA_URL`) | Sí, opcional |

**Para preguntar o pedir cambios:** al Scrum Master del Equipo A, indicando la sección.
