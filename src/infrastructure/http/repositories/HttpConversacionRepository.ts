import type { Conversacion, MensajeChat } from "../../../domain/entities/Conversacion";
import type { Pagina } from "../../../domain/entities/Pagina";
import type { ConversacionRepository } from "../../../domain/repositories/ConversacionRepository";
import { ApiClient } from "../ApiClient";
import type { ConversationEventDto, ConversationSummaryDto, CursorPageDto } from "../dto/ConversationDto";
import { mapConversacion, mapMensaje, mapPagina } from "../mappers/conversationMapper";

const BASE = "/api/v1/conversations";
const LIMITE_CONVERSACIONES = "20";
const LIMITE_MENSAJES = "30";

/**
 * Historial de conversaciones contra los endpoints PROPUESTOS en
 * agustinvallante/AgroFlow#88 (ver dto/ConversationDto.ts). Hasta que
 * existan, el container solo lo usa con VITE_CONVERSATIONS_SOURCE=http.
 */
export class HttpConversacionRepository implements ConversacionRepository {
  private readonly api: ApiClient;

  constructor(baseUrl: string) {
    this.api = new ApiClient(baseUrl);
  }

  async obtenerConversaciones(cursor?: string): Promise<Pagina<Conversacion>> {
    const data = await this.api.get<CursorPageDto<ConversationSummaryDto>>(BASE, {
      cursor,
      limit: LIMITE_CONVERSACIONES,
    });
    return mapPagina(data, mapConversacion);
  }

  async obtenerMensajes(conversacionId: string, cursor?: string): Promise<Pagina<MensajeChat>> {
    const data = await this.api.get<CursorPageDto<ConversationEventDto>>(
      `${BASE}/${encodeURIComponent(conversacionId)}/events`,
      { cursor, limit: LIMITE_MENSAJES },
    );
    return mapPagina(data, mapMensaje);
  }
}
