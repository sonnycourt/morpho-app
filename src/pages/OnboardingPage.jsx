import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

const radioClass = [
  'w-full cursor-pointer rounded-xl border px-6 py-4 text-left text-base transition-all duration-200',
  'border-[rgba(59,130,246,0.2)] bg-[#0d1f38] text-[#e8edf5]',
  'hover:border-[rgba(59,130,246,0.4)] hover:bg-[#12243f]',
].join(' ')

function MotionPane({ children, active, direction }) {
  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateX(0px)' : `translateX(${direction > 0 ? 20 : -20}px)`,
      }}
    >
      {children}
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(-1)
  const [direction, setDirection] = useState(1)
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [firstName, setFirstName] = useState('toi')
  const [answers, setAnswers] = useState({
    age_range: '',
    gender: '',
    country: '',
    discovery_source: '',
  })

  const totalQuestions = 4
  const questionNumber = step >= 0 && step < totalQuestions ? step + 1 : 0
  const progressPercent = questionNumber > 0 ? (questionNumber / totalQuestions) * 100 : 0

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('profiles')
        .select('first_name, age_range, gender, country, discovery_source')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (data?.first_name?.trim()) setFirstName(data.first_name.trim())
      setAnswers((prev) => ({
        ...prev,
        age_range: data?.age_range ?? '',
        gender: data?.gender ?? '',
        country: data?.country ?? '',
        discovery_source: data?.discovery_source ?? '',
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const animateTo = (nextStep, nextDirection = 1) => {
    setDirection(nextDirection)
    setActive(false)
    window.setTimeout(() => {
      setStep(nextStep)
      setActive(true)
    }, 120)
  }

  const handleRadio = (field, value, nextStep) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
    window.setTimeout(() => animateTo(nextStep, 1), 80)
  }

  const canContinueCountry = Boolean(answers.country)

  const finishOnboarding = async () => {
    if (!user?.id || saving) return
    setSaving(true)
    setError('')

    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        age_range: answers.age_range || null,
        gender: answers.gender || null,
        country: answers.country || null,
        discovery_source: answers.discovery_source || null,
        onboarding_completed: true,
      })
      .eq('id', user.id)
      .select('id, onboarding_completed')
      .maybeSingle()

    console.log('[onboarding] update result', { data: updateData, error: updateError })

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    const { data: refreshedProfile, error: refreshError } = await supabase
      .from('profiles')
      .select('id, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    console.log('[onboarding] refresh result', { data: refreshedProfile, error: refreshError })

    if (refreshError) {
      setSaving(false)
      setError(refreshError.message)
      return
    }

    if (!refreshedProfile?.onboarding_completed) {
      setSaving(false)
      setError("Impossible de finaliser l'onboarding. Réessaie dans quelques secondes.")
      return
    }

    setSaving(false)
    navigate('/dashboard', { replace: true, state: { skipOnboardingCheck: true } })
  }

  const showBack = step > 0 && step < 4

  const content = (() => {
    if (step === -1) {
      return (
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#e8edf5]">Faisons connaissance</h1>
          <p className="mx-auto mt-4 max-w-md text-base text-[#7a9cc4]">
            4 questions rapides pour personnaliser ton expérience. Ça prend 30 secondes.
          </p>
          <button
            type="button"
            onClick={() => animateTo(0, 1)}
            className="mt-10 rounded-xl bg-[#2563eb] px-10 py-3 text-base font-semibold text-white transition hover:brightness-110"
          >
            Commencer
          </button>
        </div>
      )
    }

    if (step === 0) {
      const options = [
        ['18 - 24 ans', '18-24'],
        ['25 - 34 ans', '25-34'],
        ['35 - 44 ans', '35-44'],
        ['45 - 54 ans', '45-54'],
        ['55 - 64 ans', '55-64'],
        ['65 ans et plus', '65+'],
      ]
      return (
        <div>
          <h2 className="text-2xl font-semibold text-[#e8edf5]">Quel âge as-tu ?</h2>
          <p className="mt-2 text-sm text-[#7a9cc4]">Aucun jugement, juste pour mieux te comprendre.</p>
          <div className="mt-6 space-y-3">
            {options.map(([label, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRadio('age_range', value, 1)}
                className={`${radioClass} ${
                  answers.age_range === value
                    ? 'border-[#3b82f6] bg-[rgba(37,99,235,0.15)] text-white'
                    : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 1) {
      const options = [
        ['Une femme', 'female'],
        ['Un homme', 'male'],
        ['Autre / Je préfère ne pas préciser', 'other'],
      ]
      return (
        <div>
          <h2 className="text-2xl font-semibold text-[#e8edf5]">Tu es ?</h2>
          <div className="mt-6 space-y-3">
            {options.map(([label, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRadio('gender', value, 2)}
                className={`${radioClass} ${
                  answers.gender === value ? 'border-[#3b82f6] bg-[rgba(37,99,235,0.15)] text-white' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      const countries = [
        'France',
        'Belgique',
        'Suisse',
        'Canada',
        'Maroc',
        'Algérie',
        'Tunisie',
        'Sénégal',
        "Côte d'Ivoire",
        'Autre',
      ]
      return (
        <div>
          <h2 className="text-2xl font-semibold text-[#e8edf5]">Dans quel pays tu vis ?</h2>
          <div className="mt-6">
            <select
              value={answers.country}
              onChange={(e) => setAnswers((prev) => ({ ...prev, country: e.target.value }))}
              className="w-full rounded-xl border border-[rgba(59,130,246,0.2)] bg-[#0d1f38] px-6 py-4 text-base text-[#e8edf5] outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Sélectionne ton pays</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => animateTo(3, 1)}
              disabled={!canContinueCountry}
              className="mt-6 rounded-xl bg-[#2563eb] px-8 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      )
    }

    if (step === 3) {
      const options = [
        'Instagram',
        'TikTok',
        'YouTube',
        'Facebook',
        "Recommandation d'un proche",
        'Recherche Google',
        'Autre',
      ]
      return (
        <div>
          <h2 className="text-2xl font-semibold text-[#e8edf5]">Comment tu m'as connu ?</h2>
          <p className="mt-2 text-sm text-[#7a9cc4]">La première fois que tu as vu mon contenu.</p>
          <div className="mt-6 space-y-3">
            {options.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAnswers((prev) => ({ ...prev, discovery_source: value }))
                  window.setTimeout(() => animateTo(4, 1), 80)
                }}
                className={`${radioClass} ${
                  answers.discovery_source === value
                    ? 'border-[#3b82f6] bg-[rgba(37,99,235,0.15)] text-white'
                    : ''
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/45 bg-blue-500/15 text-[#3b82f6] transition-opacity duration-300">
          ✓
        </div>
        <h2 className="mt-5 text-3xl font-semibold text-[#e8edf5]">C'est parti, {firstName}</h2>
        <p className="mt-3 text-base text-[#7a9cc4]">Bienvenue dans Morpho. Ton parcours commence maintenant.</p>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        <button
          type="button"
          onClick={finishOnboarding}
          disabled={saving}
          className="mt-8 rounded-xl bg-[#2563eb] px-8 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Validation...' : 'Accéder à mon tableau de bord'}
        </button>
      </div>
    )
  })()

  return (
    <main className="min-h-screen bg-[#0a1628] text-[#e8edf5]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-6 py-8">
        <div className="mb-8 inline-flex items-center gap-2 self-start text-lg font-medium text-slate-100">
          <img src="/logo-morpho.webp" alt="Logo Morpho" className="h-5 w-5 rounded-[4px] object-cover" />
          <span>Morpho</span>
        </div>

        <div className="mb-8 min-h-[38px]">
          {step >= 0 && step < 4 ? (
            <>
              <p className="mb-2 text-xs text-[#7a9cc4]">Question {questionNumber} sur 4</p>
              <div className="h-[3px] w-full max-w-[480px] rounded-full bg-[rgba(59,130,246,0.15)]">
                <div
                  className="h-[3px] rounded-full bg-[#3b82f6] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="flex flex-1 items-center">
          <MotionPane active={active} direction={direction}>
            {content}
          </MotionPane>
        </div>

        <div className="mt-8 min-h-7">
          {showBack ? (
            <button
              type="button"
              onClick={() => animateTo(step - 1, -1)}
              className="text-sm text-[#7a9cc4] transition hover:text-[#93c5fd]"
            >
              ← Retour
            </button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
