/**
 * PROPUESTA, NO CONTRATO. Estos endpoints todavía no existen en
 * docs/contracts/openapi.yaml. Siguen la propuesta de
 * docs/planning/propuesta-persistencia-conversaciones-whatsapp.md
 * (agustinvallante/AgroFlow#88):
 *
 *   GET /api/v1/conversations?cursor=…&limit=…
 *   GET /api/v1/conversations/{id}/events?cursor=…&limit=…
 *
 * Supuestos propios del frontend, a confirmar cuando se apruebe el contrato:
 *   - las páginas son { items, nextCursor } y nextCursor null = no hay más;
 *   - conversaciones de la más reciente a la más antigua;
 *   - eventos en orden cronológico dentro de la página, primera página =
 *     los más recientes, nextCursor = los anteriores;
 *   - transportistaName y lastMessagePreview los arma el backend.
 *
 * Si el contrato final difiere, se ajustan este archivo y
 * conversationMapper.ts; dominio, casos de uso y vistas no cambian.
 */

export interface CursorPageDto<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ConversationSummaryDto {
  id: string;
  /** remoteJid del canal. No es un teléfono verificado (puede ser @lid). */
  remoteAddress: string;
  /** Solo presentes si el backend verificó el vínculo con un transportista. */
  transportistaId: string | null;
  transportistaName: string | null;
  lastMessageAtUtc: string;
  lastMessagePreview: string | null;
}

export type ConversationDirectionDto = "inbound" | "outbound";

export type SendStatusDto = "pending_send" | "accepted" | "failed" | "uncertain";

export interface ConversationEventDto {
  eventId: string;
  direction: ConversationDirectionDto;
  contentType: "text";
  /** null si la política de privacidad (OD-009) no permite conservarlo. */
  text: string | null;
  /** Hora del proveedor: solo para mostrar, no define el orden. */
  providerTimestamp: string | null;
  persistedAt: string;
  /** Solo outbound. */
  sendStatus: SendStatusDto | null;
}
