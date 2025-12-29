// превращает локальную дату в стабильный YYYY-MM-DD без сдвига дня.
export function toYMD(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
