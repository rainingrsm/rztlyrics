import type { LyricLine } from '../../shared/types/project';
import { TimingField } from './TimingField';
import { updateLine } from './updateLine';

export function TimingTable({ lines, currentTimeMs, onChange }: {
  lines: LyricLine[];
  currentTimeMs: number | null;
  onChange: (lines: LyricLine[]) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <caption>Ручная разметка</caption>
        <thead>
          <tr><th scope="col">Строка</th><th scope="col">Начало, с</th><th scope="col">Конец, с</th></tr>
        </thead>
        <tbody>
          {lines.length === 0 && <tr><td colSpan={3}>Строк пока нет.</td></tr>}
          {lines.map((line, index) => (
            <tr key={line.id}>
              <td>{line.text}</td>
              <td>
                <TimingField
                  label={`Начало строки ${index + 1}`}
                  valueMs={line.start_ms}
                  currentTimeMs={currentTimeMs}
                  onChange={(start_ms) => onChange(updateLine(lines, line.id, { start_ms }))}
                />
              </td>
              <td>
                <TimingField
                  label={`Конец строки ${index + 1}`}
                  valueMs={line.end_ms}
                  currentTimeMs={currentTimeMs}
                  onChange={(end_ms) => onChange(updateLine(lines, line.id, { end_ms }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
