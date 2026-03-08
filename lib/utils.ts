   
                                            
                                                             
   
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
/**
 * Универсальный форматтер даты для HTML-инпутов (type="date")
 * Принимает Date, строку или null/undefined
 * Возвращает строку в формате YYYY-MM-DD
 */
export function formatDateForInput(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "";

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Проверка на Invalid Date
    if (isNaN(date.getTime())) return "";

    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Ошибка форматирования даты:", error);
    return "";
  }
}