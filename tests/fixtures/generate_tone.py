"""A2: воспроизводимый синтетический WAV для технических проверок, без музыки."""

import argparse
import math
import struct
import wave
from pathlib import Path


def generate_tone(output: Path, duration_seconds: int = 10) -> None:
    """Записать моно PCM 16 bit/16 kHz, 440 Hz, с небольшой амплитудой.

    Не перезаписывать существующий файл. Для согласования fixtures длительность
    по умолчанию совпадает с render-spec.json. Вокал и качество ASR не проверяет.
    """
    if duration_seconds <= 0:
        raise ValueError("Длительность должна быть положительной.")
    sample_rate = 16_000
    samples = bytearray()
    for index in range(sample_rate * duration_seconds):
        value = round(0.1 * 32767 * math.sin(2 * math.pi * 440 * index / sample_rate))
        samples.extend(struct.pack("<h", value))
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("xb") as stream, wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(samples)


def main() -> None:
    """Создать файл по явному CLI-запросу; импорт модуля ничего не записывает."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--seconds", type=int, default=10)
    args = parser.parse_args()
    generate_tone(args.output, args.seconds)
    print(args.output)


if __name__ == "__main__":
    main()
