import { useEffect } from 'react'
import { createPortal } from 'react-dom'

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

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-(--popup-bg) shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-4 p-6 ${children ? 'pb-0' : ''}`}
        >
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

        {children && (
          <div className="overflow-y-auto px-6 pt-5 pb-6">{children}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
