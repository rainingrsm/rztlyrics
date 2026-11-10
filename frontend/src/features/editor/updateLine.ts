import type { LyricLine } from '../../shared/types/project';

/** TODO F2: вернуть новый массив, обновив строку по id, без мутации исходного массива.
 * Вход: строки, id, изменённые text/start_ms/end_ms; выход: новое состояние редактора.
 * При изменении text сохранить времена; id не менять. Неизвестный id обработать явно.
 * Приёмка: правка строки не меняет соседние строки; null и 0 остаются различимы.
 */
export function updateLine(
  _lines: LyricLine[],
  _lineId: string,
  _patch: Partial<Pick<LyricLine, 'text' | 'start_ms' | 'end_ms'>>,
): LyricLine[] {
  throw new Error('TODO F2: редактирование строки ещё не подключено.');
}
