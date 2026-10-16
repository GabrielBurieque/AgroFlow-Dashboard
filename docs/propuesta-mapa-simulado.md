# Propuesta: mapa de viajes simulado finca → ingenio

**Propuesta no aprobada ni implementada.** Documento de discusión, no contrato. **Corte:** 2026-10-16 · **Referencia:** `agustinvallante/AgroFlow` `main` [`92a80c1`](https://github.com/agustinvallante/AgroFlow/tree/92a80c1b81d3f456d1ca46224f7e73602bfc99db): `openapi.yaml` `0.3.0`, entidades de `backend/AgroFlow.Domain` y workflow del chatbot de la PR #79 (`15944f4`). Relacionado: [datos-requeridos-frontend.md](datos-requeridos-frontend.md).

## Objetivo

Mostrar en el dashboard dónde **se estima** que está cada camión entre la finca y el ingenio, y que el movimiento se vea en tiempo real.

**Sin GPS por camión.** La conectividad entre fincas e ingenio no está asegurada, así que la posición no se reporta: se calcula con datos que ya están en el ingenio.

- ubicación **precargada** de cada finca y del ingenio;
- tiempo de viaje **precargado** por finca;
- hora de salida, registrada por el backend al cambiar el estado del turno.

Con eso el frontend anima el viaje por su cuenta. Si se corta la conexión con la finca, el mapa sigue avanzando según la estimación.

## Qué hay hoy y qué falta

| Dato | En `openapi.yaml` | En el backend | Necesario para |
|---|---|---|---|
| Estado del turno | ✅ `status` | ✅ `Turno.Status` | Saber si está en la finca, viajando o en el ingenio |
| Patente y finca | ✅ `truck.plate`; `farm.name` solo en el detalle | ✅ | Etiqueta del camión |
| Ubicación de la finca | ❌ `farm` es `{ id, name }` | 🟠 `Finca.LocationReference`, texto libre (seed: "Ruta 9, km 12"). **No son coordenadas.** | Origen del viaje |
| Ubicación del ingenio | ❌ | ❌ `Ingenio` solo tiene `Name` y `TimeZoneId` | Destino del viaje |
| Tiempo de viaje por finca | ❌ | ❌ | Duración de la simulación |
| Hora de salida | ❌ | ❌ `Turno.SetStatus` no registra cuándo cambia; solo hay `CreatedAt` | Inicio de la simulación |
| Hora estimada de llegada | ❌ | ❌ | Fin de la simulación |
| Zona horaria | — | ✅ `Ingenio.TimeZoneId` (`America/Argentina/Tucuman`) | Mostrar horas locales del ingenio |

🟠 = existe en el backend, falta exponerlo.

## Datos que tendría que precargar el backend

### Ingenio

| Campo | Tipo | Ejemplo | Notas |
|---|---|---|---|
| `location.lat` | número, grados decimales | `-26.82` | WGS84 |
| `location.lon` | número, grados decimales | `-65.22` | WGS84 |

### Finca

| Campo | Tipo | Ejemplo | Notas |
|---|---|---|---|
| `location.lat` / `location.lon` | número | `-26.95` / `-65.35` | Punto de carga, no el centro del campo. Campos nuevos: `LocationReference` es texto y se mantiene como descripción. |
| `estimatedTravelMinutes` | entero > 0 | `55` | Tiempo cargado finca → ingenio. Precargado, no calculado por distancia en línea recta (caminos de tierra, pendientes, cruces). |
| `route` (opcional) | lista de puntos `[lat, lon]` | — | Solo si se quiere dibujar el camino real; si falta, se dibuja una curva entre origen y destino. |

Encaja con los datos maestros de fincas (B11–B24 / F04). Falta definir quién carga y corrige estos valores y con qué permiso (OD por definir).

## Datos que tendría que registrar el backend por viaje

| Campo | Cuándo se fija | Notas |
|---|---|---|
| `departedAt` | Al pasar a `EN_CAMINO` | Hora en que la **API** registró la transición, en UTC. Requiere que `Turno` guarde la hora de los cambios de estado (hoy no lo hace). |
| `estimatedArrivalAt` | Al mismo tiempo | `departedAt + estimatedTravelMinutes`. Calculado en el backend, no en el front (ADR-003). |
| `arrivedAt` | Al pasar a `EN_ESPERA` | Permite medir el desvío real contra la estimación (sirve para reportes y para ajustar tiempos). |

## Forma candidata en el contrato

Agregar un objeto `trip` al **listado** de turnos (`AppointmentSummary`) para que el mapa no pida el detalle de cada camión:

```json
{
  "id": "…",
  "truck": { "id": "…", "plate": "AF123BC" },
  "window": { "startAt": "…", "endAt": "…" },
  "status": "EN_CAMINO",
  "trip": {
    "farm": { "id": "…", "name": "Finca La Trinidad" },
    "origin":      { "lat": -26.95, "lon": -65.35 },
    "destination": { "lat": -26.82, "lon": -65.22 },
    "departedAt":         "2026-10-16T13:05:00Z",
    "estimatedArrivalAt": "2026-10-16T14:00:00Z",
    "arrivedAt": null
  }
}
```

- `trip` es `null` mientras la finca no tenga ubicación cargada. En ese caso el camión no se dibuja en el mapa (sigue en la cola).
- Antes de `EN_CAMINO`, `departedAt` y `estimatedArrivalAt` van en `null`.
- Ejemplo con valores inventados: no son fincas ni coordenadas reales.

## Qué hace el frontend

1. Consulta `GET /api/v1/appointments` cada 4 s, como hoy la cola.
2. Proyecta las coordenadas sobre un mapa **SVG esquemático** (estilo de la landing), sin tiles ni servicios externos.
3. Cada segundo recalcula, en el navegador:

   ```
   avance = (ahora − departedAt) / (estimatedArrivalAt − departedAt)
   ```

   y ubica al camión en ese punto del tramo finca → ingenio.

| Estado en la API | Qué muestra el mapa |
|---|---|
| `ASIGNADO` | Quieto en la finca |
| `EN_CAMINO`, dentro del tiempo estimado | Moviéndose, etiqueta **"posición estimada"** |
| `EN_CAMINO`, pasada la hora estimada | Quieto cerca del ingenio, marca **"demorado respecto a la estimación"**. Nunca se da por llegado. |
| `EN_ESPERA`, `INGRESADO`, `EN_DESCARGA` | En el ingenio (confirmado por la API) |
| `FINALIZADO`, `CANCELADO` | No se muestra |

El frontend **no** calcula tiempos de viaje ni corrige la llegada estimada: solo interpola entre dos horas que da la API. Como todas las pantallas usan las mismas horas, todas muestran al camión en el mismo lugar, aunque se recargue la página.

## Preguntas abiertas

1. **¿Qué tramo representa `EN_CAMINO`?** La herramienta "Report En Camino" del workflow (PR #79) lo describe como que el camión *salió hacia la finca*. Si es así, hay dos viajes (ingenio → finca vacío y finca → ingenio cargado) y hace falta otro estado o evento que marque la salida cargada desde la finca. Esto lo define la máquina de estados (B28), no el mapa.
2. **¿Qué hora se usa como salida?** Si el transportista avisa por WhatsApp sin señal, el mensaje puede llegar tarde y la API lo registra al recibirlo. Hay que decidir si alcanza con la hora de recepción o si se toma la hora del mensaje del proveedor (con su validación, ver #88 y OD-008).
3. **¿Quién marca la salida?** El chatbot (transportista), el operador del ingenio, o ambos. Afecta permisos y auditoría.
4. **¿Se ajusta el tiempo estimado?** Por horario, clima o estado del camino, o queda fijo por finca. Si cambia, lo cambia el backend.
5. **¿Quién mantiene coordenadas y tiempos?** Carga inicial en el seed vs. edición desde la UI (F04), y permiso requerido.
6. **¿Se guarda `arrivedAt` para reportes?** Permitiría comparar estimado contra real por finca.

## Fuera de alcance

- GPS o ubicación compartida por WhatsApp.
- Cálculo de rutas o tiempos con servicios externos (Google Maps, OSRM).
- Notificaciones al transportista basadas en la posición estimada.
- Mapas con tiles; se puede evaluar después.

## Camino de aprobación

1. Revisar las preguntas abiertas con backend, chatbot y frontend.
2. Cambio OpenSpec en `openspec/changes/` y ampliación de `openapi.yaml` (`trip` en el listado, ubicación y tiempo en fincas).
3. Backend: datos maestros de fincas e ingenio, registro de `departedAt`/`arrivedAt`, cálculo de `estimatedArrivalAt`.
4. Frontend: componente de mapa contra el contrato aprobado. Mientras la API no envíe `trip`, la sección se muestra como no disponible.
