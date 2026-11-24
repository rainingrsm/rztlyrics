import { Link, Outlet, matchPath, useLocation } from 'react-router-dom';

export function App() {
  const { pathname } = useLocation();
  const stage = matchPath('/projects/:id/edit', pathname) ? 'editor'
    : matchPath('/projects/:id/result', pathname) ? 'result'
      : pathname === '/' ? 'upload' : null;

  return (
    <div className="app-shell">
      <header className="project-sidebar">
        <div className="sidebar-inner">
          <Link className="brand" to="/" aria-label="RZT Lyrics, главная">
            <span className="brand-mark">RZT</span> <span className="brand-label">Lyrics</span>
          </Link>
          <ol className="project-steps" aria-label="Этапы проекта">
            <li aria-current={stage === 'upload' ? 'step' : undefined}>Трек</li>
            <li aria-current={stage === 'editor' ? 'step' : undefined}>Тайминги</li>
            <li aria-current={stage === 'result' ? 'step' : undefined}>Видео</li>
          </ol>
        </div>
      </header>
      <main className="workspace"><Outlet /></main>
    </div>
  );
}
