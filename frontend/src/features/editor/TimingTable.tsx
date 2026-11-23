import type { LyricLine } from '../../shared/types/project';
import { msToSeconds } from './time';

export function TimingTable({ lines }: { lines: LyricLine[] }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>Ручная разметка</caption>
        <thead>
          <tr><th scope="col">Строка</th><th scope="col">Начало, с</th><th scope="col">Конец, с</th></tr>
        </thead>
        <tbody>
          {lines.length === 0 && <tr><td colSpan={3}>Строк пока нет.</td></tr>}
          {lines.map((line) => (
            <tr key={line.id}>
              <td>{line.text}</td>
              <td>{msToSeconds(line.start_ms) || '—'}</td>
              <td>{msToSeconds(line.end_ms) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
