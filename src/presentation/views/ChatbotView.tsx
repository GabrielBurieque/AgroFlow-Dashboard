import { container, type CasosConversaciones } from "../../composition/container";
import { useChatbot } from "../hooks/useChatbot";
import { ConversationList } from "../components/chatbot/ConversationList";
import { ChatTranscript } from "../components/chatbot/ChatTranscript";
import { ErrorState, LoadingState } from "../components/common/StatusStates";
import { SeccionNoDisponible } from "../components/common/SeccionNoDisponible";

export function ChatbotView() {
  // El historial todavía no está en openapi.yaml: sin la variable que lo
  // habilita no hay de dónde leer conversaciones.
  if (!container.conversaciones) return <SeccionNoDisponible titulo="Chatbot de WhatsApp" />;
  return <HistorialConversaciones casos={container.conversaciones} />;
}

function HistorialConversaciones({ casos }: { casos: CasosConversaciones }) {
  const {
    conversaciones,
    hayMasConversaciones,
    cargandoMasConversaciones,
    cargarMasConversaciones,
    conversacionActiva,
    hiloActivo,
    cargarMensajesAnteriores,
    seleccionarConversacion,
    cargando,
    error,
  } = useChatbot(casos);

  if (error) return <ErrorState message={error} />;
  if (cargando) return <LoadingState label="Cargando conversaciones..." />;

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <h1>Chatbot de WhatsApp</h1>
          <div className="zafra">Historial de conversaciones · {container.conversacionesApiUrl}</div>
        </div>
      </div>

      <section>
        <div className="section-head">
          <h2>Conversaciones</h2>
        </div>
        <div className="chat-layout">
          <ConversationList
            conversaciones={conversaciones}
            activaId={conversacionActiva?.id ?? null}
            onSeleccionar={seleccionarConversacion}
            hayMas={hayMasConversaciones}
            cargandoMas={cargandoMasConversaciones}
            onCargarMas={cargarMasConversaciones}
          />
          <ChatTranscript
            conversacion={conversacionActiva}
            hilo={hiloActivo}
            onCargarAnteriores={cargarMensajesAnteriores}
          />
        </div>
      </section>
    </div>
  );
}
