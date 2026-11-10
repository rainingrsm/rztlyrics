// F1 + B1 + A2: при изменении лимитов обновить сервер, renderer, docs/api.md и тесты.
export const LIMITS = {
  maxAudioBytes: 20 * 1024 * 1024,
  minDurationMs: 5_000,
  maxDurationMs: 60_000,
  maxLines: 100,
  maxTextLength: 120,
  maxLineIdLength: 64,
  minLineDurationMs: 100,
} as const;
