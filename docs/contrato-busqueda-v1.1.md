# Contrato de Búsqueda v1.1

**Endpoint:** `GET /api/busqueda/productos`

## Parámetros de consulta
| Parámetro | Tipo | Requerido | Default | Descripción |
| :-- | :-- | :-- | :-- | :-- |
| `q` | string | No | "" | Término de búsqueda (búsqueda con fuzzy/prefix). |
| `categoria` | string/array | No | undefined | Filtrar por categoría. Soporta valores repetidos (`?categoria=a&categoria=b`) o separados por comas (`?categoria=a,b`). |
| `minPrice` | number | No | undefined | Precio mínimo. |
| `maxPrice` | number | No | undefined | Precio máximo. |
| `orden` | string | No | "relevancia" | Campo/criterio de ordenamiento. |
| `direccion` | string | No | "asc" | Dirección de ordenamiento (`asc` o `desc`). |
| `pagina` | number | No | 1 | Número de página. Mínimo 1. |
| `tamanoPagina` | number | No | 20 | Tamaño de página. Rango 1-100. | 

## Respuesta JSON
```json
{
  "productos": [
    {
      "id": "string",
      "nombre": "string",
      "categoria": "string",
      "precio": 0,
      "activo": true,
      "actualizadoEn": "ISO8601",
      "sugerencia": { "input": ["..."] }
    }
  ],
  "total": 0,
  "pagina": 1,
  "tamanoPagina": 20,
  "sugerenciaTermino": null,
  "categoriasPopulares": [],
  "facetas": {
    "categorias": [
      { "key": "cat-ropa", "doc_count": 0 }
    ]
  }
}
```

## Notas
- Si no hay resultados y hay texto de búsqueda (`q`) y **no existen filtros activos**, se pueden retornar alternativas (sugerencias) desde `alternativasParaSinResultados`.
- Si hay error de validación en `precio` u `orden`, el endpoint debe responder `400 Bad Request` con `{ "error": "..." }`.
