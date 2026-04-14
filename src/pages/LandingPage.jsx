import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function LandingPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    const savedPath = sessionStorage.getItem('morpho_last_path')
    if (savedPath === '/coach') return <Navigate to="/coach" replace />
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* ── Atmospheric lighting ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.30) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 80% 80%, rgba(29,78,216,0.15) 0%, transparent 60%),' +
            'radial-gradient(ellipse 40% 30% at 15% 60%, rgba(37,99,235,0.10) 0%, transparent 55%)',
        }}
      />

      {/* ── Subtle star-field ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          [12, 18], [28, 42], [55, 8], [72, 30], [88, 15], [6, 65], [42, 78],
          [68, 88], [91, 55], [35, 92], [19, 76], [79, 68],
        ].map(([x, y], i) => (
          <span
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-blue-200/40"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
      </div>

      {/* ── Top nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8">
        <div className="flex items-center gap-2">
          <img
            src="/logo-morpho.webp"
            alt="Morpho"
            className="h-6 w-6 rounded-[5px] object-cover"
            loading="eager"
          />
          <span className="text-xs font-semibold tracking-[0.22em] text-[#9cb2d8] uppercase">
            MORPHO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/register"
            className="rounded-[12px] bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.45)] transition-all hover:brightness-110 active:scale-[0.98] sm:px-4 sm:text-sm"
          >
            Créer mon compte
          </Link>
          <Link
            to="/login"
            className="rounded-[12px] border border-[rgba(148,163,184,0.22)] bg-white/5 px-3 py-2 text-xs font-medium text-[#dbe8fa] backdrop-blur-sm transition-all hover:bg-white/10 active:scale-[0.98] sm:px-4 sm:text-sm"
          >
            J'ai déjà un compte
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-6 pt-10 text-center sm:px-6 sm:pt-12">
        <section className="morpho-fade-in w-full max-w-[920px] rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,31,56,0.82)_0%,rgba(13,31,56,0.58)_100%)] px-5 py-8 shadow-[0_30px_100px_rgba(2,12,27,0.55)] backdrop-blur-xl sm:px-8 sm:py-10">

        {/* Tagline */}
        <div
          className="morpho-fade-in mx-auto max-w-[780px]"
          style={{ animationDelay: '0.15s' }}
        >
          <h1
            className="mb-4 text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.025em] text-white sm:text-[3.35rem]"
          >
            <span className="uppercase text-white">Ta transformation</span>
            <br />
            <span className="uppercase text-[#3b82f6]">jour après jour.</span>
          </h1>

          <p className="mx-auto max-w-[640px] text-[0.96rem] leading-relaxed text-[#b8cae6] sm:text-[1.03rem]">
            Morpho est ton compagnon de métamorphose.
            <br />
            Un journal, un coach, une mémoire qui évolue avec toi sur 6 mois.
          </p>
        </div>

        {/* Center media placeholder */}
        <div
          className="morpho-fade-in mx-auto mt-8 w-full max-w-[720px]"
          style={{ animationDelay: '0.28s' }}
        >
          <div className="overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_90px_rgba(2,12,27,0.6)]">
            <img
              src="/morpho-preview.webp"
              alt="Aperçu Morpho"
              className="block w-full scale-x-[1.15]"
              loading="eager"
            />
          </div>
        </div>

        {/* Member badge */}
        <div
          className="morpho-fade-in mt-7 flex flex-col items-center gap-2"
          style={{ animationDelay: '0.52s' }}
        >
          <p className="text-xs text-[#8ea9cf]">
            Réservé aux membres d'Esprit Subconscient 2.0
          </p>
        </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer
        className="morpho-fade-in relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 pb-8 pt-4 text-[0.7rem] text-[#7a9cc4]"
        style={{ animationDelay: '0.60s' }}
      >
        <Link to="/mentions-legales" className="hover:text-slate-300 transition">Mentions légales</Link>
        <span aria-hidden>·</span>
        <Link to="/cgu" className="hover:text-slate-300 transition">CGU</Link>
        <span aria-hidden>·</span>
        <Link to="/confidentialite" className="hover:text-slate-300 transition">Confidentialité</Link>
      </footer>
    </main>
  )
}
