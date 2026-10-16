import { useCallback, useEffect, useState } from "react";
import type { CasosConversaciones } from "../../composition/container";
import type { Conversacion, MensajeChat } from "../../domain/entities/Conversacion";

export interface HiloMensajes {
  mensajes: MensajeChat[];
  /** Cursor para pedir los mensajes anteriores; null = ya están todos. */
  cursorAnteriores: string | null;
  cargando: boolean;
  error: string | null;
}

const HILO_VACIO: HiloMensajes = { mensajes: [], cursorAnteriores: null, cargando: false, error: null };

/** Une dos listas sin repetir ids (entre páginas pueden llegar mensajes nuevos). */
function unirSinRepetir<T extends { id: string }>(primero: T[], despues: T[]): T[] {
  const vistos = new Set(primero.map((x) => x.id));
  return [...primero, ...despues.filter((x) => !vistos.has(x.id))];
}

/** Recibe los casos de uso porque solo existen si el historial está habilitado. */
export function useChatbot(casos: CasosConversaciones) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cursorConversaciones, setCursorConversaciones] = useState<string | null>(null);
  const [cargandoMasConversaciones, setCargandoMasConversaciones] = useState(false);
  const [conversacionActivaId, setConversacionActivaId] = useState<string | null>(null);
  const [hilos, setHilos] = useState<Record<string, HiloMensajes>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Sin cursor carga los más recientes; con cursor antepone los anteriores. */
  const cargarMensajes = useCallback(async (conversacionId: string, cursor?: string) => {
    setHilos((prev) => ({
      ...prev,
      [conversacionId]: { ...(prev[conversacionId] ?? HILO_VACIO), cargando: true, error: null },
    }));
    try {
      const pagina = await casos.obtenerMensajes.execute(conversacionId, cursor);
      setHilos((prev) => {
        const actual = prev[conversacionId] ?? HILO_VACIO;
        return {
          ...prev,
          [conversacionId]: {
            mensajes: cursor ? unirSinRepetir(pagina.items, actual.mensajes) : pagina.items,
            cursorAnteriores: pagina.siguienteCursor,
            cargando: false,
            error: null,
          },
        };
      });
    } catch {
      setHilos((prev) => ({
        ...prev,
        [conversacionId]: {
          ...(prev[conversacionId] ?? HILO_VACIO),
          cargando: false,
          error: "No se pudieron cargar los mensajes.",
        },
      }));
    }
  }, [casos]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    casos.obtenerConversaciones
      .execute()
      .then((pagina) => {
        if (!activo) return;
        setConversaciones(pagina.items);
        setCursorConversaciones(pagina.siguienteCursor);
        const primera = pagina.items[0]?.id ?? null;
        setConversacionActivaId(primera);
        if (primera) void cargarMensajes(primera);
      })
      .catch(() => activo && setError("No se pudieron cargar las conversaciones."))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [casos, cargarMensajes]);

  const cargarMasConversaciones = useCallback(async () => {
    if (!cursorConversaciones || cargandoMasConversaciones) return;
    setCargandoMasConversaciones(true);
    try {
      const pagina = await casos.obtenerConversaciones.execute(cursorConversaciones);
      setConversaciones((prev) => unirSinRepetir(prev, pagina.items));
      setCursorConversaciones(pagina.siguienteCursor);
    } catch {
      setError("No se pudieron cargar más conversaciones.");
    } finally {
      setCargandoMasConversaciones(false);
    }
  }, [casos, cursorConversaciones, cargandoMasConversaciones]);

  // Los mensajes se piden recién al abrir la conversación, una sola vez.
  const seleccionarConversacion = useCallback(
    (id: string) => {
      setConversacionActivaId(id);
      if (!hilos[id]) void cargarMensajes(id);
    },
    [hilos, cargarMensajes],
  );

  const conversacionActiva = conversaciones.find((c) => c.id === conversacionActivaId) ?? null;
  const hiloActivo = conversacionActivaId ? hilos[conversacionActivaId] ?? HILO_VACIO : HILO_VACIO;

  const cargarMensajesAnteriores = useCallback(() => {
    if (conversacionActivaId && hiloActivo.cursorAnteriores && !hiloActivo.cargando) {
      void cargarMensajes(conversacionActivaId, hiloActivo.cursorAnteriores);
    }
  }, [conversacionActivaId, hiloActivo, cargarMensajes]);

  return {
    conversaciones,
    hayMasConversaciones: cursorConversaciones !== null,
    cargandoMasConversaciones,
    cargarMasConversaciones,
    conversacionActiva,
    hiloActivo,
    cargarMensajesAnteriores,
    seleccionarConversacion,
    cargando,
    error,
  };
}
