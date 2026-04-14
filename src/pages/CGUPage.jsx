import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

export default function CGUPage() {
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
          <h1 className="text-[32px] font-semibold tracking-tight text-[#e8edf5]">Conditions générales d'utilisation</h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#c8d6e8]">Dernière mise à jour : 8 avril 2026</p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Bienvenue sur Morpho. En créant un compte et en utilisant l'application, tu acceptes les conditions
            ci-dessous. Prends le temps de les lire attentivement.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">1. Présentation de l'application</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Morpho est une application web de journal de transformation personnelle, éditée par ArgEntrepreneur Sàrl
            (Echallens, Suisse). Elle est accessible à l'adresse morpho.day et est fournie exclusivement aux personnes
            ayant acquis la formation Esprit Subconscient 2.0.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">L'application propose :</p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Un journal quotidien pour suivre ton état d'être et ta progression
            <br />
            Un coach IA personnalisé inspiré de la sagesse de Neville Goddard
            <br />
            Un suivi visuel de ton parcours de transformation
            <br />
            Une mémoire compressée qui permet au coach de te connaître dans le temps
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">2. Accès à l'application</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            L'accès à Morpho est strictement réservé aux personnes ayant acquis la formation Esprit Subconscient 2.0.
            Toute création de compte en dehors de ce cadre peut entraîner la suppression immédiate du compte sans
            préavis ni remboursement.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tu dois avoir au moins 18 ans pour utiliser Morpho. En créant un compte, tu confirmes avoir atteint cet
            âge. Morpho n'est pas destiné aux mineurs.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">3. Création et sécurité du compte</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour utiliser Morpho, tu dois créer un compte avec :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Une adresse email valide
            <br />
            Un mot de passe sécurisé
            <br />
            Ton prénom
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tu es seul responsable de la confidentialité de ton mot de passe et de toute activité effectuée depuis ton
            compte. Si tu soupçonnes une utilisation non autorisée de ton compte, contacte-nous immédiatement à{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>
            .
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Le partage de ton compte avec une tierce personne est strictement interdit et peut entraîner la suspension
            immédiate de ton accès.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">4. Utilisation responsable de l'application</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            En utilisant Morpho, tu t'engages à :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Ne pas utiliser l'application à des fins illégales, frauduleuses ou contraires à l'ordre public
            <br />
            Ne pas tenter d'accéder aux données d'autres utilisateurs
            <br />
            Ne pas tenter de contourner les limites techniques de l'application (notamment la limite quotidienne de
            messages avec le coach IA)
            <br />
            Ne pas utiliser l'application pour diffuser du contenu haineux, violent, diffamatoire, ou illégal
            <br />
            Ne pas partager tes identifiants de connexion avec d'autres personnes
            <br />
            Ne pas copier, reproduire ou redistribuer le contenu pédagogique de l'application
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Toute violation de ces règles peut entraîner la suspension ou la suppression définitive de ton compte, sans
            remboursement.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">5. Le coach IA — Avertissements importants</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Le coach IA de Morpho est un outil d'accompagnement basé sur des modèles d'intelligence artificielle. Il
            est essentiel de comprendre les points suivants :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Le coach IA n'est pas un professionnel de santé. Ses conseils ne remplacent en aucun cas un suivi médical,
            psychologique ou psychiatrique par un professionnel qualifié.
            <br />
            Les réponses du coach peuvent contenir des erreurs ou des imprécisions. Utilise ton discernement et ne
            prends pas toutes ses réponses comme des vérités absolues.
            <br />
            Le coach ne remplace pas un thérapeute. Si tu traverses une période de détresse psychologique, nous
            t'encourageons fortement à consulter un professionnel de santé mentale qualifié.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            En cas de crise suicidaire ou de danger immédiat, contacte immédiatement les services d'urgence :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Suisse : 144 (urgences) ou 143 (La Main Tendue)
            <br />
            France : 112 ou 3114 (numéro national de prévention du suicide)
            <br />
            Belgique : 112 ou 0800 32 123 (Centre de Prévention du Suicide)
            <br />
            Canada : 911 ou 1-833-456-4566
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Une limite de 10 messages par jour avec le coach IA est appliquée pour préserver la qualité du service et
            gérer les coûts de traitement des modèles d'intelligence artificielle.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">6. Propriété intellectuelle</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Contenu de l'application : Tout le contenu de Morpho (design, textes, méthodologie, audios, vidéos, logos,
            nom "Morpho") est la propriété exclusive d'ArgEntrepreneur Sàrl et est protégé par les lois sur la
            propriété intellectuelle.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tes contenus personnels : Les entrées de journal que tu écris et tes conversations avec le coach IA restent
            ta propriété. Nous ne les utilisons que pour te fournir le service, conformément à notre politique de
            confidentialité.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tu ne peux ni copier, ni reproduire, ni redistribuer le contenu pédagogique de l'application sans
            autorisation écrite préalable d'ArgEntrepreneur Sàrl.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">7. Disponibilité du service</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous nous efforçons de maintenir l'application accessible 24h/24 et 7j/7. Cependant, nous ne pouvons
            garantir une disponibilité ininterrompue. Des maintenances, pannes, mises à jour ou incidents techniques
            peuvent temporairement rendre l'application indisponible.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous ne saurions être tenus responsables des conséquences d'une indisponibilité temporaire du service.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">8. Limitation de responsabilité</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Morpho est fourni "en l'état" et "selon disponibilité". ArgEntrepreneur Sàrl s'efforce de fournir un
            service de qualité, mais ne peut garantir :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Un fonctionnement totalement ininterrompu et sans erreur
            <br />
            L'exactitude absolue des réponses générées par le coach IA
            <br />
            Des résultats spécifiques de transformation personnelle (chaque parcours est unique)
            <br />
            La compatibilité avec tous les appareils et navigateurs
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            ArgEntrepreneur Sàrl ne pourra être tenue responsable de dommages directs ou indirects résultant de
            l'utilisation ou de l'impossibilité d'utiliser l'application, sauf en cas de faute lourde ou
            intentionnelle.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            <strong className="text-[#e8edf5]">
              Important : Morpho est un outil d'accompagnement personnel, pas un traitement médical.
            </strong>{' '}
            Si tu souffres de troubles psychologiques, psychiatriques ou physiques, consulte un professionnel de santé
            qualifié.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">9. Suspension et suppression du compte</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous nous réservons le droit de suspendre ou de supprimer ton compte, sans préavis ni remboursement, en
            cas de :
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Violation des présentes CGU
            <br />
            Utilisation frauduleuse ou abusive de l'application
            <br />
            Non-respect de la politique de confidentialité
            <br />
            Tentative de nuire à d'autres utilisateurs ou à l'intégrité de l'application
            <br />
            Comportement inapproprié dans les conversations avec le coach IA
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Tu peux à tout moment demander la suppression de ton compte en écrivant à{' '}
            <a
              href="mailto:support@sonnycourt.com"
              className="text-[#60a5fa] transition hover:text-[#93c5fd]"
            >
              support@sonnycourt.com
            </a>
            . Toutes tes données seront alors effacées dans un délai maximum de 30 jours.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">10. Modifications des CGU</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Nous nous réservons le droit de modifier ces Conditions générales d'utilisation à tout moment. En cas de
            changement significatif, tu seras informé par email. En continuant à utiliser Morpho après une mise à
            jour, tu acceptes les nouvelles conditions.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Il est de ta responsabilité de consulter régulièrement cette page pour prendre connaissance des éventuelles
            modifications.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">11. Liens vers d'autres services</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            L'application Morpho contient un lien vers la plateforme Circle.so (accessible via l'onglet "Ma
            formation") où est hébergé le contenu de la formation Esprit Subconscient 2.0. Cette plateforme est gérée
            par un tiers et dispose de ses propres conditions d'utilisation.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            ArgEntrepreneur Sàrl n'est pas responsable du contenu, des politiques ou des pratiques de cette plateforme
            tierce.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">12. Droit applicable et juridiction</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Les présentes Conditions générales d'utilisation sont régies par le droit suisse.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            En cas de litige, les tribunaux de Lausanne (Suisse) seront seuls compétents, sous réserve des
            dispositions légales impératives en matière de protection des consommateurs dans le pays de résidence de
            l'utilisateur.
          </p>

          <h2 className="mt-10 text-[20px] font-medium text-[#60a5fa]">13. Contact</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#c8d6e8]">
            Pour toute question relative aux présentes Conditions générales d'utilisation :
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
        </section>
      </div>
      <Footer />
    </main>
  )
}
