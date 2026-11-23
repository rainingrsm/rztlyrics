import type { LyricLine } from '../../shared/types/project';

export function updateLine(
  lines: readonly LyricLine[],
  lineId: string,
  patch: Partial<Pick<LyricLine, 'text' | 'start_ms' | 'end_ms'>>,
): LyricLine[] {
  const lineIndex = lines.findIndex((line) => line.id === lineId);
  if (lineIndex === -1) throw new Error(`Строка с ID «${lineId}» не найдена.`);

  return lines.map((line, index) => {
    if (index !== lineIndex) return line;

    // Undefined leaves a field unchanged. Null clears a timestamp, and zero is a valid timestamp.
    return {
      id: line.id,
      text: patch.text ?? line.text,
      start_ms: patch.start_ms === undefined ? line.start_ms : patch.start_ms,
      end_ms: patch.end_ms === undefined ? line.end_ms : patch.end_ms,
    };
  });
}
