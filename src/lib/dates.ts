import {
  endOfDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
} from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'
import type { DateRange } from '../types/models'

export const APP_TIMEZONE = 'Asia/Bangkok'

export const zonedNow = () => toZonedTime(new Date(), APP_TIMEZONE)

export const startOfDayInTz = (date: Date | string) => {
  const zonedDate = toZonedTime(
    typeof date === 'string' ? parseISO(date) : date,
    APP_TIMEZONE,
  )
  return fromZonedTime(startOfDay(zonedDate), APP_TIMEZONE)
}

export const endOfDayInTz = (date: Date | string) => {
  const zonedDate = toZonedTime(
    typeof date === 'string' ? parseISO(date) : date,
    APP_TIMEZONE,
  )
  return fromZonedTime(endOfDay(zonedDate), APP_TIMEZONE)
}

export const formatDateTz = (
  value: Date | string,
  pattern = 'd MMM yyyy',
) => {
  const date = typeof value === 'string' ? parseISO(value) : value
  return formatInTimeZone(date, APP_TIMEZONE, pattern)
}

export const defaultDateRange = (): DateRange => {
  const now = zonedNow()
  const from = fromZonedTime(startOfYear(now), APP_TIMEZONE).toISOString()
  const to = fromZonedTime(endOfDay(now), APP_TIMEZONE).toISOString()
  return { from, to, preset: 'YTD' }
}

const presetCalculators: Record<NonNullable<DateRange['preset']>, () => DateRange> =
  {
    TODAY: () => {
      const now = zonedNow()
      return {
        from: fromZonedTime(startOfDay(now), APP_TIMEZONE).toISOString(),
        to: fromZonedTime(endOfDay(now), APP_TIMEZONE).toISOString(),
        preset: 'TODAY',
      }
    },
    '7D': () => {
      const now = zonedNow()
      const from = fromZonedTime(startOfDay(subDays(now, 6)), APP_TIMEZONE)
      const to = fromZonedTime(endOfDay(now), APP_TIMEZONE)
      return { from: from.toISOString(), to: to.toISOString(), preset: '7D' }
    },
    MTD: () => {
      const now = zonedNow()
      return {
        from: fromZonedTime(startOfMonth(now), APP_TIMEZONE).toISOString(),
        to: fromZonedTime(endOfDay(now), APP_TIMEZONE).toISOString(),
        preset: 'MTD',
      }
    },
    QTD: () => {
      const now = zonedNow()
      return {
        from: fromZonedTime(startOfQuarter(now), APP_TIMEZONE).toISOString(),
        to: fromZonedTime(endOfDay(now), APP_TIMEZONE).toISOString(),
        preset: 'QTD',
      }
    },
    YTD: defaultDateRange,
    '1Y': () => {
      const now = zonedNow()
      const from = fromZonedTime(startOfDay(subDays(now, 364)), APP_TIMEZONE)
      const to = fromZonedTime(endOfDay(now), APP_TIMEZONE)
      return { from: from.toISOString(), to: to.toISOString(), preset: '1Y' }
    },
    CUSTOM: () => {
      const now = zonedNow()
      return {
        from: fromZonedTime(startOfDay(now), APP_TIMEZONE).toISOString(),
        to: fromZonedTime(endOfDay(now), APP_TIMEZONE).toISOString(),
        preset: 'CUSTOM',
      }
    },
  }

export const rangeFromPreset = (
  preset: NonNullable<DateRange['preset']>,
): DateRange => {
  const calculator = presetCalculators[preset] ?? defaultDateRange
  return calculator()
}

export const isWithinRange = (dateIso: string, range: DateRange) => {
  const date = parseISO(dateIso)
  return date >= parseISO(range.from) && date <= parseISO(range.to)
}

export const clampRangeToToday = (range: DateRange): DateRange => {
  const now = zonedNow()
  const nowUtc = fromZonedTime(now, APP_TIMEZONE)
  const currentTo = parseISO(range.to) > nowUtc ? nowUtc.toISOString() : range.to
  return { ...range, to: currentTo }
}
