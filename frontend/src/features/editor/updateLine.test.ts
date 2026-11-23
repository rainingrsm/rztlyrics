import { describe, expect, it } from 'vitest';
import type { LyricLine } from '../../shared/types/project';
import { updateLine } from './updateLine';

const firstLine: LyricLine = { id: 'first', text: 'Первая строка', start_ms: 500, end_ms: 1000 };
const secondLine: LyricLine = { id: 'second', text: 'Вторая строка', start_ms: 1000, end_ms: 2000 };
const lines = Object.freeze([Object.freeze(firstLine), Object.freeze(secondLine)]);

describe('updateLine', () => {
  it('меняет только нужную строку и сохраняет её время при правке текста', () => {
    const updated = updateLine(lines, 'second', { text: 'Новый текст' });

    expect(updated).not.toBe(lines);
    expect(updated[0]).toBe(firstLine);
    expect(updated[1]).not.toBe(secondLine);
    expect(updated[1]).toEqual({ ...secondLine, text: 'Новый текст' });
    expect(lines[1].text).toBe('Вторая строка');
  });

  it('сохраняет ноль как начало и принимает null для очистки конца', () => {
    const [updated] = updateLine(lines, 'first', { start_ms: 0, end_ms: null });

    expect(updated).toEqual({ ...firstLine, start_ms: 0, end_ms: null });
  });

  it('сохраняет ID, даже если он случайно попал в объект правки', () => {
    const patch = { id: 'other', text: '' };
    const [updated] = updateLine(lines, 'first', patch);

    expect(updated).toEqual({ ...firstLine, text: '' });
  });

  it('сообщает об ошибке для неизвестного ID', () => {
    expect(() => updateLine(lines, 'missing', { text: 'Новый текст' })).toThrow('Строка с ID «missing» не найдена.');
  });
});
