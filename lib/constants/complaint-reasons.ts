export const COMPLAINT_REASONS: Record<string, string> = {
  spam: "Спам",
  rude: "Хамство",
  inadequate: "Неадекватное поведение",
  other: "Другое",
};

export function getComplaintReasonLabel(value: string): string {
  return COMPLAINT_REASONS[value] || value;
}