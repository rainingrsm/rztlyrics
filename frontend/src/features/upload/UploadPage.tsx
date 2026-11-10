/** F1: форма загрузки. TODO: validateAudioFile → createProject → uploadAudio → переход edit.
 * Приёмка: MP3/WAV проходят, ошибка видна рядом с полем, двойная отправка заблокирована.
 */
export function UploadPage() {
  return (
    <section className="hero">
      <p className="eyebrow">Музыка становится видео</p>
      <h1>Твой трек.<br /><span>Твои строки.</span></h1>
      <p className="intro">Загрузите аудио, расставьте время появления строк и создайте lyrics-видео в стиле Brat.</p>
      <div className="panel upload-panel">
        <h2>Начните с трека</h2>
        <p>MP3 или WAV · до 20 MiB · от 5 до 60 секунд</p>
        <label htmlFor="audio-file">Аудиофайл</label>
        <input id="audio-file" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled />
        <button type="button" disabled>Загрузить трек</button>
      </div>
      <ol className="steps"><li>Загрузите аудио</li><li>Введите текст и тайминги</li><li>Получите MP4</li></ol>
    </section>
  );
}
