import { useState } from 'react';

export function VideoResult({ videoUrl, jobId }: { videoUrl: string; jobId: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();

  return (
    <div className="result-layout">
      <figure className="media-frame">
        <video
          className="result-video"
          controls
          playsInline
          preload="metadata"
          src={videoUrl}
          aria-label="Видео с текстом песни"
          onError={() => setFailedUrl(videoUrl)}
        />
        <figcaption><span>Видео Brat</span><span className="timecode">9:16</span></figcaption>
      </figure>
      <section className="panel result-details">
        <h2>Видео готово</h2>
        <p className="muted">MP4 · 720 × 1280 · 30 кадр/с</p>
        {failedUrl === videoUrl && (
          <p className="field-error" role="alert">Не удалось воспроизвести видео. Попробуйте скачать MP4.</p>
        )}
        <a className="button button-primary" href={`/api/v1/jobs/${encodeURIComponent(jobId)}/video?download=1`}>Скачать MP4</a>
      </section>
    </div>
  );
}
