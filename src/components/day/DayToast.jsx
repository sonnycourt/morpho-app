import { useEffect } from 'react'

export default function DayToast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined
    const t = window.setTimeout(() => onDismiss(), 3200)
    return () => window.clearTimeout(t)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-8 left-1/2 z-[60] w-[min(90vw,20rem)] -translate-x-1/2"
    >
      <div className="morpho-toast-panel rounded-2xl border border-blue-500/30 bg-[#0d1f38]/95 px-5 py-3 text-center text-sm font-medium text-slate-100 shadow-[0_20px_50px_rgba(2,12,27,0.55)] backdrop-blur-md">
        {message}
      </div>
    </div>
  )
}
