import { useState } from 'react'

export default function Settings({ session, api, onSynced }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const sync = async () => {
    setLoading(true); setMsg('')
    try {
      const contacts = text.split(/\n+/).map(l => l.trim()).filter(Boolean).map(line => {
        const [name, phone] = line.split(',').map(s=>s.trim())
        return { name, phone }
      })
      const res = await api('/contacts/sync', { method: 'POST', body: contacts, query: { token: session.token } })
      setMsg(`Synced ${res.matched.length} contact(s) who use the app`)
      onSynced && onSynced()
    } catch (e) {
      setMsg('Failed to sync')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-white font-semibold">Settings</div>
      <div className="text-blue-200/80 text-sm">Paste some contacts as CSV: Name, +Phone</div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Jane,+15551230001\nJohn,+15551230002" className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button onClick={sync} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-4 py-2">{loading? 'Syncing...' : 'Sync contacts'}</button>
      {msg && <div className="text-blue-200/80 text-sm">{msg}</div>}
    </div>
  )
}
