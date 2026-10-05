# Microservicio de Búsqueda - Equipo A

Microservicio de búsqueda orientado a eventos (CQRS), construido con Node.js aplicando Onion Architecture (capas Domain, Application e Infrastructure).

Permite realizar búsquedas de texto completo y sugerencias de productos mediante Elasticsearch, cachear consultas con Redis y comunicarse de forma asíncrona entre servicios a través de RabbitMQ.

## Servicios de infraestructura

| Servicio       | Puerto(s)            | Uso                                    |
| -------------- | -------------------- | -------------------------------------- |
| Elasticsearch  | 9200                 | Búsqueda full-text y sugerencias       |
| Redis          | 6379                 | Caché de consultas                     |
| RabbitMQ       | 5672 / 15672         | Bus de eventos / panel de gestión      |

## Puesta en marcha

```bash
docker compose up
```
## 🚀 Guía de Configuración e Instalación del Entorno (Docker & Servicios)

Esta guía explica el proceso paso a paso para levantar el entorno local del proyecto usando Docker y Docker Compose, evitando errores comunes de virtualización e instalación.

---

### 1. Requisitos Previos en Windows

Antes de levantar los contenedores, asegúrate de cumplir con los siguientes prerrequisitos en tu sistema operativo:

1. **WSL2 Habilitado:**
   - Abre la terminal (PowerShell o CMD) como Administrador y ejecuta:
     ```bash
     wsl --install
     ```
   - Reinicia la PC cuando la instalación finalice.

2. **Virtualización Habilitada en BIOS/UEFI:**
   - Abre el *Administrador de tareas* (`Ctrl + Shift + Esc`) -> Pestaña **Rendimiento** -> **CPU**.
   - Confirma que en la esquina inferior derecha la opción **Virtualización** aparezca como **Habilitado**.
   - *Nota:* Si dice **Deshabilitado**, debes reiniciar el equipo, ingresar a la BIOS (usualmente presionando `F2`, `F10` o `DEL` al encender) y activar:
     - **Intel:** `Intel Virtualization Technology` / `Intel VT-x`
     - **AMD:** `SVM Mode` / `AMD-V`

3. **Características de Windows Activas:**
   - Busca en el menú de inicio **"Activar o desactivar las características de Windows"**.
   - Asegúrate de marcar y guardar:
     - ✅ *Plataforma de máquina virtual*
     - ✅ *Plataforma del hipervisor de Windows*

---

### 2. Instalación de Docker Desktop

1. Descarga e instala [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/).
2. Completa la instalación y reinicia el equipo si el instalador lo solicita.
3. Abre Docker Desktop y verifica que en la esquina inferior izquierda diga **Engine running** (en color verde).

---

### 3. Cómo Levantar el Proyecto Localmente

Una vez instalado Docker Desktop y clonado este repositorio:

1. **Abrir la terminal en la raíz del proyecto** (donde se encuentra el archivo `docker-compose.yml`).
2. **Levantar los servicios:**
   IMPORTANTISIMOOOO  se recomienda ejecutar de esta manera, peus el docker con elastic, redis, y rabbit pesa mucho, es necesario isntallar las dependencias una por una de la sigueitne manera 

docker compose pull redis
docker compose pull rabbitmq
docker compose pull elasticsearch
docker compose pull
docker compose up -d

---

## Frontend (busqueda-frontend)

El frontend está construido con Vue 3 + Vite (JavaScript) y consume el backend en `http://localhost:3000` (CORS habilitado).

1. Asegúrate de que el backend esté corriendo (ver pasos anteriores).
2. Entra a la carpeta del frontend:
   ```bash
   cd busqueda-frontend
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre http://localhost:5173
