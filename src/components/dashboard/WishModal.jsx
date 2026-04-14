import { useState } from 'react'

export default function WishModal({ open, onSave, saving }) {
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = primary.trim()
    if (!v) return
    await onSave({
      wish: v,
      secondary_wish: secondary.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a1628]/85 backdrop-blur-md" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wish-modal-title"
        className="relative w-full max-w-md rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.98)_0%,rgba(13,31,56,0.92)_100%)] p-8 shadow-[0_40px_100px_rgba(2,12,27,0.65)]"
      >
        <h2 id="wish-modal-title" className="text-xl font-semibold tracking-tight text-slate-100">
          Ton souhait principal
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Avant de commencer, définis l’intention qui guide ta pratique sur Morpho. Tu pourras la modifier
          plus tard depuis le tableau de bord.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <textarea
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            required
            rows={4}
            placeholder="Souhait principal (obligatoire)"
            className="w-full resize-none rounded-2xl border border-slate-600/40 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-500/20"
          />
          <textarea
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            rows={3}
            placeholder="Souhait secondaire (optionnel)"
            className="w-full resize-none rounded-2xl border border-slate-600/40 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={saving || !primary.trim()}
            className="w-full rounded-2xl bg-[var(--accent-blue)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
