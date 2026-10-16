import { HttpTurnoRepository } from "../infrastructure/http/repositories/HttpTurnoRepository";
import { HttpConversacionRepository } from "../infrastructure/http/repositories/HttpConversacionRepository";

import {
  AvanzarEstadoTurno,
  CancelarTurno,
  CrearTurnoManual,
  ObtenerDetalleTurno,
  ObtenerTurnosDelDia,
} from "../application/usecases/turnos/TurnoUseCases";
import {
  ObtenerConversaciones,
  ObtenerMensajesConversacion,
} from "../application/usecases/conversaciones/ConversacionUseCases";

/**
 * Raíz de composición: el único archivo que decide qué implementación
 * concreta se usa. El dashboard muestra únicamente datos de AgroFlow API;
 * no hay repositorios mock ni datos de ejemplo.
 *
 *   VITE_API_URL                   → AgroFlow API (por defecto http://localhost:5000)
 *   VITE_CONVERSATIONS_SOURCE=http → habilita el historial de conversaciones
 *                                    contra los endpoints PROPUESTOS (AgroFlow#88),
 *                                    en VITE_CONVERSATIONS_API_URL o VITE_API_URL.
 *                                    Va aparte porque la API todavía no los tiene:
 *                                    sin esta variable la sección queda no disponible.
 *
 * Panel de métricas, transportistas, reportes y configuración no tienen
 * endpoint en openapi.yaml y se muestran como no disponibles.
 */
function crearContainer() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
  const conversacionesApiUrl = import.meta.env.VITE_CONVERSATIONS_API_URL ?? apiUrl;

  const turnoRepository = new HttpTurnoRepository(apiUrl);

  const conversacionRepository =
    import.meta.env.VITE_CONVERSATIONS_SOURCE === "http"
      ? new HttpConversacionRepository(conversacionesApiUrl)
      : null;

  return {
    apiUrl,
    conversacionesApiUrl,
    turnos: {
      obtenerTurnosDelDia: new ObtenerTurnosDelDia(turnoRepository),
      obtenerDetalleTurno: new ObtenerDetalleTurno(turnoRepository),
      crearTurnoManual: new CrearTurnoManual(turnoRepository),
      cancelarTurno: new CancelarTurno(turnoRepository),
      avanzarEstadoTurno: new AvanzarEstadoTurno(turnoRepository),
    },
    /** null = la API no expone historial de conversaciones. */
    conversaciones: conversacionRepository && {
      obtenerConversaciones: new ObtenerConversaciones(conversacionRepository),
      obtenerMensajes: new ObtenerMensajesConversacion(conversacionRepository),
    },
  };
}

export const container = crearContainer();
export type Container = typeof container;
export type CasosConversaciones = NonNullable<Container["conversaciones"]>;
