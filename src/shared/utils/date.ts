export function horaActual(): string {
  return new Date().toTimeString().slice(0, 8);
}

export function fechaLarga(): string {
  return new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "2026-09-16T14:30:00Z" → "14:30" en la hora local del navegador. */
export function horaDeIso(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
