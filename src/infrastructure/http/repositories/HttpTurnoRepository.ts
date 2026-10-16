import type { FiltrosTurno, NuevoTurnoManual, Turno } from "../../../domain/entities/Turno";
import type { TurnoRepository } from "../../../domain/repositories/TurnoRepository";
import { ApiClient } from "../ApiClient";
import type {
  AppointmentDto,
  AppointmentStatusDto,
  AppointmentSummaryDto,
  TransitionAppointmentRequestDto,
} from "../dto/AppointmentDto";
import {
  combinarResumenYDetalle,
  mapAppointment,
  toCreateAppointmentRequest,
  toListQuery,
} from "../mappers/appointmentMapper";

const BASE = "/api/v1/appointments";

/**
 * Secuencia operativa de openapi.yaml. El contrato exige indicar newStatus,
 * así que "Avanzar" pide el siguiente estado del estado VIGENTE que devuelve
 * la API en ese momento. La API sigue siendo quien valida: si el turno ya
 * cambió, responde 409 INVALID_TRANSITION y la UI recarga.
 */
const SIGUIENTE_ESTADO: Partial<Record<AppointmentStatusDto, AppointmentStatusDto>> = {
  ASIGNADO: "EN_CAMINO",
  EN_CAMINO: "EN_ESPERA",
  EN_ESPERA: "INGRESADO",
  INGRESADO: "EN_DESCARGA",
  EN_DESCARGA: "FINALIZADO",
};

/**
 * Implementa TurnoRepository contra AgroFlow API (docs/contracts/openapi.yaml).
 * Es la única fuente de turnos del dashboard.
 */
export class HttpTurnoRepository implements TurnoRepository {
  private readonly api: ApiClient;
  /**
   * Transportista, finca, corte y carga no cambian después del alta, así que
   * el detalle se pide una sola vez por turno y el polling solo trae el listado.
   */
  private readonly detalles = new Map<string, AppointmentDto>();

  constructor(baseUrl: string) {
    this.api = new ApiClient(baseUrl);
  }

  async obtenerTurnosDelDia(filtros?: FiltrosTurno): Promise<Turno[]> {
    const query = toListQuery(filtros);
    if (!query) return [];

    const resumenes = await this.api.get<AppointmentSummaryDto[]>(BASE, query);
    const turnos = await Promise.all(
      resumenes.map(async (resumen) => {
        const detalle = this.detalles.get(resumen.id) ?? (await this.pedirDetalle(resumen.id));
        return combinarResumenYDetalle(resumen, detalle);
      })
    );
    return turnos;
  }

  async obtenerTurno(id: string): Promise<Turno> {
    return mapAppointment(await this.pedirDetalle(id));
  }

  async crearTurnoManual(datos: NuevoTurnoManual): Promise<Turno> {
    const creado = await this.api.post<AppointmentDto>(BASE, toCreateAppointmentRequest(datos));
    this.detalles.set(creado.id, creado);
    return mapAppointment(creado);
  }

  async avanzarEstado(id: string): Promise<Turno> {
    const vigente = await this.pedirDetalle(id);
    const siguiente = SIGUIENTE_ESTADO[vigente.status];
    if (!siguiente) {
      throw new Error("El turno ya está finalizado o cancelado; no tiene un estado siguiente.");
    }
    return this.transicionar(id, siguiente);
  }

  async cancelarTurno(id: string): Promise<Turno> {
    return this.transicionar(id, "CANCELADO");
  }

  private async pedirDetalle(id: string): Promise<AppointmentDto> {
    const detalle = await this.api.get<AppointmentDto>(`${BASE}/${encodeURIComponent(id)}`);
    this.detalles.set(id, detalle);
    return detalle;
  }

  private async transicionar(id: string, newStatus: AppointmentStatusDto): Promise<Turno> {
    const body: TransitionAppointmentRequestDto = { newStatus };
    const actualizado = await this.api.post<AppointmentDto>(
      `${BASE}/${encodeURIComponent(id)}/transitions`,
      body
    );
    this.detalles.set(id, actualizado);
    return mapAppointment(actualizado);
  }
}
