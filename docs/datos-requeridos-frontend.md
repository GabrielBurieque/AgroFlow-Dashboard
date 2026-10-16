# Datos que necesita el frontend de la API y el chatbot

**Corte:** 2026-10-16 · **Repositorio de referencia:** [`agustinvallante/AgroFlow`](https://github.com/agustinvallante/AgroFlow) en `main` [`92a80c1`](https://github.com/agustinvallante/AgroFlow/tree/92a80c1b81d3f456d1ca46224f7e73602bfc99db): contrato [`docs/contracts/openapi.yaml`](https://github.com/agustinvallante/AgroFlow/blob/92a80c1b81d3f456d1ca46224f7e73602bfc99db/docs/contracts/openapi.yaml) `0.3.0` y código de `backend/` (entidades de `AgroFlow.Domain`, controladores y seed) · **Frontend:** rama `feat/historial-conversaciones-propuesto`.

Inventario de lo que el dashboard necesita recibir para cada sección. El frontend **muestra solo datos de la API**: una sección sin endpoint aparece como "no disponible" y no calcula reglas de negocio (ADR-003). Este documento no aprueba contratos; lo marcado como faltante necesita su cambio OpenSpec y OpenAPI.

| Estado | Significado |
|---|---|
| ✅ Cumple | Está en `openapi.yaml` y el frontend ya lo consume. |
| 🟠 En backend, sin exponer | El dato existe en las entidades o el seed del backend, pero ninguna operación del contrato lo devuelve. |
| 🟡 Propuesto | Hay una propuesta escrita, no aprobada ni implementada. |
| ❌ Falta | No existe en el backend ni hay propuesta. |

## Resumen

| Sección | Estado | Fuente |
|---|---|---|
| Cola de turnos | ✅ | `/api/v1/appointments` |
| Panel general: turnos del día y camiones en curso | ✅ | `/api/v1/appointments` |
| Panel general: indicadores, molienda, avisos | ❌ | — |
| Panel general: franjas y cupo por ventana | 🟠 | Entidad `Ventana` (`Capacity`, `Occupied`) |
| Chatbot: historial de conversaciones | 🟡 | [AgroFlow#88](https://github.com/agustinvallante/AgroFlow/pull/88) |
| Chatbot: métricas, plantillas, flujo | ❌ | — |
| Mapa de viajes simulado | 🟡 | [propuesta-mapa-simulado.md](propuesta-mapa-simulado.md) |
| Transportistas, camiones, fincas | 🟠 | Entidades `Transportista`, `Camion`, `Finca`, `TransportistaCamion` (B11–B24) |
| Reportes | ❌ | — |
| Configuración | ❌ / 🟠 | Solo nombre y zona horaria del ingenio; duración y cupo de ventana son constantes del seed |
| Sesión, usuario e ingenio | 🟠 | `POST /api/auth/login` (JWT, fuera del contrato) y entidad `Ingenio` (B03, F01) |

## 1. Turnos ✅

Lo único que el contrato expone hoy, y lo que alimenta la cola y el panel general.

| Operación | Uso en el frontend |
|---|---|
| `POST /api/v1/appointments` | Alta manual: `carrierPhone`, `truckPlate`, `farmCode`, `cutAt`, `estimatedLoadTons`. |
| `GET /api/v1/appointments` | Cola con filtros `date`, `status`, `truckPlate`, `phone`. Polling cada 4 s. |
| `GET /api/v1/appointments/{id}` | Detalle: transportista, finca, corte, carga, creación. |
| `POST /api/v1/appointments/{id}/transitions` | Avanzar al estado siguiente o cancelar. |

Campos que se muestran: `id`, `truck.plate`, `carrier.name`, `farm.name`, `cutAt`, `estimatedLoadTons`, `window.startAt/endAt`, `status`, `createdAt`.

**Pendientes dentro de turnos:**

| Dato | Estado | Para qué | Notas |
|---|---|---|---|
| Resumen del listado con transportista, finca y carga | ❌ | Evitar pedir el detalle de cada fila | `AppointmentSummary` trae solo `id`, `truck`, `window`, `status`. El backlog sincronizado en #89 lo pide para F06. |
| Canal de asignación (bot o manual) | ❌ | Columna "Canal" y "% gestionado por el bot" | `Turno` no guarda el origen: el chatbot y el operador usan la misma operación. |
| Flota (propia o tercero) | 🟠 | Filtro y columna "Flota" | `Camion.FleetType` (`PROPIA`/`TERCEROS`) existe; falta agregarlo a `truck` en la respuesta. |
| Prioridad por corte | ❌ | Columna "Prioridad" y orden | La define el backend (ADR-004); `Turno` no la guarda ni la expone. El front no la deriva de `cutAt`. |
| Espera en canchón | ❌ | Columna "Espera" y alerta de espera prolongada | Requiere la hora de ingreso a `EN_ESPERA`. |
| Hora de cada cambio de estado | ❌ | Espera, mapa simulado, historial del turno | `Turno.SetStatus` cambia el estado sin registrar cuándo; solo existe `CreatedAt`. |
| Reasignar horario | ❌ | Acción "Reasignar" | No hay operación en el contrato. |

## 2. Panel general ❌

Indicadores que mostraba el prototipo y que hoy están ocultos.

| Dato | Para qué | Relación con el backlog |
|---|---|---|
| Camiones en espera ahora | Indicador | B35/B39, F07 |
| Espera promedio en canchón | Indicador | B35, F07 |
| % de turnos gestionados por el bot | Indicador | Necesita el canal de asignación |
| Franjas del día por ventana: camiones propios, de terceros y demorados | Timeline de la cola | B39, F07. 🟠 `Ventana` ya tiene `StartAt`, `EndAt`, `Capacity` y `Occupied` (seed: 30 min, cupo 2); falta exponerlo y desglosar por flota. |
| Estado de la molienda (operando o detenida) y capacidad (tn/h) | Indicador y control | B33–B34 (interrupciones), F08 |
| Detener o reanudar la molienda | Control operativo | B33–B34, F08 |
| Día de zafra y total de días | Encabezado | Configuración del ingenio. `Ingenio` no tiene estos datos. |
| Aviso manual a la flota por WhatsApp | Acción | B36–B37 (notificaciones) |

Los contadores que sí se muestran (turnos del día, en curso, finalizados, cancelados) se cuentan sobre el listado que devuelve la API.

## 3. Chatbot de WhatsApp

Datos que genera el chatbot (n8n + Evolution) y que el dashboard tiene que leer **desde la API de AgroFlow**, nunca desde n8n ni Evolution.

### Herramientas que el workflow ya usa (PR #79, no integrada)

| Herramienta del agente | Operación | Estado |
|---|---|---|
| Create Appointment | `POST /api/v1/appointments` | ✅ |
| Lookup Appointments By Phone | `GET /api/v1/appointments?phone=` | ✅ |
| Report En Camino | `POST /api/v1/appointments/{id}/transitions` (`EN_CAMINO`) | ✅ |

### Lo que necesita la vista Chatbot

| Dato | Estado | Detalle |
|---|---|---|
| Lista de conversaciones paginada | 🟡 #88 | `GET /api/v1/conversations?cursor&limit` |
| Mensajes de una conversación, paginados | 🟡 #88 | `GET /api/v1/conversations/{id}/events?cursor&limit` |
| Estado de envío de cada respuesta (pendiente, aceptado, falló, incierto) | 🟡 #88 | `sendStatus` del evento saliente |
| Transportista vinculado y nombre visible | 🟡 #88 | Solo si el backend verificó el vínculo (OD-008) |
| Estado de la conversación (resuelta, con el bot, escalada) | ❌ | La propuesta #88 no lo define |
| Métricas: mensajes del día, turnos asignados por el bot, tiempo de respuesta, escaladas | ❌ | Sin propuesta |
| Plantillas de mensajes (leer y guardar) | ❌ | Sin propuesta |
| Estado de conexión del canal | ❌ | La vista mostraba "Conectado" fijo; se quitó |

El adaptador para lo marcado 🟡 ya está escrito y apagado. Se habilita con `VITE_CONVERSATIONS_SOURCE=http`, y sus supuestos están en `src/infrastructure/http/dto/ConversationDto.ts`. Si el contrato aprobado cambia, solo se ajustan ese archivo y su mapper.

## 4. Mapa de viajes simulado 🟡

Viaje estimado finca → ingenio a partir de ubicaciones precargadas y una hora de salida, sin GPS. Los datos necesarios están en [propuesta-mapa-simulado.md](propuesta-mapa-simulado.md).

## 5. Transportistas, camiones y fincas 🟠

Las entidades existen en `backend/AgroFlow.Domain/Entities/` y se cargan por seed, pero no hay operaciones para leerlas ni editarlas.

| Dato | Para qué | En el backend |
|---|---|---|
| Transportista: nombre, WhatsApp, activo | Tabla | 🟠 `Transportista.Name`, `WhatsApp`, `IsActive` (también `DNI`) |
| Camión: patente, flota, activo | Tabla | 🟠 `Camion.Plate`, `FleetType`, `IsActive` |
| Asociación transportista ↔ camión | Mostrar la patente de cada transportista | 🟠 `TransportistaCamion` (puede haber varias activas) |
| Finca habitual del transportista | Columna | ❌ No hay relación transportista ↔ finca |
| Turnos del mes por transportista | Columna | ❌ Derivable de `Turno`, sin operación |
| Fincas: código, nombre, referencia de ubicación, activa | Alta de turno, mapa | 🟠 `Finca.Code`, `Name`, `LocationReference` (texto, p. ej. "Ruta 9, km 12"), `IsActive` |
| Alta, edición, inhabilitación | Formularios y acciones | 🟠 Los métodos de dominio existen (`Update`, `Inactivate`, `Reactivate`); falta la API |

Corresponde a B11–B24 y B38 (backend) y F02–F05 (frontend). La PR #47 tiene una fundación `[NonController]` que todavía no publica estas rutas.

## 6. Reportes ❌

| Dato | Para qué |
|---|---|
| Rango: semana, mes o zafra | Selector |
| Espera promedio, reducción vs. asignación manual, turnos totales, % por el bot | Indicadores |
| Espera promedio por día | Gráfico de barras |
| Distribución de flota propia y de terceros | Gráfico de torta |
| Fincas con mayor espera y su tendencia | Tabla |

Según #89, reportes requieren su propio cambio aprobado.

## 7. Configuración ❌

| Dato | Para qué |
|---|---|
| Ingenio: nombre, capacidad de molienda, duración de zafra, horario operativo | Formulario. 🟠 Solo existen `Ingenio.Name` y `TimeZoneId`. |
| Reglas: duración de ventana, horas para prioridad alta, priorizar flota propia, reasignación automática | Formulario. 🟠 Duración (30 min) y cupo (2) de ventana son constantes del seed, no configuración. |
| Integración n8n: URL del webhook y prueba de conexión | Panel |
| Notificaciones: aviso de demora, resumen diario, alerta de espera prolongada | Opciones |
| Usuarios: nombre, rol, turno, activo | Tabla |

ADR-004 fija parte de estas reglas por ingenio al arranque. Según #89, la configuración editable requiere su propio cambio aprobado.

## 8. Sesión, usuario e ingenio 🟠

| Dato | Para qué | En el backend |
|---|---|---|
| Usuario autenticado: nombre y rol | Pie del menú (antes "María Costas", fijo) | 🟠 `POST /api/auth/login` devuelve un JWT con usuario y rol (Identity). No está en `openapi.yaml`. |
| Ingenio activo y los habilitados para el usuario | Selector del menú (antes "Ingenio San Ramón", fijo) | 🟠 Entidad `Ingenio` (seed: "Ingenio Demo"); el usuario no está vinculado a un ingenio. |
| Permisos por rol | Mostrar u ocultar acciones | ❌ |

**Bloqueo:** fuera del perfil `LocalDemo`, `AppointmentsAuthorizationPolicy` deniega `/api/v1/appointments` aunque haya un JWT válido, y el controlador no se publica. Hoy el frontend solo funciona contra `LocalDemo` y no envía el header `Authorization`. Además, CORS solo admite `http://localhost:5173`. Corresponde a B03, B10 y F01.

## Orden sugerido

1. **Turnos del MVP** (B25–B29, F06): resumen enriquecido, flota del camión, hora de cada cambio de estado, canal y prioridad. Desbloquea columnas de la cola, la espera y el mapa.
2. **Sesión e ingenio** (B03, B10, F01): sin esto, el frontend no puede usarse fuera de `LocalDemo`.
3. **Exponer los datos maestros que ya existen** (B11–B24): transportistas, camiones, fincas. Agregar coordenadas y tiempo de viaje a las fincas para el mapa.
4. **Indicadores del panel** (B35, B39, F07).
5. **Historial de conversaciones** (#88), si se aprueba.
