/** F2: таблица строк. TODO: поля текста/начала/конца, удаление, «взять время плеера».
 * Вход будущего компонента: lines, durationMs, onChange. UI использует секунды, DTO — ms.
 * Приёмка: null отображается пустым; ошибки у конкретной строки; смежные интервалы допустимы.
 */
export function TimingTable() {
  return (
    <div className="table-scroll">
      <table><caption>Ручная разметка</caption><thead><tr><th>Строка</th><th>Начало, с</th><th>Конец, с</th><th>Действия</th></tr></thead>
        <tbody><tr><td colSpan={4}>Строки появятся после подключения редактора.</td></tr></tbody>
      </table>
    </div>
  );
}
