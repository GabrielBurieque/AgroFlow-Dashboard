import type { Conversacion, EstadoEnvio, MensajeChat } from "../../../domain/entities/Conversacion";
import type { Pagina } from "../../../domain/entities/Pagina";
import { horaDeIso } from "../../../shared/utils/date";
import type {
  ConversationEventDto,
  ConversationSummaryDto,
  CursorPageDto,
  SendStatusDto,
} from "../dto/ConversationDto";

const ESTADO_ENVIO: Record<SendStatusDto, EstadoEnvio> = {
  pending_send: "pendiente",
  accepted: "aceptado",
  failed: "fallido",
  uncertain: "incierto",
};

/**
 * Sin vínculo verificado no se muestra la dirección completa: se enmascara
 * y, si es un LID de WhatsApp, se aclara que no es un teléfono.
 */
function nombreVisible(dto: ConversationSummaryDto): string {
  if (dto.transportistaName) return dto.transportistaName;
  const [local, dominio] = dto.remoteAddress.split("@");
  const sufijo = `··${local.slice(-4)}`;
  return dominio === "lid" ? `Contacto sin verificar ${sufijo}` : `WhatsApp ${sufijo}`;
}

export function mapPagina<D, T>(dto: CursorPageDto<D>, map: (item: D) => T): Pagina<T> {
  return { items: dto.items.map(map), siguienteCursor: dto.nextCursor };
}

export function mapConversacion(dto: ConversationSummaryDto): Conversacion {
  return {
    id: dto.id,
    nombre: nombreVisible(dto),
    hora: horaDeIso(dto.lastMessageAtUtc),
    preview: dto.lastMessagePreview ?? "",
  };
}

export function mapMensaje(dto: ConversationEventDto): MensajeChat {
  const esBot = dto.direction === "outbound";
  return {
    id: dto.eventId,
    autor: esBot ? "bot" : "transportista",
    texto: dto.text ?? "(texto no disponible)",
    hora: horaDeIso(dto.providerTimestamp ?? dto.persistedAt),
    estadoEnvio: esBot && dto.sendStatus ? ESTADO_ENVIO[dto.sendStatus] : undefined,
  };
}
