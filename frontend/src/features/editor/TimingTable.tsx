import type { LyricLine } from '../../shared/types/project';
import { FieldError } from '../../shared/ui/FieldError';
import { msToSeconds } from './time';
import { TimingField } from './TimingField';
import { updateLine } from './updateLine';
import type { TimingIssue } from './validation';

export function TimingTable({ lines, durationMs, currentTimeMs, issues, onTimingInput, onChange }: {
  lines: LyricLine[];
  durationMs: number | null;
  currentTimeMs: number | null;
  issues: TimingIssue[];
  onTimingInput: () => void;
  onChange: (lines: LyricLine[]) => void;
}) {
  const issuesByField = new Map(issues.map(({ field, message }) => [field, message]));

  return (
    <div className="table-scroll" role="region" aria-labelledby="timing-table-title" tabIndex={0}>
      <table className="timing-table">
        <caption id="timing-table-title">
          Ручная разметка{durationMs !== null && <span className="muted"> · аудио {msToSeconds(durationMs)} с</span>}
        </caption>
        <thead>
          <tr><th scope="col">Строка</th><th scope="col">Начало, с</th><th scope="col">Конец, с</th><th scope="col">Действия</th></tr>
        </thead>
        <tbody>
          {lines.length === 0 && <tr><td colSpan={4}>Строк пока нет.</td></tr>}
          {lines.map((line, index) => {
            const rowNumber = index + 1;
            const field = `lines[${index}]`;
            const textId = `timing-text-${rowNumber}`;
            const textError = issuesByField.get(`${field}.text`) ?? issuesByField.get(`${field}.id`);
            const startError = issuesByField.get(`${field}.start_ms`) ?? issuesByField.get(field);

            return (
              <tr key={line.id}>
                <td>
                  <textarea
                    id={textId}
                    rows={2}
                    aria-label={`Текст строки ${rowNumber}`}
                    value={line.text}
                    aria-invalid={Boolean(textError)}
                    aria-describedby={textError ? `${textId}-error` : undefined}
                    onChange={(event) => onChange(updateLine(lines, line.id, { text: event.target.value }))}
                  />
                  <FieldError id={`${textId}-error`} message={textError} />
                </td>
                <td>
                  <TimingField
                    id={`timing-start-${rowNumber}`}
                    label={`Начало строки ${rowNumber}`}
                    valueMs={line.start_ms}
                    currentTimeMs={currentTimeMs}
                    issue={startError}
                    onInput={onTimingInput}
                    onChange={(start_ms) => onChange(updateLine(lines, line.id, { start_ms }))}
                  />
                </td>
                <td>
                  <TimingField
                    id={`timing-end-${rowNumber}`}
                    label={`Конец строки ${rowNumber}`}
                    valueMs={line.end_ms}
                    currentTimeMs={currentTimeMs}
                    issue={issuesByField.get(`${field}.end_ms`)}
                    onInput={onTimingInput}
                    onChange={(end_ms) => onChange(updateLine(lines, line.id, { end_ms }))}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    aria-label={`Удалить строку ${rowNumber}`}
                    onClick={() => onChange(lines.filter(({ id }) => id !== line.id))}
                  >Удалить</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
