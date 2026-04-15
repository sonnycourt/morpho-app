import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children, footer, showHomeBack = false }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-[90px]" />
      <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-blue-700/20 blur-[110px]" />

      <section className="relative w-full max-w-md rounded-[30px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.78)_100%)] p-8 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-blue-300/95">
              <img
                src="/logo-morpho.webp"
                alt="Logo Morpho"
                className="h-5 w-5 rounded-[4px] object-cover"
                loading="eager"
                decoding="async"
              />
              <span>MORPHO</span>
            </Link>
            {showHomeBack ? (
              <Link
                to="/"
                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/25 bg-[#0a1a31] px-2.5 py-1.5 text-xs text-blue-200 hover:border-blue-400/45"
              >
                <span aria-hidden>←</span>
                Accueil
              </Link>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">{title}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>

        {children}

        {footer ? <div className="mt-6 text-sm text-[var(--text-muted)]">{footer}</div> : null}
      </section>
    </main>
  )
}
