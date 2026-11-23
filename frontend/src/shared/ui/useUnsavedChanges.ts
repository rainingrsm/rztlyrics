import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const blocker = useBlocker(hasUnsavedChanges);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('В черновике есть несохранённые изменения. Уйти со страницы?')) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = 'В черновике есть несохранённые изменения.';
    }

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);
}
