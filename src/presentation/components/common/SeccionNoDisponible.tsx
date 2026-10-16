/**
 * Vista sin endpoint en AgroFlow API. No se muestran datos de ejemplo:
 * la sección se habilita cuando el contrato (openapi.yaml) la incluya.
 */
export function SeccionNoDisponible({ titulo }: { titulo: string }) {
  return (
    <div className="view">
      <div className="topbar">
        <div>
          <h1>{titulo}</h1>
        </div>
      </div>
      <div className="empty-state">
        AgroFlow API todavía no expone datos para esta sección. Se va a habilitar cuando el contrato la incluya.
      </div>
    </div>
  );
}
