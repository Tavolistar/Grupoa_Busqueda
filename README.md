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
