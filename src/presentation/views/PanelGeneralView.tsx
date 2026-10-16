import { useMemo } from "react";
import { useColaTurnos } from "../hooks/useColaTurnos";
import { useClock } from "../hooks/useClock";
import { MetricCard } from "../components/common/MetricCard";
import { EstadoBadge } from "../components/common/Badges";
import { EmptyState, LoadingState, ErrorState } from "../components/common/StatusStates";

const ACTIVOS = ["viaje", "cancha", "ingresado", "descargando"];

/**
 * Todo lo que muestra sale de los turnos de AgroFlow API. Métricas de
 * espera, timeline, molienda y avisos no tienen endpoint y no se muestran.
 */
export function PanelGeneralView() {
  const { turnos, resumen, cargando, error, avanzar, enCurso, errorAccion } = useColaTurnos();
  const { hora, fecha } = useClock();

  const activos = useMemo(() => turnos.filter((t) => ACTIVOS.includes(t.estado)), [turnos]);

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <h1>Panel general</h1>
          <div className="zafra">Turnos del día · AgroFlow API</div>
        </div>
        <div className="clockbox">
          <div className="time">{hora}</div>
          <div className="date">{fecha}</div>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {cargando ? (
        <LoadingState label="Cargando turnos..." />
      ) : (
        <>
          <div className="metrics">
            <MetricCard label="Turnos del día" value={resumen.total} />
            <MetricCard label="En curso" value={activos.length} />
            <MetricCard label="Finalizados" value={resumen.completados} />
            <MetricCard label="Cancelados" value={resumen.cancelados} />
          </div>

          <section>
            <div className="section-head">
              <h2>Camiones en curso</h2>
              <div className="meta">{activos.length} activos</div>
            </div>
            {errorAccion && <ErrorState message={errorAccion} />}
            {activos.length === 0 ? (
              <EmptyState message="No hay camiones en curso." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Turno</th>
                    <th>Patente</th>
                    <th>Finca / Transportista</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activos.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }}>
                        {t.hora}
                        {t.ventanaFin ? `–${t.ventanaFin}` : ""}
                      </td>
                      <td style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{t.patente}</td>
                      <td>
                        {t.finca}
                        <div style={{ fontSize: 11, color: "var(--tinta-suave)" }}>{t.chofer}</div>
                      </td>
                      <td>
                        <EstadoBadge estado={t.estado} />
                      </td>
                      <td>
                        <button className="btn-mini" disabled={enCurso === t.id} onClick={() => avanzar(t.id)}>
                          Avanzar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
