import type { Conversacion } from "../../../domain/entities/Conversacion";

interface ConversationListProps {
  conversaciones: Conversacion[];
  activaId: string | null;
  onSeleccionar: (id: string) => void;
  hayMas: boolean;
  cargandoMas: boolean;
  onCargarMas: () => void;
}

export function ConversationList({
  conversaciones,
  activaId,
  onSeleccionar,
  hayMas,
  cargandoMas,
  onCargarMas,
}: ConversationListProps) {
  return (
    <div className="conv-list">
      {conversaciones.length === 0 && <div className="conv-empty">Todavía no hay conversaciones.</div>}
      {conversaciones.map((c) => (
        <div
          key={c.id}
          className={`conv-item ${c.id === activaId ? "active" : ""}`}
          onClick={() => onSeleccionar(c.id)}
        >
          <div className="conv-top">
            <span>{c.nombre}</span>
            <span className="conv-time">{c.hora}</span>
          </div>
          <div className="conv-prev">{c.preview}</div>
        </div>
      ))}
      {hayMas && (
        <div className="conv-more">
          <button className="btn-mini" onClick={onCargarMas} disabled={cargandoMas}>
            {cargandoMas ? "Cargando..." : "Cargar más conversaciones"}
          </button>
        </div>
      )}
    </div>
  );
}
