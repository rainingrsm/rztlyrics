import { useRef, useState } from 'react';
import { FieldError } from '../../shared/ui/FieldError';
import { msToSeconds, secondsToMs } from './time';

interface TimingFieldProps {
  id: string;
  label: string;
  valueMs: number | null;
  currentTimeMs: number | null;
  issue?: string;
  onInput: () => void;
  onChange: (milliseconds: number | null) => void;
}

export function TimingField({ id, label, valueMs, currentTimeMs, issue, onInput, onChange }: TimingFieldProps) {
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const message = error ?? issue;

  function applyTime(milliseconds: number | null) {
    inputRef.current?.setCustomValidity('');
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
      inputRef.current?.setCustomValidity(error.message);
      setError(error.message);
      return;
    }
    applyTime(milliseconds);
  }

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        aria-label={`${label}, с`}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? errorId : undefined}
        inputMode="decimal"
        value={input ?? msToSeconds(valueMs)}
        onChange={(event) => {
          event.currentTarget.setCustomValidity('');
          setError(undefined);
          setInput(event.target.value);
          onInput();
        }}
        onBlur={commitInput}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          event.preventDefault();
          event.currentTarget.blur();
        }}
      />
      <FieldError id={errorId} message={message} />
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
