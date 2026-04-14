import { useState } from 'react'
import { premiumDashboardCardStyle } from '../../lib/premiumDashboardCard'

function WishItem({ title, optional, value, saving, onSave, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const save = async () => {
    const v = draft.trim()
    if (!v && !optional) return
    await onSave(v)
    setEditing(false)
  }

  return (
    <div style={premiumDashboardCardStyle}>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-300/80">
        {title} {optional ? <span className="normal-case text-[var(--text-muted)]">(optionnel)</span> : null}
      </p>
      {editing ? (
        <div className="mt-3 space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-600/40 bg-slate-950/35 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || (!optional && !draft.trim())}
              onClick={save}
              className="rounded-xl bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(value || '')
                setEditing(false)
              }}
              className="rounded-xl border border-slate-500/35 px-4 py-2 text-sm text-slate-300"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value || '')
            setEditing(true)
          }}
          className="mt-2 w-full rounded-xl py-1 text-left text-base leading-snug text-slate-100 transition hover:text-white"
        >
          {value?.trim() ? <span className="line-clamp-4">{value}</span> : <span className="text-[var(--text-muted)]">{placeholder}</span>}
        </button>
      )}
    </div>
  )
}

export default function WishBanner({ wish, secondaryWish, onUpdateWish, saving }) {
  const updatePrimary = async (value) => onUpdateWish({ wish: value, secondary_wish: secondaryWish ?? null })
  const updateSecondary = async (value) => onUpdateWish({ wish: wish ?? '', secondary_wish: value || null })

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-300/90">Mes souhaits</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <WishItem
          title="Souhait principal"
          value={wish}
          optional={false}
          saving={saving}
          onSave={updatePrimary}
          placeholder="Appuie pour définir ton souhait principal"
        />
        <WishItem
          title="Souhait secondaire"
          value={secondaryWish}
          optional
          saving={saving}
          onSave={updateSecondary}
          placeholder="Appuie pour définir un souhait secondaire"
        />
      </div>
    </section>
  )
}
