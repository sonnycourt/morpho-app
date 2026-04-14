const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function AlignmentScale({ value, onChange, disabled }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2 sm:justify-between sm:gap-3"
      role="radiogroup"
      aria-label="Alignement avec ton intention, de 1 à 10"
    >
      {VALUES.map((n) => {
        const selected = value === n
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${n} sur 10`}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1f38]',
              selected
                ? 'scale-105 border-[#2563eb] bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.35)]'
                : 'border-blue-500/40 bg-transparent text-blue-200/70 hover:border-blue-400/70 hover:text-blue-100',
              disabled ? 'pointer-events-none opacity-50' : 'active:scale-95',
            ].join(' ')}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
