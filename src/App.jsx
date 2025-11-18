import { useEffect, useMemo, useState } from 'react'
import Auth from './components/Auth'
import ChatList from './components/ChatList'
import Chat from './components/Chat'
import Settings from './components/Settings'

function useApi() {
  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  return async (path, { method = 'GET', body, query } = {}) => {
    const url = new URL(base + path)
    if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export default function App() {
  const api = useApi()
  const [session, setSession] = useState(null)
  const [active, setActive] = useState(null)
  const socketUrl = useMemo(() => (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'), [])

  useEffect(() => {
    const saved = localStorage.getItem('session')
    if (saved) setSession(JSON.parse(saved))
  }, [])

  const onAuthed = (sess) => {
    setSession(sess)
    localStorage.setItem('session', JSON.stringify(sess))
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Auth onAuthed={onAuthed} api={api} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-blue-50">
      <div className="grid grid-cols-1 md:grid-cols-3 h-screen">
        <div className="md:col-span-1 border-r border-slate-800 bg-slate-900/40">
          <div className="p-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img src={session.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.name||session.phone)}`} className="w-8 h-8 rounded-full" />
              <div>
                <div className="text-white font-medium">{session.name || session.phone}</div>
                <div className="text-xs text-blue-200/70">Online</div>
              </div>
            </div>
            <a href="#" onClick={() => { localStorage.removeItem('session'); location.reload() }} className="text-xs text-blue-300/70 hover:text-blue-200">Logout</a>
          </div>
          <ChatList session={session} api={api} onOpen={setActive} />
        </div>
        <div className="md:col-span-2 flex flex-col h-screen">
          {active ? (
            <Chat session={session} peer={active} api={api} socketUrl={socketUrl} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-blue-200/70">Select a chat to start messaging</div>
          )}
          <div className="border-t border-slate-800 bg-slate-900/40">
            <Settings session={session} api={api} onSynced={async()=>{ /* refresh contacts list by no-op changing state*/ }} />
          </div>
        </div>
      </div>
    </div>
  )
}
