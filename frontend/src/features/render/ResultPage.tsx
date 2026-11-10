import { Link, useParams } from 'react-router-dom';

/** F1: экран результата. TODO: project.latest_job_id → опрос → video_url и ссылка download=1.
 * Приёмка: queued/running/failed/succeeded различаются; без job_id не показывать фиктивный прогресс.
 */
export function ResultPage() {
  const { id } = useParams();
  return (
    <section className="panel">
      <p className="eyebrow">Шаг 3 · результат</p>
      <h1>Готовое видео</h1>
      <p>Состояние задачи ещё не загружено. Генерация в каркасе не выполняется.</p>
      <div className="video-placeholder">Здесь появится плеер готового MP4</div>
      <div className="actions"><button type="button" disabled>Скачать MP4</button><Link to={`/projects/${encodeURIComponent(id ?? '')}/edit`}>Вернуться к редактору</Link></div>
    </section>
  );
}
