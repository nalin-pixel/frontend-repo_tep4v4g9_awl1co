import { useState } from 'react'

export default function Auth({ onAuthed, api }) {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [serverCode, setServerCode] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const start = async () => {
    setLoading(true); setError('')
    try {
      const res = await api('/auth/start', { method: 'POST', body: { phone } })
      setServerCode(res.code)
      setStep('verify')
    } catch (e) {
      setError(e.message || 'Failed to start verification')
    } finally { setLoading(false) }
  }

  const verify = async () => {
    setLoading(true); setError('')
    try {
      const res = await api('/auth/verify', { method: 'POST', body: { phone, code, name, photo_url: photoUrl } })
      onAuthed({ token: res.token, userId: res.user_id, phone, name, photoUrl })
    } catch (e) {
      setError(e.message || 'Failed to verify code')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-slate-800/60 border border-blue-500/20 rounded-2xl p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Sign in with your phone</h2>
      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-blue-200 mb-1">Phone number (E.164)</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. +15551234567" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button disabled={!phone || loading} onClick={start} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 transition">{loading? 'Sending...' : 'Send code'}</button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {serverCode && (
            <p className="text-xs text-blue-300/80">Dev hint: code is {serverCode}</p>
          )}
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-blue-200 mb-1">Code</label>
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="6-digit code" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1">Your name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1">Photo URL (optional)</label>
              <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button disabled={!code || loading} onClick={verify} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 transition">{loading? 'Verifying...' : 'Verify & Continue'}</button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={()=>setStep('phone')} className="text-blue-300 text-sm">Back</button>
        </div>
      )}
    </div>
  )
}
