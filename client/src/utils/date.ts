import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)

export const fromNow = (date: string, lang = 'vi'): string => {
  return dayjs(date).locale(lang).fromNow()
}

export const formatDate = (date: string, lang = 'vi'): string => {
  dayjs.locale(lang)
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

export const daysUntil = (date: string): number => {
  return dayjs(date).diff(dayjs(), 'day')
}

export const isExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false
  return dayjs(expiresAt).isBefore(dayjs())
}
