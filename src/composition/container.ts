import { HttpTurnoRepository } from "../infrastructure/http/repositories/HttpTurnoRepository";

import {
  AvanzarEstadoTurno,
  CancelarTurno,
  CrearTurnoManual,
  ObtenerDetalleTurno,
  ObtenerTurnosDelDia,
} from "../application/usecases/turnos/TurnoUseCases";

/**
 * Raíz de composición: el único archivo que decide qué implementación
 * concreta se usa. El dashboard muestra únicamente datos de AgroFlow API;
 * no hay repositorios mock ni datos de ejemplo.
 *
 *   VITE_API_URL → AgroFlow API (por defecto http://localhost:5000)
 *
 * Panel de métricas, chatbot, transportistas, reportes y configuración no
 * tienen endpoint en openapi.yaml y se muestran como no disponibles.
 */
function crearContainer() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

  const turnoRepository = new HttpTurnoRepository(apiUrl);

  return {
    apiUrl,
    turnos: {
      obtenerTurnosDelDia: new ObtenerTurnosDelDia(turnoRepository),
      obtenerDetalleTurno: new ObtenerDetalleTurno(turnoRepository),
      crearTurnoManual: new CrearTurnoManual(turnoRepository),
      cancelarTurno: new CancelarTurno(turnoRepository),
      avanzarEstadoTurno: new AvanzarEstadoTurno(turnoRepository),
    },
  };
}

export const container = crearContainer();
export type Container = typeof container;
