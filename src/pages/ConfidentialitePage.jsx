import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

export default function ConfidentialitePage() {
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
          <h1 className="text-[32px] font-semibold tracking-tight text-[#e8edf5]">Politique de confidentialité</h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#c8d6e8]">Dernière mise à jour : 8 avril 2026</p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Chez Morpho, la protection de tes données personnelles est une priorité absolue. Cette politique explique
            en toute transparence quelles données nous collectons, pourquoi nous les collectons, où elles sont
            stockées, et quels sont tes droits.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">Prends le temps de la lire. C'est important.</p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">
            1. Qui est responsable du traitement de tes données ?
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Le responsable du traitement de tes données personnelles est :
            <br />
            ArgEntrepreneur Sàrl
            <br />
            Chemin du Marais 13
            <br />
            1040 Echallens, Vaud
            <br />
            Suisse
            <br />
            Pour toute question concernant tes données ou pour exercer tes droits :{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">2. Quelles données collectons-nous ?</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Lorsque tu utilises Morpho, nous collectons et traitons les catégories de données suivantes :
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            <strong className="text-[#e8edf5]">Données d'identification :</strong>
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Adresse email
            <br />
            Prénom
            <br />
            Mot de passe (stocké sous forme chiffrée — nous n'y avons jamais accès en clair)
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            <strong className="text-[#e8edf5]">
              Données personnelles que tu écris volontairement dans l'application :
            </strong>
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Ton souhait principal et ton souhait secondaire
            <br />
            Tes entrées de journal quotidiennes (comment tu te sens, ton intention du jour, ta gratitude, ce que tu
            remarques, tes synchronicités)
            <br />
            Ton score d'alignement quotidien (de 1 à 10)
            <br />
            Tes conversations avec le coach IA
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            <strong className="text-[#e8edf5]">Données techniques :</strong>
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Date et heure de tes connexions
            <br />
            Identifiant unique de session
            <br />
            Adresse IP (pour des raisons de sécurité uniquement)
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous ne collectons aucune donnée de navigation externe, aucun cookie publicitaire, aucune donnée de
            géolocalisation, et nous n'utilisons aucun outil de tracking (Google Analytics, Facebook Pixel, etc.).
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">3. Pourquoi collectons-nous ces données ?</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tes données sont utilisées exclusivement pour les finalités suivantes :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Te permettre de te connecter à ton compte et d'accéder à ton journal personnel
            <br />
            Fournir un feedback personnalisé via le coach IA, basé sur ton historique de journal
            <br />
            Mesurer et visualiser ta progression dans le temps
            <br />
            Assurer la sécurité de ton compte
            <br />
            Te contacter si nécessaire concernant ton compte (réinitialisation de mot de passe, changements techniques
            importants)
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous ne vendons jamais tes données à des tiers. Nous ne les utilisons à aucune fin publicitaire ou
            commerciale externe. Nous ne les partageons avec aucun annonceur, courtier en données, ou partenaire
            marketing.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">4. Où tes données sont-elles stockées ?</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tes données sont stockées sur les serveurs de Supabase, situés à Frankfurt, Allemagne, au sein de l'Union
            Européenne.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Ces serveurs respectent les normes de sécurité les plus élevées :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Chiffrement au repos et en transit (SSL/TLS)
            <br />
            Sauvegardes régulières et chiffrées
            <br />
            Accès restreint et authentifié
            <br />
            Conformité RGPD
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">
            5. Traitement par des modèles d'intelligence artificielle — Important
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Cette section est particulièrement importante. Lis-la attentivement.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Lorsque tu écris une entrée de journal ou que tu discutes avec le coach IA, le contenu de ces échanges est
            envoyé à des modèles d'intelligence artificielle tiers pour générer les réponses personnalisées.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous utilisons deux fournisseurs d'IA :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            DeepSeek (société chinoise) — Utilisé pour les conversations quotidiennes avec ton coach IA. Les données
            transitent par les serveurs de DeepSeek situés en Chine.
            <br />
            Anthropic (société américaine) — Utilisé une fois par semaine pour compresser et structurer ta mémoire,
            permettant au coach de se souvenir de ton parcours sur la durée. Les données transitent par les serveurs
            d'Anthropic situés aux États-Unis.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Ce que tu dois impérativement savoir :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tes données ne sont pas utilisées pour entraîner les modèles de DeepSeek ou d'Anthropic. Nous utilisons
            des interfaces de programmation (API) qui garantissent contractuellement cette exclusion.
            <br />
            Tes données ne sont pas stockées de façon permanente par ces fournisseurs. Elles sont traitées en temps
            réel pour générer une réponse, puis éliminées de leurs systèmes actifs.
            <br />
            Seul le contenu strictement nécessaire est transmis à ces modèles : ton souhait principal, ton historique
            récent de journal, ta mémoire compressée, et ton message actuel. Ton email, ton prénom, ton adresse IP et
            tes autres informations d'identification ne sont jamais partagés avec ces fournisseurs.
            <br />
            En utilisant Morpho, tu consens explicitement au transfert de ces données vers la Chine (DeepSeek) et les
            États-Unis (Anthropic), en dehors de l'Espace Économique Européen.
            <br />
            Ces transferts internationaux de données sont encadrés par les conditions d'utilisation des fournisseurs,
            qui s'engagent à respecter des niveaux de protection appropriés.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Si tu ne souhaites pas que tes données soient traitées par ces modèles d'intelligence artificielle, tu peux
            nous contacter à{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>{' '}
            pour demander la suppression complète de ton compte. Nous comprenons parfaitement ce choix et nous le
            respecterons.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">6. Durée de conservation des données</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tes données sont conservées aussi longtemps que ton compte est actif.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Si tu demandes la suppression de ton compte, ou si ton compte reste inactif pendant une période prolongée
            (plus de 24 mois), toutes tes données seront effacées définitivement dans un délai maximum de 30 jours.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Certaines données peuvent être conservées au-delà de cette période uniquement si la loi nous l'impose
            (obligations comptables, fiscales ou légales).
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">7. Tes droits</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la Loi fédérale suisse sur la
            protection des données (LPD), tu disposes des droits suivants concernant tes données personnelles :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Droit d'accès — Tu peux obtenir une copie de toutes les données que nous avons sur toi.
            <br />
            Droit de rectification — Tu peux corriger toute donnée inexacte ou incomplète.
            <br />
            Droit à l'effacement (droit à l'oubli) — Tu peux demander la suppression complète de ton compte et de
            toutes tes données.
            <br />
            Droit à la portabilité — Tu peux recevoir tes données dans un format structuré et lisible (JSON, CSV).
            <br />
            Droit d'opposition — Tu peux t'opposer à certains traitements de tes données.
            <br />
            Droit à la limitation — Tu peux demander la suspension temporaire du traitement de tes données.
            <br />
            Droit de retirer ton consentement — Tu peux retirer à tout moment ton consentement au traitement de tes
            données par les modèles d'intelligence artificielle (ce qui entraînera la suppression de ton compte,
            puisque le coach IA est au cœur de l'application).
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour exercer un ou plusieurs de ces droits, écris-nous simplement à :{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous te répondrons dans un délai maximum de 30 jours à compter de la réception de ta demande.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">8. Sécurité de tes données</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous mettons en œuvre des mesures techniques et organisationnelles strictes pour protéger tes données :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Chiffrement SSL/TLS pour toutes les communications entre ton appareil et nos serveurs
            <br />
            Mots de passe hashés (jamais stockés en clair, utilisant l'algorithme bcrypt)
            <br />
            Row Level Security (RLS) au niveau de la base de données : tu es le seul à pouvoir accéder à tes propres
            données
            <br />
            Accès restreint aux données par le personnel d'ArgEntrepreneur Sàrl (strictement limité aux besoins de
            support)
            <br />
            Sauvegardes chiffrées et régulières
            <br />
            Surveillance continue des tentatives d'accès non autorisé
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Malgré toutes ces mesures, aucun système n'est infaillible. En cas de violation de données susceptible
            d'affecter tes droits et libertés, nous nous engageons à t'en informer dans les meilleurs délais,
            conformément à la réglementation en vigueur.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">9. Cookies et technologies de suivi</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Morpho utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de l'application
            :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Cookie de session pour maintenir ta connexion
            <br />
            Cookie de préférences pour mémoriser tes réglages
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous n'utilisons aucun cookie de tracking, aucun cookie publicitaire, aucun cookie tiers à des fins
            marketing. Il n'y a donc pas de bannière de consentement aux cookies dans Morpho, conformément à la
            réglementation ePrivacy et RGPD qui exemptent les cookies strictement nécessaires du consentement.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">10. Protection des mineurs</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Morpho n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données
            personnelles auprès de mineurs.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Si tu es parent ou tuteur et que tu découvres que ton enfant nous a fourni des données personnelles sans
            ton consentement, contacte-nous immédiatement à{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>{' '}
            pour que nous supprimions ces informations.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">11. Transferts internationaux de données</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Comme mentionné en section 5, certaines de tes données peuvent être transférées en dehors de l'Espace
            Économique Européen, notamment vers la Chine (DeepSeek) et les États-Unis (Anthropic), dans le cadre du
            traitement par les modèles d'intelligence artificielle.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Ces transferts sont encadrés par les conditions d'utilisation des fournisseurs concernés et ne concernent
            que les données strictement nécessaires au fonctionnement du coach IA.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">
            12. Modifications de cette politique de confidentialité
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous nous réservons le droit de mettre à jour cette politique de confidentialité à tout moment. En cas de
            changement significatif, tu seras notifié par email à l'adresse associée à ton compte.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            La date de dernière mise à jour est indiquée en haut de cette page. Nous t'invitons à la consulter
            régulièrement.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">13. Autorité de contrôle</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation auprès de
            l'autorité de contrôle compétente :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            En Suisse : Préposé fédéral à la protection des données et à la transparence (PFPDT), Feldeggweg 1, 3003
            Berne —{' '}
            <a
              href="https://www.edoeb.admin.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              www.edoeb.admin.ch
            </a>
            <br />
            En France : Commission nationale de l'informatique et des libertés (CNIL), 3 Place de Fontenoy, 75007
            Paris —{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              www.cnil.fr
            </a>
            <br />
            Dans l'Union Européenne : l'autorité de protection des données de ton pays de résidence.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">14. Contact</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour toute question concernant cette politique de confidentialité ou le traitement de tes données
            personnelles :
            <br />
            ArgEntrepreneur Sàrl
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
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous nous engageons à te répondre dans les meilleurs délais.
          </p>
        </section>
      </div>
      <Footer />
    </main>
  )
}
