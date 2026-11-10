import { Link, Route, Routes } from 'react-router-dom';
import { UploadPage } from '../features/upload/UploadPage';
import { EditorPage } from '../features/editor/EditorPage';
import { ResultPage } from '../features/render/ResultPage';

/** F1: оболочка и маршруты. TODO: добавить защиту несохранённого черновика вместе с F2. */
export function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="RZT, главная">RZT<span>lyrics video</span></Link>
        <span className="version">v0 · каркас проекта</span>
      </header>
      <aside className="scaffold-notice">
        Стартовый каркас: загрузка, сохранение и генерация ещё не подключены.
        Кнопки недоступны до реализации соответствующих задач.
      </aside>
      <main><Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/projects/:id/edit" element={<EditorPage />} />
        <Route path="/projects/:id/result" element={<ResultPage />} />
        <Route path="*" element={<section className="panel"><h1>Страница не найдена</h1><Link to="/">На главную</Link></section>} />
      </Routes></main>
      <footer>Трек → текст и тайминги → готовое видео</footer>
    </div>
  );
}
