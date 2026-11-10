import { describe, expect, it } from 'vitest';
import { validateAudioFile } from './validation';
import { LIMITS } from '../../shared/limits';

describe('предварительная проверка файла', () => {
  it('принимает границу 20 MiB и расширение в верхнем регистре', () => {
    expect(validateAudioFile({ name: 'track.WAV', size: LIMITS.maxAudioBytes })).toBeNull();
  });
  it.each([
    { name: 'track.mp3', size: LIMITS.maxAudioBytes + 1 },
    { name: 'track.mp3', size: 0 },
    { name: 'track.mp3.exe', size: 100 },
  ])('отклоняет неподходящий файл %j', (file) => {
    expect(validateAudioFile(file)).not.toBeNull();
  });
});
