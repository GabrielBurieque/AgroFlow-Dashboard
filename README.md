# Frontend de AgroFlow

Aplicación web de AgroFlow, incorporada desde el prototipo
[AgroFlow-Dashboard](https://github.com/GabrielBurieque/AgroFlow-Dashboard).

Antes de implementar una pantalla o flujo, consultar:

- [especificaciones vigentes](../openspec/specs/);
- [documentación específica del frontend](../docs/frontend/README.md);
- [contratos compartidos](../docs/contracts/README.md);
- [catálogo de casos de uso](../docs/product/use-case-catalog.md).

El frontend no debe recrear reglas de asignación, prioridad o transiciones de
estado. Esas decisiones pertenecen al backend y deben consumirse mediante
contratos explícitos.

---

# AgroFlow — Panel del Ingenio (frontend)

Panel de administración de AgroFlow, construido con **React + TypeScript +
Vite** y organizado en **Clean Architecture**.

El dashboard muestra **únicamente datos de AgroFlow API**. No hay repositorios
mock ni datos de ejemplo: si la API no expone algo, la pantalla lo dice en vez
de inventarlo.

## Cómo correrlo

```bash
npm install
npm run dev       # entorno de desarrollo
npm run build     # build de producción (queda en dist/)
npm run preview   # sirve el build de producción localmente
```

Necesita AgroFlow API corriendo (ver [Configuración](#configuración)).

## Configuración

Copiar `.env.example` como `.env` (o `.env.local`):

```env
VITE_API_URL=http://localhost:5000
```

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL de AgroFlow API vista desde el navegador. Por defecto `http://localhost:5000`. |

Reiniciar `npm run dev` después de cambiar el `.env`.

## Qué consume de la API

`src/infrastructure/http/repositories/HttpTurnoRepository.ts` implementa el
puerto `TurnoRepository` contra `docs/contracts/openapi.yaml` del repositorio
AgroFlow:

| Acción del dashboard                                              | Operación                                    |
| ----------------------------------------------------------------- | -------------------------------------------- |
| Alta manual (teléfono, patente, código de finca, corte, carga)    | `POST /api/v1/appointments`                  |
| Cola, filtros de estado/fecha/patente/teléfono y polling cada 4 s | `GET /api/v1/appointments`                   |
| Detalle (clic en una fila)                                        | `GET /api/v1/appointments/{id}`              |
| Avanzar / Cancelar                                                | `POST /api/v1/appointments/{id}/transitions` |

El dashboard no calcula prioridad, ventana ni capacidad. Ante un error
(`400`, `404`, `409`, `500` o sin conexión) muestra el mensaje y recarga el
estado vigente.

### Estado de cada sección

| Sección | Fuente |
|---|---|
| Panel general | Turnos de la API: contadores del día y camiones en curso. |
| Cola de turnos | Turnos de la API. |
| Chatbot WhatsApp, Transportistas, Reportes, Configuración | No disponibles: `openapi.yaml` no tiene endpoints para estos datos. Aparecen atenuadas en el menú. |

Cuando el contrato incorpore una de estas capacidades, se agrega su repositorio
HTTP en `infrastructure/http/`, se conecta en `composition/container.ts` y se
reemplaza la vista "no disponible".

## Estructura de carpetas (Clean Architecture)

```
src/
├── domain/                  → Entidades y contratos (puertos). No depende de nada.
│   ├── entities/             Turno
│   └── repositories/         Interfaces: TurnoRepository
│
├── application/              → Casos de uso. Orquestan usando los puertos.
│   └── usecases/              ObtenerTurnosDelDia, CrearTurnoManual, AvanzarEstadoTurno, etc.
│
├── infrastructure/
│   └── http/                  Implementaciones contra AgroFlow API.
│       ├── ApiClient.ts         URL base y traducción de errores (problem+json)
│       ├── dto/                 Formas de la API (AppointmentDto)
│       ├── mappers/             DTO ↔ entidades de dominio
│       └── repositories/        HttpTurnoRepository
│
├── composition/
│   └── container.ts           Raíz de composición: ÚNICO archivo que decide qué
│                               implementación se usa y qué secciones tienen datos.
│
├── presentation/               → React. Todo lo visual.
│   ├── layout/                 Sidebar, definición de vistas
│   ├── views/                  Una por sección del menú
│   ├── components/             Piezas reutilizables (badges, estados, etc)
│   ├── hooks/                  useColaTurnos, useClock
│   └── styles/                 Tokens de diseño (variables CSS) y hoja global
│
└── shared/
    └── utils/                  Utilidades sin lógica de negocio (fechas)
```

## La regla de dependencia

```
presentation  →  application  →  domain  ←  infrastructure
```

- `domain` no importa nada de las otras capas: son las entidades y los
  contratos (interfaces) puros.
- `application` (casos de uso) sólo conoce las interfaces de `domain`, nunca una
  implementación concreta.
- `infrastructure` implementa esas interfaces contra AgroFlow API.
- `presentation` (componentes y hooks de React) sólo llama a los casos de uso
  a través de `composition/container.ts`.

## Convenciones de la UI

- Los estilos siguen los tokens de diseño definidos en
  `src/presentation/styles/tokens.css` (paleta agroindustrial: verde caña,
  ámbar azúcar, papel crema) y la tipografía Fraunces (títulos) + IBM Plex
  Sans/Mono (datos).
- Cada vista con datos tiene su hook en `presentation/hooks/`, que centraliza
  el estado de carga, error y las acciones (crear, avanzar, cancelar).
- Nunca se muestran datos de ejemplo: una sección sin endpoint usa
  `SeccionNoDisponible`.
