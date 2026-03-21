/**
 * Formata uma string ISO 8601 para o padrão usado na UI: "Seg, 21/03/2026 • 19:00"
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayOfWeek = weekdays[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dayOfWeek}, ${day}/${month}/${year} • ${hours}:${minutes}`;
}

/**
 * Formata uma string ISO 8601 para exibição curta: "Dom, 23 mar"
 */
export function formatDateShort(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayOfWeek = weekdays[d.getDay()];
  const dateFormatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${dayOfWeek}, ${dateFormatted}`;
}

/**
 * Formata uma string ISO 8601 para exibição apenas da hora: "19:00"
 */
export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
