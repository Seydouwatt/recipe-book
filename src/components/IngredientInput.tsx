import type { Ingredient } from '../types'

interface Props {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

export default function IngredientInput({ ingredients, onChange }: Props) {
  const update = (index: number, field: keyof Ingredient, value: string | number) => {
    const next = [...ingredients]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  const add = () => {
    onChange([...ingredients, { name: '', qty: 0, unit: '' }])
  }

  const remove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-amber-900">Ingrédients</label>
      {ingredients.map((ing, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Nom"
            value={ing.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-amber-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Qté"
            value={ing.qty || ''}
            onChange={(e) => update(i, 'qty', Number(e.target.value))}
            className="w-16 rounded-lg border border-amber-200 px-2 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Unité"
            value={ing.unit}
            onChange={(e) => update(i, 'unit', e.target.value)}
            className="w-20 rounded-lg border border-amber-200 px-2 py-2 text-sm"
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
        + Ajouter un ingrédient
      </button>
    </div>
  )
}
