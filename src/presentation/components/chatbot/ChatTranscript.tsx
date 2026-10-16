import type { Conversacion, EstadoEnvio } from "../../../domain/entities/Conversacion";
import type { HiloMensajes } from "../../hooks/useChatbot";

/**
 * "aceptado" no lleva etiqueta: es el caso normal y mostrar "entregado"
 * sería afirmar algo que el proveedor no confirmó.
 */
const ENVIO_LABEL: Partial<Record<EstadoEnvio, string>> = {
  pendiente: "envío pendiente",
  fallido: "no se pudo enviar",
  incierto: "envío sin confirmar",
};

interface ChatTranscriptProps {
  conversacion: Conversacion | null;
  hilo: HiloMensajes;
  onCargarAnteriores: () => void;
}

export function ChatTranscript({ conversacion, hilo, onCargarAnteriores }: ChatTranscriptProps) {
  const meta = conversacion ? `Último mensaje ${conversacion.hora}` : "Seleccioná una conversación";

  return (
    <div className="chat-transcript">
      <div className="chat-transcript-head">
        <strong>{conversacion?.nombre ?? "—"}</strong>
        <span>{meta}</span>
      </div>
      <div className="chat-transcript-body">
        {conversacion && hilo.cursorAnteriores && (
          <button className="btn-mini chat-anteriores" onClick={onCargarAnteriores} disabled={hilo.cargando}>
            {hilo.cargando ? "Cargando..." : "Ver mensajes anteriores"}
          </button>
        )}
        {conversacion && hilo.cargando && hilo.mensajes.length === 0 && (
          <div className="chat-aviso">Cargando mensajes...</div>
        )}
        {hilo.error && <div className="chat-aviso error">{hilo.error}</div>}
        {hilo.mensajes.map((m) => {
          const envio = m.estadoEnvio && ENVIO_LABEL[m.estadoEnvio];
          return (
            <div className={`msg ${m.autor === "transportista" ? "in" : "out"}`} key={m.id}>
              <span className="who">
                {m.autor === "transportista" ? "Transportista" : "Bot AgroFlow"} · {m.hora}
                {envio && <em className={`envio ${m.estadoEnvio}`}> · {envio}</em>}
              </span>
              {m.texto}
            </div>
          );
        })}
      </div>
    </div>
  );
}
