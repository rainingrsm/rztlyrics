import { useParams } from 'react-router-dom';
import { TimingTable } from './TimingTable';

/** F2: редактор проекта. TODO: getProject, состояние draft/dirty, сохранение и ошибки по field.
 * Приёмка: F5 восстанавливает серверные данные; изменение текста не теряет время строки.
 */
export function EditorPage() {
  const { id } = useParams();
  return (
    <section className="panel">
      <p className="eyebrow">Шаг 2 · текст и тайминги</p>
      <h1>Подготовка видео</h1>
      <p className="muted">Проект: {id}. Загрузка данных ещё не подключена.</p>
      <label htmlFor="lyrics-input">Текст песни — каждая строка отдельно</label>
      <textarea id="lyrics-input" rows={5} placeholder="Введите собственный текст…" disabled />
      <button type="button" disabled>Разбить на строки</button>
      <TimingTable />
      <div className="actions"><button type="button" disabled>Сохранить</button><button type="button" disabled>Сгенерировать видео</button></div>
    </section>
  );
}
