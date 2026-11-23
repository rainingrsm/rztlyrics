import { useState } from 'react';

export function VideoResult({ videoUrl, jobId }: { videoUrl: string; jobId: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();

  return (
    <>
      <video
        className="result-video"
        controls
        preload="metadata"
        src={videoUrl}
        aria-label="Видео с текстом песни"
        onError={() => setFailedUrl(videoUrl)}
      />
      {failedUrl === videoUrl && (
        <p className="field-error" role="alert">Не удалось воспроизвести видео. Попробуйте скачать MP4.</p>
      )}
      <div className="actions">
        <a href={`/api/v1/jobs/${encodeURIComponent(jobId)}/video?download=1`}>Скачать MP4</a>
      </div>
    </>
  );
}
