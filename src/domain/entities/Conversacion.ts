/**
 * Estado del envío de una respuesta del bot. "aceptado" significa que el
 * proveedor (Evolution) tomó el mensaje, NO que el transportista lo recibió
 * o lo leyó. "incierto" = no se sabe si salió (p. ej. timeout del envío).
 */
export type EstadoEnvio = "pendiente" | "aceptado" | "fallido" | "incierto";

export interface MensajeChat {
  id: string;
  autor: "transportista" | "bot";
  texto: string;
  hora: string;
  /** Solo para mensajes del bot. */
  estadoEnvio?: EstadoEnvio;
}

/**
 * Resumen para la lista. Los mensajes se piden aparte y paginados
 * (ConversacionRepository.obtenerMensajes), no vienen embebidos.
 */
export interface Conversacion {
  id: string;
  nombre: string;
  hora: string;
  preview: string;
}
