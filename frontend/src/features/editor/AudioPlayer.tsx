import { useEffect, useRef, useState } from 'react';

type TimeChange = (milliseconds: number) => void;

export function AudioPlayer({ audioUrl, onTimeChange }: { audioUrl: string | null; onTimeChange: TimeChange }) {
  if (!audioUrl) return <p className="muted">В проекте нет аудиофайла.</p>;

  return <TrackControls key={audioUrl} audioUrl={audioUrl} onTimeChange={onTimeChange} />;
}

function TrackControls({ audioUrl, onTimeChange }: { audioUrl: string; onTimeChange: TimeChange }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    // An audio element can keep playing after it has been detached from the page.
    return () => audio?.pause();
  }, []);

  function reportTime() {
    const audio = audioRef.current;
    if (audio) onTimeChange(Math.round(audio.currentTime * 1000));
  }

  return (
    <>
      <audio
        ref={audioRef}
        aria-label="Аудио проекта"
        controls
        preload="metadata"
        src={audioUrl}
        onLoadedMetadata={reportTime}
        onTimeUpdate={reportTime}
        onSeeked={reportTime}
        onEnded={reportTime}
        onError={() => setHasError(true)}
      />
      {hasError && <p className="field-error" role="alert">Не удалось загрузить аудио проекта.</p>}
    </>
  );
}
