import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [state, setState] = useState<'loading' | 'valid' | 'invalid' | 'already' | 'success' | 'submitting' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null

  useEffect(() => {
    if (!token) {
      setState('invalid')
      return
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setState('invalid')
          return
        }
        if (data.valid === false && data.reason === 'already_unsubscribed') setState('already')
        else if (data.valid) setState('valid')
        else setState('invalid')
      })
      .catch(() => setState('invalid'))
  }, [token])

  const handleConfirm = async () => {
    if (!token) return
    setState('submitting')
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErrorMsg(data.error ?? 'Failed to unsubscribe')
        setState('error')
        return
      }
      if (data.success) setState('success')
      else if (data.reason === 'already_unsubscribed') setState('already')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Email Preferences</h1>
        <p className="text-sm text-muted-foreground mb-6">Trade Rise FX</p>

        {state === 'loading' && <p>Checking your link…</p>}
        {state === 'invalid' && (
          <p className="text-destructive">This unsubscribe link is invalid or has expired.</p>
        )}
        {state === 'already' && (
          <p>You have already been unsubscribed. No further action needed.</p>
        )}
        {state === 'valid' && (
          <>
            <p className="mb-4">Click below to unsubscribe from future emails.</p>
            <button
              onClick={handleConfirm}
              className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium hover:opacity-90"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}
        {state === 'submitting' && <p>Processing…</p>}
        {state === 'success' && (
          <p className="text-green-600">You have been unsubscribed successfully.</p>
        )}
        {state === 'error' && (
          <p className="text-destructive">{errorMsg || 'Something went wrong. Please try again.'}</p>
        )}
      </div>
    </div>
  )
}
