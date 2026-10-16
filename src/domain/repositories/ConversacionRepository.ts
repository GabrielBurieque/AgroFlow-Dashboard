import type { Conversacion, MensajeChat } from "../entities/Conversacion";
import type { Pagina } from "../entities/Pagina";

export interface ConversacionRepository {
  /** Conversaciones de la más reciente a la más antigua. */
  obtenerConversaciones(cursor?: string): Promise<Pagina<Conversacion>>;
  /**
   * Mensajes en orden cronológico. Sin cursor trae los más recientes;
   * siguienteCursor apunta a los ANTERIORES.
   */
  obtenerMensajes(conversacionId: string, cursor?: string): Promise<Pagina<MensajeChat>>;
}
