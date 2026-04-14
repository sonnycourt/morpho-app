import { Link, useNavigate } from 'react-router-dom'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

export default function LegalPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const firstName = user?.user_metadata?.first_name?.trim() || user?.email?.split('@')[0] || 'Profil'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const cards = [
    {
      title: 'Mentions légales',
      description: 'Éditeur, hébergeur et propriété intellectuelle',
      to: '/mentions-legales',
    },
    {
      title: 'Politique de confidentialité',
      description: 'Comment tes données sont collectées, stockées et protégées',
      to: '/confidentialite',
    },
    {
      title: "Conditions générales d'utilisation",
      description: "Règles et conditions d'utilisation de Morpho",
      to: '/cgu',
    },
  ]

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.82)_100%)] p-5 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl sm:p-8">
          <DashboardHeader firstName={firstName} onLogout={handleLogout} activeTab="legal" />

          <div className="mx-auto mt-8 max-w-[720px]">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Documents légaux</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Informations juridiques concernant Morpho</p>

            <div className="mt-6 space-y-3">
              {cards.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="group flex items-center justify-between rounded-xl border border-[rgba(59,130,246,0.15)] bg-[#0d1f38] px-6 py-5 transition hover:border-[rgba(96,165,250,0.45)] hover:bg-[#12243f]"
                >
                  <div>
                    <p className="text-base font-medium text-[#e8edf5]">{card.title}</p>
                    <p className="mt-1 text-sm text-[#c8d6e8]">{card.description}</p>
                  </div>
                  <span className="ml-4 text-lg text-[#60a5fa] transition group-hover:translate-x-0.5">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
