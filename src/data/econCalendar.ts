export interface EconEvent {
  id: string
  date: string
  time: string
  title: string
  currency: string
  impact: 'high' | 'medium' | 'low'
  forecast: string
  previous: string
}

const WEEK_PATTERNS: { dayOfWeek: number; events: Omit<EconEvent, 'id' | 'date'>[] }[] = [
  {
    dayOfWeek: 1,
    events: [
      { time: '15:30', title: 'Промышленное производство', currency: 'USD', impact: 'medium', forecast: '+0.3%', previous: '+0.1%' },
    ]
  },
  {
    dayOfWeek: 2,
    events: [
      { time: '15:30', title: 'Потребительские расходы (PCE)', currency: 'USD', impact: 'high', forecast: '+0.3%', previous: '+0.2%' },
      { time: '17:00', title: 'Конференция председателя ФРС', currency: 'USD', impact: 'high', forecast: '—', previous: '—' },
    ]
  },
  {
    dayOfWeek: 3,
    events: [
      { time: '15:30', title: 'Чистая продажа домов', currency: 'USD', impact: 'low', forecast: '410K', previous: '395K' },
    ]
  },
  {
    dayOfWeek: 4,
    events: [
      { time: '15:30', title: 'Заявки по безработице', currency: 'USD', impact: 'medium', forecast: '215K', previous: '212K' },
      { time: '17:00', title: 'Продажи жилья на вторичном рынке', currency: 'USD', impact: 'medium', forecast: '4.15M', previous: '4.09M' },
    ]
  },
  {
    dayOfWeek: 5,
    events: [
      { time: '15:30', title: 'Индекс потребительских цен (CPI)', currency: 'USD', impact: 'high', forecast: '+0.3%', previous: '+0.4%' },
      { time: '17:00', title: 'Доверие потребителей (UMich)', currency: 'USD', impact: 'medium', forecast: '68.5', previous: '67.8' },
    ]
  },
]

const SPECIAL_EVENTS: Omit<EconEvent, 'id'>[] = [
  { date: '', time: '19:00', title: 'Решение FOMC по ставке', currency: 'USD', impact: 'high', forecast: '5.50%', previous: '5.50%' },
  { date: '', time: '19:30', title: 'Пресс-конференция FOMC', currency: 'USD', impact: 'high', forecast: '—', previous: '—' },
  { date: '', time: '13:30', title: 'Non-Farm Payrolls (NFP)', currency: 'USD', impact: 'high', forecast: '180K', previous: '216K' },
  { date: '', time: '13:30', title: 'Безработица (NFP)', currency: 'USD', impact: 'high', forecast: '3.8%', previous: '3.7%' },
  { date: '', time: '15:00', title: 'Индекс PMI (ISM)', currency: 'USD', impact: 'high', forecast: '50.0', previous: '49.3' },
  { date: '', time: '13:30', title: 'Индекс CPI (YoY)', currency: 'USD', impact: 'high', forecast: '3.3%', previous: '3.4%' },
  { date: '', time: '13:30', title: 'Базовый CPI (YoY)', currency: 'USD', impact: 'high', forecast: '3.9%', previous: '3.9%' },
  { date: '', time: '15:00', title: 'PMI Manufacturing (ISM)', currency: 'USD', impact: 'high', forecast: '50.0', previous: '49.3' },
  { date: '', time: '15:00', title: 'PMI Services (ISM)', currency: 'USD', impact: 'high', forecast: '52.5', previous: '53.4' },
  { date: '', time: '13:30', title: 'Продажи retail', currency: 'USD', impact: 'medium', forecast: '+0.4%', previous: '+0.6%' },
  { date: '', time: '15:00', title: 'Доверие потребителей (CB)', currency: 'USD', impact: 'medium', forecast: '110.0', previous: '110.7' },
  { date: '', time: '13:30', title: 'ВВП (QoQ)', currency: 'USD', impact: 'high', forecast: '+3.0%', previous: '+3.3%' },
  { date: '', time: '13:30', title: 'PPI (MoM)', currency: 'USD', impact: 'medium', forecast: '+0.2%', previous: '+0.4%' },
  { date: '', time: '13:30', title: 'Заявки по безработице', currency: 'USD', impact: 'medium', forecast: '215K', previous: '212K' },
]

function generateEventsForMonth(year: number, month: number): EconEvent[] {
  const events: EconEvent[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const usedSpecial = new Set<number>()

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dow = date.getDay()

    const weekEvts = WEEK_PATTERNS.find(p => p.dayOfWeek === dow)
    if (weekEvts) {
      weekEvts.events.forEach((e, i) => {
        events.push({
          ...e,
          id: `w-${d}-${i}`,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        })
      })
    }

    if ((d === 1 || d === 15) && !usedSpecial.has(d)) {
      const se = SPECIAL_EVENTS.find(e => e.title.includes('CPI') && !e.title.includes('PPI'))
      if (se) {
        events.push({
          ...se,
          id: `sp-cpi-${d}`,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        })
        usedSpecial.add(d)
      }
    }

    if (d >= 1 && d <= 7 && dow === 5 && !usedSpecial.has(d)) {
      const se = SPECIAL_EVENTS.find(e => e.title.includes('Non-Farm'))
      if (se) {
        events.push({
          ...se,
          id: `sp-nfp-${d}`,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        })
        usedSpecial.add(d)
      }
    }

    if (d >= 25 && d <= 31 && dow >= 2 && dow <= 4 && !usedSpecial.has(d)) {
      const se = SPECIAL_EVENTS.find(e => e.title.includes('FOMC'))
      if (se && Math.abs(d - 28) <= 2) {
        events.push({
          ...se,
          id: `sp-fomc-${d}`,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        })
        events.push({
          ...SPECIAL_EVENTS.find(e => e.title.includes('Пресс-конференция'))!,
          id: `sp-fomc-press-${d}`,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        })
        usedSpecial.add(d)
      }
    }

    if (d >= 15 && d <= 21 && dow === 3 && !usedSpecial.has(d)) {
      const se = SPECIAL_EVENTS.find(e => e.title.includes('PMI') && e.title.includes('ISM') && e.title.includes('Manufacturing'))
      if (se) {
        events.push({
          ...se,
          id: `sp-ism-${d}`,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        })
        usedSpecial.add(d)
      }
    }
  }

  return events
}

export function getEventsForDate(dateStr: string): EconEvent[] {
  const d = new Date(dateStr + 'T12:00:00')
  return generateEventsForMonth(d.getFullYear(), d.getMonth()).filter(e => e.date === dateStr)
}

export function getEventsForMonth(year: number, month: number): EconEvent[] {
  return generateEventsForMonth(year, month)
}
