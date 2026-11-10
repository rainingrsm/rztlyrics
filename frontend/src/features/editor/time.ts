/** F2: преобразовать поле секунд в целые миллисекунды; пустое поле — null, не ноль. */
export function secondsToMs(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) throw new Error('Введите неотрицательное время с точностью до 0,001 с.');
  const milliseconds = Math.round(Number(normalized) * 1000);
  if (!Number.isSafeInteger(milliseconds)) throw new Error('Время слишком большое.');
  return milliseconds;
}

/** F2: показать время в секундах, сохранив точность ms для значений API. */
export function msToSeconds(value: number | null): string {
  if (value === null) return '';
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Ожидалось целое неотрицательное время.');
  return (value / 1000).toFixed(value % 10 === 0 ? 2 : 3);
}
