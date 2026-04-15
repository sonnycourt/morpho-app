import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { isAdmin } from '../../lib/admin'

function tabClass(active) {
  return [
    'whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm',
    active
      ? 'border-blue-400/70 bg-blue-600/20 text-blue-100'
      : 'border-blue-500/35 bg-blue-600/10 text-blue-200 hover:border-blue-400/60 hover:bg-blue-600/20',
  ].join(' ')
}

export default function DashboardHeader({ firstName, onLogout, activeTab = 'dashboard' }) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const itemClass =
    'block rounded-lg px-[14px] py-[10px] text-[14px] text-[#c8d6e8] transition hover:bg-[rgba(59,130,246,0.1)] hover:text-white'

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-2 truncate text-2xl font-medium tracking-tight text-slate-100"
          style={{ fontFamily: 'ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif' }}
        >
          <img
            src="/logo-morpho.webp"
            alt="Logo Morpho"
            className="h-6 w-6 rounded-[4px] object-cover"
            loading="eager"
            decoding="async"
          />
          <span>Morpho</span>
        </span>
      </div>

      <div className="flex justify-center gap-2 px-1">
        <Link to="/dashboard" className={tabClass(activeTab === 'dashboard')}>
          Mon journal
        </Link>
        <Link to="/coach" className={tabClass(activeTab === 'coach')}>
          Mon Coach
        </Link>
      </div>

      <div className="relative flex min-w-0 items-center justify-end" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={[
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold tracking-wide transition sm:h-10 sm:text-sm',
            'border-slate-400/30 bg-white/8 text-slate-100 shadow-[0_6px_18px_rgba(2,12,27,0.28)]',
            menuOpen
              ? 'border-blue-300/65 bg-blue-500/25 text-white'
              : 'hover:border-blue-300/50 hover:bg-white/12 hover:text-white',
          ].join(' ')}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          {firstName}
          <span className="text-[10px] leading-none text-blue-200/80">{menuOpen ? '▴' : '▾'}</span>
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-[calc(100%+10px)] z-40 w-[200px] rounded-xl border bg-[#0d1f38] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}
            role="menu"
          >
            <div>
              {isAdmin(user) ? (
                <Link to="/admin" className={itemClass} role="menuitem" onClick={() => setMenuOpen(false)}>
                  🛡 Admin
                </Link>
              ) : null}
              <Link to="/settings" className={itemClass} role="menuitem" onClick={() => setMenuOpen(false)}>
                Mon compte
              </Link>
              <a
                href="https://volt.sonnycourt.com"
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Ma formation
              </a>
              <a
                href="https://sonnycourt.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Support
              </a>
            </div>

            <div className="my-1 border-t" style={{ borderColor: 'rgba(59, 130, 246, 0.15)', borderTopWidth: 0.5 }} />

            <div>
              <Link to="/legal" className={itemClass} role="menuitem" onClick={() => setMenuOpen(false)}>
                Légal
              </Link>
            </div>

            <div className="my-1 border-t" style={{ borderColor: 'rgba(59, 130, 246, 0.15)', borderTopWidth: 0.5 }} />

            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false)
                await onLogout()
              }}
              className={`${itemClass} w-full text-left`}
              role="menuitem"
            >
              Déconnexion
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
