# Contrato de Búsqueda v1.1

Extensión **compatible** de la v1.0: una petición solo con `q` responde igual que antes.
Responsable: Juan Pablo Aparicio (SM). Aprobado en la planificación del Sprint 2.

## GET /api/busqueda/productos

| Parámetro | Tipo | Detalle |
|---|---|---|
| `q` | string | Texto libre (fuzzy + sinónimos). Vacío = todos los activos |
| `categoria` | string | Repetido (`?categoria=a&categoria=b`) o separado por comas (`?categoria=a,b`). OR entre categorías |
| `minPrice` | number | Inclusivo, >= 0 |
| `maxPrice` | number | Inclusivo, >= 0. Debe ser >= `minPrice` |
| `orden` | string | `relevancia` (default) \| `precio` \| `nombre` |
| `direccion` | string | `asc` (default) \| `desc` |
| `pagina` | number | Default 1 |
| `tamanoPagina` | number | Default 20, máximo 100 |

Los filtros distintos se combinan con **AND** (texto AND precio AND categoría).

### 200 OK
```json
{
  "productos": [{ "id": "p2", "nombre": "Zapatos deportivos Nike Air", "categoria": "cat-zapatos", "precio": 250000, "activo": true }],
  "total": 1,
  "pagina": 1,
  "tamanoPagina": 20,
  "sugerenciaTermino": null,
  "categoriasPopulares": [],
  "facetas": { "categorias": [{ "id": "cat-zapatos", "nombre": "zapatos", "total": 3 }] }
}
```
- `facetas.categorias` se calcula con texto y precio aplicados, pero **sin** el filtro de categoría (así el usuario ve las demás opciones).
- `sugerenciaTermino` y `categoriasPopulares` (HU-SRCH-04) solo se llenan si hay texto, 0 resultados y **ningún filtro activo**.

### 400 Bad Request
```json
{ "error": "minPrice no puede ser mayor que maxPrice" }
```
Casos: precio no numérico, precio negativo, `minPrice > maxPrice`, `orden` o `direccion` inválidos.

## Datos de prueba
`npm run seed` carga 10 productos (p10 desactivado: nunca debe aparecer).
Activos por categoría: `cat-zapatos` 3, `cat-ropa` 4, `cat-accesorios` 2.
