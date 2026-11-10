/** TODO F2: подключить audio_url проекта к <audio controls>, обработать loadedmetadata/timeupdate/error.
 * Вход: URL из GET project и callback текущего времени в ms. Не брать длительность браузера за серверную.
 * Приёмка: перемотка работает через Range; текущее время можно взять в выбранное поле строки.
 */
export function AudioPlayer({ audioUrl: _audioUrl, onTimeChange: _onTimeChange }: {
  audioUrl: string | null;
  onTimeChange: (milliseconds: number) => void;
}) {
  return <p className="muted">Аудиоплеер будет подключён после загрузки проекта.</p>;
}
