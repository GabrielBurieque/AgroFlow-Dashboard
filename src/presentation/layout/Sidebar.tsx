import { VISTAS, type VistaId } from "./vistas";
import logo from "../../assets/logo.png";
import { container } from "../../composition/container";

/** Vistas cuyos datos expone hoy la API; el resto queda atenuado. */
const CON_DATOS: Record<VistaId, boolean> = {
  general: true,
  cola: true,
  chatbot: container.conversaciones !== null,
  transportistas: false,
  reportes: false,
  config: false,
};

interface SidebarProps {
  vistaActiva: VistaId;
  onCambiarVista: (vista: VistaId) => void;
}

export function Sidebar({ vistaActiva, onCambiarVista }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">
          <img src={logo} alt="AgroFlow" width={200} height={38} />
        </div>
        <div className="brand-sub">Control de Playa</div>
      </div>

      <nav>
        {VISTAS.map((vista) => (
          <div
            key={vista.id}
            className={`nav-item ${vista.id === vistaActiva ? "active" : ""} ${CON_DATOS[vista.id] ? "" : "sin-datos"}`}
            onClick={() => onCambiarVista(vista.id)}
            title={CON_DATOS[vista.id] ? undefined : "Sin datos en la API"}
          >
            {vista.id === vistaActiva && <span className="dot" />}
            {vista.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        AgroFlow API · {container.apiUrl}
        {container.conversaciones && (
          <>
            <br />
            Conversaciones: endpoints propuestos · {container.conversacionesApiUrl}
          </>
        )}
      </div>
    </aside>
  );
}
