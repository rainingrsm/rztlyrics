import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { EditorPage } from './features/editor/EditorPage';
import { ResultPage } from './features/render/ResultPage';
import { UploadPage } from './features/upload/UploadPage';
import './shared/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Не найден корневой элемент приложения.');

const router = createBrowserRouter([{
  element: <App />,
  children: [
    { index: true, element: <UploadPage /> },
    { path: 'projects/:id/edit', element: <EditorPage /> },
    { path: 'projects/:id/result', element: <ResultPage /> },
    { path: '*', element: <section className="panel"><h1>Страница не найдена</h1><Link to="/">На главную</Link></section> },
  ],
}]);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
