import { useEffect } from 'react'

type PopupProps = {
  title: string
  description: string
  onClose: () => void
  children?: React.ReactNode
}

export default function Popup({
  title,
  description,
  onClose,
  children,
}: PopupProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handler)

    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-(--sea-ink-soft)">{description}</p>
          </div>

          <button
            type="button"
            aria-label="Close popup"
            onClick={onClose}
            className="rounded px-2 py-1 text-lg leading-none text-(--sea-ink-soft) hover:bg-black/5 hover:text-[var(--sea-ink)]"
          >
            ×
          </button>
        </div>

        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  )
}
