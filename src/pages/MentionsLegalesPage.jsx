import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

export default function MentionsLegalesPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#0a1628] text-[#e8edf5]">
      <div className="mx-auto max-w-[720px] px-5 py-12 md:px-8 md:py-12">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-2xl font-medium tracking-tight text-slate-100">
            <img src="/logo-morpho.webp" alt="Logo Morpho" className="h-6 w-6 rounded-[4px] object-cover" />
            <span>Morpho</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-blue-500/35 bg-blue-600/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-400/60 hover:bg-blue-600/20"
          >
            Retour
          </button>
        </header>

        <section className="rounded-[24px] border border-[rgba(59,130,246,0.15)] bg-[#0d1f38] p-6 shadow-[0_20px_50px_rgba(2,12,27,0.35)] md:p-8">
          <h1 className="text-[32px] font-semibold tracking-tight text-[#e8edf5]">Mentions légales</h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#c8d6e8]">Dernière mise à jour : 8 avril 2026</p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Éditeur de l'application</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            L'application Morpho est éditée par :
            <br />
            <strong className="text-[#e8edf5]">ArgEntrepreneur Sàrl</strong>
            <br />
            Chemin du Marais 13
            <br />
            1040 Echallens, Vaud
            <br />
            Suisse
            <br />
            Responsable de publication : Sonny Court
            <br />
            Contact :{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Hébergement</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            L'application Morpho est hébergée par :
            <br />
            <strong className="text-[#e8edf5]">Netlify Inc.</strong>
            <br />
            2325 3rd Street, Suite 215
            <br />
            San Francisco, CA 94107
            <br />
            États-Unis
            <br />
            La base de données et le système d'authentification sont gérés par :
            <br />
            <strong className="text-[#e8edf5]">Supabase Inc.</strong>
            <br />
            Serveurs situés à Frankfurt, Allemagne (Union Européenne)
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Propriété intellectuelle</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            L'ensemble du contenu de l'application Morpho — incluant mais non limité aux textes, à l'interface, au
            design, aux logos, au nom "Morpho", à la méthodologie pédagogique, aux contenus audio, et à tous les
            autres éléments présents sur l'application — est la propriété exclusive de{' '}
            <strong className="text-[#e8edf5]">ArgEntrepreneur Sàrl</strong> et est protégé par les lois suisses et
            internationales relatives à la propriété intellectuelle.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle de ces
            éléments, quel que soit le moyen ou le procédé utilisé, est strictement interdite sans l'autorisation
            écrite préalable de <strong className="text-[#e8edf5]">ArgEntrepreneur Sàrl</strong>.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Données personnelles</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour toute information concernant la collecte et le traitement de vos données personnelles, veuillez
            consulter notre{' '}
            <Link to="/confidentialite" className="text-[#60a5fa] transition hover:text-[#93c5fd]">
              Politique de confidentialité
            </Link>
            .
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Conditions d'utilisation</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour connaître les règles d'utilisation de l'application, veuillez consulter nos{' '}
            <Link to="/cgu" className="text-[#60a5fa] transition hover:text-[#93c5fd]">
              Conditions générales d'utilisation
            </Link>
            .
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Droit applicable</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Les présentes mentions légales sont régies par le droit suisse. En cas de litige, les tribunaux de
            Lausanne seront seuls compétents, sous réserve des dispositions légales impératives en matière de
            protection des consommateurs.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">Contact</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour toute question relative aux présentes mentions légales ou à l'application Morpho :
            <br />
            <strong className="text-[#e8edf5]">ArgEntrepreneur Sàrl</strong>
            <br />
            Chemin du Marais 13
            <br />
            1040 Echallens, Vaud
            <br />
            Suisse
            <br />
            Email :{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>
          </p>
        </section>
      </div>
      <Footer />
    </main>
  )
}
