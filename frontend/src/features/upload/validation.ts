import { LIMITS } from '../../shared/limits';

/** F1: быстрая проверка выбора. Содержимое и длительность независимо проверяет B1 на сервере. */
export function validateAudioFile(file: Pick<File, 'name' | 'size'>): string | null {
  if (!/\.(mp3|wav)$/i.test(file.name)) return 'Выберите файл MP3 или WAV.';
  if (file.size <= 0) return 'Файл пуст.';
  if (file.size > LIMITS.maxAudioBytes) return 'Размер файла превышает 20 MiB.';
  return null;
}
