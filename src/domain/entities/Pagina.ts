/**
 * Página de resultados con cursor opaco. La UI nunca interpreta el cursor:
 * lo devuelve tal cual para pedir la página siguiente. null = no hay más.
 */
export interface Pagina<T> {
  items: T[];
  siguienteCursor: string | null;
}
