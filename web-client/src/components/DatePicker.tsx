import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'

interface Props {
  value: string
  onChange: (value: string) => void
  minDate: Date
  maxDate: Date
  placeholder?: string
  defaultMonth?: Date
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'
  // Replace the year dropdown with a typeable year input. Useful when the
  // valid range spans many years (rendering thousands of <option>s is slow).
  yearInput?: boolean
}

function isoToDate(s: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function dateToISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplay(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select a date',
  defaultMonth,
  captionLayout,
  yearInput,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = isoToDate(value)
  const fallbackMonth = selected ?? defaultMonth ?? minDate

  const [displayMonth, setDisplayMonth] = useState<Date>(fallbackMonth)
  const [yearText, setYearText] = useState<string>(
    String(fallbackMonth.getFullYear()),
  )

  useEffect(() => {
    if (!open) return
    const start = selected ?? defaultMonth ?? minDate
    setDisplayMonth(start)
    setYearText(String(start.getFullYear()))
  }, [open, selected, defaultMonth, minDate])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const minYear = minDate.getFullYear()
  const maxYear = maxDate.getFullYear()

  const commitYear = (text: string) => {
    const n = Number(text)
    if (!Number.isInteger(n) || n < minYear || n > maxYear) {
      setYearText(String(displayMonth.getFullYear()))
      return
    }
    setDisplayMonth(new Date(n, displayMonth.getMonth(), 1))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 w-full rounded border px-3 py-2 text-left"
      >
        {selected ? (
          formatDisplay(selected)
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 rounded-lg border bg-white p-3 shadow-lg">
          {yearInput && (
            <div className="mb-2 flex items-center gap-2">
              <label className="text-sm">Year:</label>
              <input
                type="number"
                min={minYear}
                max={maxYear}
                value={yearText}
                onChange={(e) => setYearText(e.target.value)}
                onBlur={() => commitYear(yearText)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitYear(yearText)
                  }
                }}
                className="w-24 rounded border px-2 py-1 text-sm"
              />
            </div>
          )}
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(dateToISO(d))
                setOpen(false)
              }
            }}
            disabled={[{ before: minDate }, { after: maxDate }]}
            startMonth={minDate}
            endMonth={maxDate}
            month={yearInput ? displayMonth : undefined}
            onMonthChange={
              yearInput
                ? (m) => {
                    setDisplayMonth(m)
                    setYearText(String(m.getFullYear()))
                  }
                : undefined
            }
            defaultMonth={yearInput ? undefined : fallbackMonth}
            captionLayout={yearInput ? 'dropdown-months' : captionLayout}
          />
        </div>
      )}
    </div>
  )
}
