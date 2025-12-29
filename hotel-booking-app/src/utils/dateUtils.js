export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diff = checkOut.getTime() - checkIn.getTime();

  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}
