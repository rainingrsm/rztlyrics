import { useId, useState } from 'react';
import { FieldError } from '../../shared/ui/FieldError';
import { msToSeconds, secondsToMs } from './time';

interface TimingFieldProps {
  label: string;
  valueMs: number | null;
  currentTimeMs: number | null;
  onChange: (milliseconds: number | null) => void;
}

export function TimingField({ label, valueMs, currentTimeMs, onChange }: TimingFieldProps) {
  const errorId = useId();
  const [input, setInput] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  function applyTime(milliseconds: number | null) {
    setError(undefined);
    setInput(null);
    if (milliseconds !== valueMs) onChange(milliseconds);
  }

  function commitInput() {
    if (input === null) return;

    let milliseconds: number | null;
    try {
      milliseconds = secondsToMs(input);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      setError(error.message);
      return;
    }
    applyTime(milliseconds);
  }

  return (
    <>
      <input
        aria-label={`${label}, с`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        inputMode="decimal"
        value={input ?? msToSeconds(valueMs)}
        onChange={(event) => {
          setError(undefined);
          setInput(event.target.value);
        }}
        onBlur={commitInput}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          event.preventDefault();
          event.currentTarget.blur();
        }}
      />
      <FieldError id={errorId} message={error} />
      <button
        type="button"
        aria-label={`Взять время плеера — ${label.toLowerCase()}`}
        disabled={currentTimeMs === null}
        onClick={() => {
          if (currentTimeMs !== null) applyTime(currentTimeMs);
        }}
      >Взять время</button>
    </>
  );
}
