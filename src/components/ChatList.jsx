import { useEffect, useState } from 'react'

export default function ChatList({ session, api, onOpen }) {
  const [contacts, setContacts] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const list = await api('/contacts', { query: { token: session.token } })
      setContacts(list)
    }
    load()
  }, [session.token])

  const filtered = contacts.filter(c => (c.name || c.phone || '').toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-700">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search or start new chat" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
        {filtered.map(c => (
          <button key={c.user_id} onClick={()=>onOpen(c)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-800/40">
            <img src={c.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name||c.phone)}`} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <div className="text-white font-medium">{c.name || c.phone}</div>
              <div className="text-xs text-blue-200/60">Tap to chat</div>
            </div>
          </button>
        ))}
        {!filtered.length && (
          <div className="p-6 text-center text-blue-200/70">No contacts matched. Use Settings to sync contacts.</div>
        )}
      </div>
    </div>
  )
}
