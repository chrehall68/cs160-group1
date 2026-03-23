export function DecimalInput({
  val,
  setVal,
}: {
  val: string
  setVal: (arg0: string) => void
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
      className="mt-1 w-full rounded border px-3 py-2"
      required
    />
  )
}
