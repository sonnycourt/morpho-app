import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-blue-500/10 py-6">
      <div className="mx-auto max-w-5xl px-4 text-center md:px-8">
        <p className="text-[13px] text-[#7a9cc4]">
          <span>© 2026 Morpho</span>
          <span className="mx-2">·</span>
          <Link to="/mentions-legales" className="transition hover:text-[#60a5fa]">
            Mentions légales
          </Link>
          <span className="mx-2">·</span>
          <Link to="/confidentialite" className="transition hover:text-[#60a5fa]">
            Confidentialité
          </Link>
          <span className="mx-2">·</span>
          <Link to="/cgu" className="transition hover:text-[#60a5fa]">
            CGU
          </Link>
          <span className="mx-2">·</span>
          <a
            href="https://sonnycourt.com/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-[#60a5fa]"
          >
            Contact
          </a>
        </p>
        <p className="mt-2 text-[11px] text-[#4a6080]">Édité par ArgEntrepreneur Sàrl — Lausanne, Suisse</p>
      </div>
    </footer>
  )
}
