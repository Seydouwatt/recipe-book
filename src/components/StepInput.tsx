interface Props {
  steps: string[]
  onChange: (steps: string[]) => void
}

export default function StepInput({ steps, onChange }: Props) {
  const update = (index: number, value: string) => {
    const next = [...steps]
    next[index] = value
    onChange(next)
  }

  const add = () => {
    onChange([...steps, ''])
  }

  const remove = (index: number) => {
    onChange(steps.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-amber-900">Étapes</label>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-2 shrink-0 text-sm font-bold text-amber-500">{i + 1}.</span>
          <textarea
            value={step}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Étape ${i + 1}`}
            rows={2}
            className="min-w-0 flex-1 rounded-lg border border-amber-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600 font-bold"
          >
            X
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border-2 border-dashed border-amber-300 py-2 text-sm font-medium text-amber-600"
      >
        + Ajouter une étape
      </button>
    </div>
  )
}
