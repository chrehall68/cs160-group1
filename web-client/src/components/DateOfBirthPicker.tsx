import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'

interface Props {
  value: string
  onChange: (value: string) => void
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

export default function DateOfBirthPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const minDate = new Date(
    today.getFullYear() - 150,
    today.getMonth(),
    today.getDate(),
  )
  const selected = isoToDate(value)
  const defaultMonth =
    selected ?? new Date(today.getFullYear() - 25, today.getMonth(), 1)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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
          <span className="text-gray-400">Select your date of birth</span>
        )}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 rounded-lg border bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(dateToISO(d))
                setOpen(false)
              }
            }}
            disabled={[{ before: minDate }, { after: today }]}
            startMonth={minDate}
            endMonth={today}
            defaultMonth={defaultMonth}
            captionLayout="dropdown"
          />
        </div>
      )}
    </div>
  )
}
