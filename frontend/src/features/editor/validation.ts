import { LIMITS } from '../../shared/limits';
import type { LyricLine } from '../../shared/types/project';

export interface TimingIssue { field: string; message: string }

/** F2 + B1 + A2: проверка перед render. Черновики с null храним без вызова этой функции. */
export function validateRenderLines(lines: LyricLine[], durationMs: number | null): TimingIssue[] {
  const issues: TimingIssue[] = [];
  if (!Number.isSafeInteger(durationMs) || durationMs === null
    || durationMs < LIMITS.minDurationMs || durationMs > LIMITS.maxDurationMs) {
    issues.push({ field: 'duration_ms', message: 'Загрузите аудио длительностью от 5 до 60 секунд.' });
  }
  if (lines.length === 0 || lines.length > LIMITS.maxLines) {
    issues.push({ field: 'lines', message: 'Нужно от 1 до 100 строк.' });
  }
  const ids = new Set<string>();
  let previousEnd = 0;
  lines.forEach((line, index) => {
    const field = `lines[${index}]`;
    if (!line.id.trim() || [...line.id].length > LIMITS.maxLineIdLength || ids.has(line.id)) {
      issues.push({ field: `${field}.id`, message: 'Нужен уникальный непустой идентификатор длиной до 64 символов.' });
    }
    ids.add(line.id);
    if (!line.text.trim() || [...line.text].length > LIMITS.maxTextLength) {
      issues.push({ field: `${field}.text`, message: 'Нужен непустой текст длиной до 120 символов.' });
    }
    const { start_ms: start, end_ms: end } = line;
    if (start === null || end === null || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
      issues.push({ field, message: 'Укажите начало и конец строки.' });
      return;
    }
    if (start < 0 || end - start < LIMITS.minLineDurationMs || (durationMs !== null && end > durationMs)) {
      issues.push({ field, message: 'Интервал должен быть внутри аудио и не короче 0,1 с.' });
    }
    if (start < previousEnd) issues.push({ field: `${field}.start_ms`, message: 'Строки должны идти по порядку и не пересекаться.' });
    previousEnd = Math.max(previousEnd, end);
  });
  return issues;
}
