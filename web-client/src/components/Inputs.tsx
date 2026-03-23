import clsx from 'clsx'

export function DecimalInput({
  val,
  setVal,
  className,
  ...props
}: {
  val: string
  setVal: (arg0: string) => void
  className?: string
  [key: string]: any
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={val}
      onChange={(e) => {
        if (e.target.value.match('^\\d*(\\.\\d{0,2})?$')) setVal(e.target.value)
      }}
      placeholder="0.00"
      className={clsx(className, 'mt-1 w-full rounded border px-3 py-2')}
      {...props}
    />
  )
}

export function IntegerInput({
  val,
  setVal,
  placeholder,
  className,
  ...props
}: {
  val: string
  setVal: (arg0: string) => void
  placeholder?: string
  className?: string
  [key: string]: any
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={val}
      onChange={(e) => {
        if (e.target.value.match('^\\d*$')) setVal(e.target.value)
      }}
      className={clsx(className, 'mt-1 w-full rounded border px-3 py-2')}
      placeholder={placeholder || '0'}
      {...props}
    />
  )
}
