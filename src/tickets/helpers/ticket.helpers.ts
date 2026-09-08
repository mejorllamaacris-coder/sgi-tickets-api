/**
 * Genera un código secuencial de ticket.
 * @param year Año actual
 * @param count Cantidad de tickets existentes ese año
 * @returns Ejemplo: "TK-2026-0001"
 */
export function generarCodigoTicket(year: number, count: number): string {
  return `TK-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Calcula la fecha límite basada en las horas de SLA o usa una fecha explícita.
 * @param horasEstimadas Horas de la complejidad seleccionada
 * @param fechaExplicita (Opcional) Fecha límite forzada desde el frontend
 * @returns Fecha límite calculada
 */
export function calcularFechaLimite(horasEstimadas: number, fechaExplicita?: string): Date {
  if (fechaExplicita) {
    return new Date(fechaExplicita);
  }
  return new Date(Date.now() + horasEstimadas * 60 * 60 * 1000);
}
