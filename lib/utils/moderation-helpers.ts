import { DocumentType } from '@prisma/client'

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    ACADEMIC_EDUCATION: 'Академическое образование',
    PROFESSIONAL_TRAINING: 'Профессиональная переподготовка',
    COURSE: 'Курсы и интенсивы',
    SUPPORTING_DOC: 'Подтверждающий документ',
    LINK: 'Ссылка',
    PHOTO: 'Фото',
    OTHER: 'Другое'
  }
  return labels[type] || type
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
