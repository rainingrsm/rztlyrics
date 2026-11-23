import { Link, Outlet } from 'react-router-dom';

export function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="RZT, главная">RZT<span>lyrics video</span></Link>
        <span className="version">v0 · каркас проекта</span>
      </header>
      <aside className="scaffold-notice">
        Проект в разработке. Серверная загрузка, сохранение и генерация ещё не готовы.
      </aside>
      <main><Outlet /></main>
      <footer>Трек → текст и тайминги → готовое видео</footer>
    </div>
  );
}
