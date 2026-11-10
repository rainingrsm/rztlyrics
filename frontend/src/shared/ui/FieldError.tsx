/** F1: связать сообщение с полем через aria-describedby; не передавать HTML от API. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="field-error" role="alert">{message}</p> : null;
}
