import { LIMITS } from '../../shared/limits';
import type { LyricLine } from '../../shared/types/project';

export interface TimingIssue { field: string; message: string }

// eslint-disable-next-line no-control-regex -- Python's str.strip() also removes U+001C to U+001F.
const blank = /^[\p{White_Space}\u001c-\u001f]*$/u;

function validateLines(lines: LyricLine[], durationMs: number | null, forRender: boolean): TimingIssue[] {
  const issues: TimingIssue[] = [];
  const knownDuration = durationMs !== null && Number.isSafeInteger(durationMs) && durationMs >= 0 ? durationMs : null;
  if (forRender && (knownDuration === null
    || knownDuration < LIMITS.minDurationMs || knownDuration > LIMITS.maxDurationMs)) {
    issues.push({ field: 'duration_ms', message: 'Загрузите аудио длительностью от 5 до 60 секунд.' });
  }
  if (lines.length > LIMITS.maxLines || (forRender && lines.length === 0)) {
    const message = forRender ? `Нужно от 1 до ${LIMITS.maxLines} строк.` : `Нужно не больше ${LIMITS.maxLines} строк.`;
    issues.push({ field: 'lines', message });
  }

  const ids = new Set<string>();
  let previousEnd = 0;
  lines.forEach((line, index) => {
    const field = `lines[${index}]`;
    if (blank.test(line.id) || [...line.id].length > LIMITS.maxLineIdLength || ids.has(line.id)) {
      issues.push({ field: `${field}.id`, message: 'Нужен уникальный непустой идентификатор длиной до 64 символов.' });
    }
    ids.add(line.id);
    if (blank.test(line.text) || [...line.text].length > LIMITS.maxTextLength) {
      issues.push({ field: `${field}.text`, message: 'Нужен непустой текст длиной до 120 символов.' });
    }

    const { start_ms: start, end_ms: end } = line;
    const validStart = start === null || (Number.isSafeInteger(start) && start >= 0);
    const validEnd = end === null || (Number.isSafeInteger(end) && end >= 0);
    if (!validStart) {
      issues.push({ field: `${field}.start_ms`, message: 'Начало должно быть целым неотрицательным числом миллисекунд.' });
    } else if (start !== null && knownDuration !== null && start > knownDuration) {
      issues.push({ field: `${field}.start_ms`, message: 'Начало строки выходит за длительность аудио.' });
    }
    if (!validEnd) {
      issues.push({ field: `${field}.end_ms`, message: 'Конец должен быть целым неотрицательным числом миллисекунд.' });
    } else if (end !== null && knownDuration !== null && end > knownDuration) {
      issues.push({ field: `${field}.end_ms`, message: 'Конец строки выходит за длительность аудио.' });
    }
    if (!validStart || !validEnd) return;
    if (start === null || end === null) {
      if (forRender) issues.push({ field, message: 'Укажите начало и конец строки.' });
      return;
    }
    if (end - start < LIMITS.minLineDurationMs) {
      issues.push({ field: `${field}.end_ms`, message: 'Конец должен идти как минимум на 0,1 с позже начала.' });
    }
    if (!forRender) return;
    if (start < previousEnd) issues.push({ field: `${field}.start_ms`, message: 'Строки должны идти по порядку и не пересекаться.' });
    previousEnd = Math.max(previousEnd, end);
  });
  return issues;
}

export function validateDraftLines(lines: LyricLine[], durationMs: number | null): TimingIssue[] {
  return validateLines(lines, durationMs, false);
}

export function validateRenderLines(lines: LyricLine[], durationMs: number | null): TimingIssue[] {
  return validateLines(lines, durationMs, true);
}
