export default function timeAgo(date: any): string {
  if (!date) return ''
  const s = date?.seconds || Math.floor(new Date(date instanceof Date ? date : typeof date === 'string' ? date : Date.now()).getTime() / 1000)
  const diff = Math.floor(Date.now() / 1000) - s
  if (diff < 0) return 'только что'
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн`
  if (diff < 2592000) return `${Math.floor(diff / 604800)} нед`
  return `${Math.floor(diff / 2592000)} мес`
}
