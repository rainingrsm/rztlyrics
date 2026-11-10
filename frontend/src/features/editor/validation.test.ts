import { describe, expect, it } from 'vitest';
import { validateRenderLines } from './validation';
import { msToSeconds, secondsToMs } from './time';
import { splitLyrics } from './lyrics';
import type { LyricLine } from '../../shared/types/project';

const line = (id: string, start: number | null, end: number | null): LyricLine => ({ id, text: 'Своя строка', start_ms: start, end_ms: end });

describe('контракт ручной разметки', () => {
  it('допускает смежные строки и паузы', () => {
    expect(validateRenderLines([line('1', 0, 100), line('2', 100, 500), line('3', 1000, 5000)], 5000)).toEqual([]);
  });
  it.each([
    [[line('1', null, null)]], [[line('1', -1, 500)]], [[line('1', 0, 99)]],
    [[line('1', 0, 5001)]], [[line('1', 0, 1000), line('2', 999, 2000)]],
    [[line('1', 0.5, 500)]], [[line('1', 500, 100)]],
  ])('блокирует неверные интервалы %j', (lines) => {
    expect(validateRenderLines(lines, 5000).length).toBeGreaterThan(0);
  });
  it('не допускает повторяющиеся id и пустой текст', () => {
    expect(validateRenderLines([line('1', 0, 100), { ...line('1', 100, 200), text: ' ' }], 5000).map((issue) => issue.field)).toEqual(['lines[1].id', 'lines[1].text']);
  });
  it('считает Unicode-символы как Python, а не кодовые единицы UTF-16', () => {
    expect(validateRenderLines([{ ...line('1', 0, 100), text: '🎵'.repeat(120) }], 5000)).toEqual([]);
    expect(validateRenderLines([{ ...line('1', 0, 100), text: '🎵'.repeat(121) }], 5000)).toHaveLength(1);
  });
  it('ограничивает id 64 Unicode-символами как сервер', () => {
    expect(validateRenderLines([line('🎵'.repeat(64), 0, 100)], 5000)).toEqual([]);
    expect(validateRenderLines([line('🎵'.repeat(65), 0, 100)], 5000).map((issue) => issue.field)).toEqual(['lines[0].id']);
  });
  it('пустые строки пропускаются, повторяющийся текст получает разные id', () => {
    const lines = splitLyrics(' Текст \r\n\nТекст');
    expect(lines.map((entry) => entry.text)).toEqual(['Текст', 'Текст']);
    expect(lines[0].id).not.toBe(lines[1].id);
    expect(lines.every((entry) => entry.start_ms === null && entry.end_ms === null)).toBe(true);
  });
});

describe('перевод времени', () => {
  it('различает незаданное время и ноль', () => {
    expect(secondsToMs(' ')).toBeNull();
    expect(secondsToMs('0')).toBe(0);
    expect(msToSeconds(null)).toBe('');
  });
  it('принимает десятичную запятую и не теряет 0,01 секунды', () => {
    expect(secondsToMs('1,01')).toBe(1010);
    expect(msToSeconds(1010)).toBe('1.01');
  });
  it('сохраняет точное целое время API при обратном преобразовании', () => {
    expect(secondsToMs(msToSeconds(1001))).toBe(1001);
  });
  it.each(['-1', '1e3', 'NaN', 'Infinity', '0x10', '1.0001'])('отклоняет %s', (value) => {
    expect(() => secondsToMs(value)).toThrow();
  });
});
