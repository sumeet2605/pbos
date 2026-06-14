import dayjs from 'dayjs'

export function formatDateTime(value: string): string {
  return dayjs(value).format('MMM D, YYYY h:mm A')
}

export function formatIdentifier(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  if (value.length <= 12) {
    return value
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

export function formatStatusLabel(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}
