import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function Section({ title, children }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <h3 className="text-slate-200 font-semibold mb-3">{title}</h3>
      {children}
    </div>
  )
}

export default function ChatUI() {
  const [step, setStep] = useState('login')

  // Auth
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')

  // Contacts
  const [contactsRaw, setContactsRaw] = useState('')
  const [contacts, setContacts] = useState([])

  // Chat
  const [peer, setPeer] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  const wsRef = useRef(null)

  // Start verification
  const start = async () => {
    const res = await fetch(`${API_BASE}/auth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    const data = await res.json()
    alert(`Demo code: ${data.code}`)
    setStep('verify')
  }

  // Verify code
  const verify = async () => {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: otp, name })
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setUserId(data.user_id)
      setStep('contacts')
    } else {
      alert('Verification failed')
    }
  }

  // Sync contacts
  const syncContacts = async () => {
    const items = contactsRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [n, p] = line.split(',')
        return { name: (n || '').trim(), phone: (p || '').trim() }
      })

    const res = await fetch(`${API_BASE}/contacts/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })

    // Because backend expects token separately, we pass ?token=... via body wrapper
  }

  const doSync = async () => {
    const items = contactsRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [n, p] = line.split(',')
        return { name: (n || '').trim(), phone: (p || '').trim() }
      })

    const res = await fetch(`${API_BASE}/contacts/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, items }),
    })
    const data = await res.json()
    if (data.matched) {
      setContacts(data.matched)
      setStep('chat')
    } else if (Array.isArray(data)) {
      setContacts(data)
      setStep('chat')
    } else {
      alert('No matches')
    }
  }

  // Open websocket when token is ready
  useEffect(() => {
    if (!token) return
    const wsUrl = (API_BASE || window.location.origin.replace('http', 'ws')) + '/ws'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({ token }))
    }
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data)
        if (m.type === 'message') {
          setMessages((prev) => [...prev, m])
        }
        if (m.type === 'read') {
          setMessages((prev) => prev.map(x => x._id === m.message_id ? { ...x, status: 'read' } : x))
        }
      } catch {}
    }
    ws.onclose = () => {}
    return () => ws.close()
  }, [token])

  const loadHistory = async (peer_user_id) => {
    if (!peer_user_id) return
    const res = await fetch(`${API_BASE}/messages/history?token=${encodeURIComponent(token)}&peer_user_id=${encodeURIComponent(peer_user_id)}`)
    const data = await res.json()
    setMessages(data)
  }

  const sendText = async () => {
    if (!peer || !text) return
    const res = await fetch(`${API_BASE}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, recipient_id: peer, text })
    })
    const data = await res.json()
    setText('')
    // optimistic add
    setMessages((prev) => [...prev, { _id: data.message_id, sender_id: userId, recipient_id: peer, text, status: 'sent', sent_at: new Date().toISOString() }])
  }

  useEffect(() => {
    if (peer) loadHistory(peer)
  }, [peer])

  // UI steps
  if (step === 'login') {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Section title="Register by phone">
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone (E.164)" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200" />
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="mt-2 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200" />
          <button onClick={start} className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-2">Send code</button>
        </Section>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Section title="Enter the code you received">
          <input value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="6-digit code" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200" />
          <button onClick={verify} className="mt-3 w-full bg-green-600 hover:bg-green-500 text-white rounded px-3 py-2">Verify</button>
        </Section>
      </div>
    )
  }

  if (step === 'contacts') {
    return (
      <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-4">
        <Section title="Paste contacts (name,phone per line)">
          <textarea value={contactsRaw} onChange={(e)=>setContactsRaw(e.target.value)} rows={8} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200" placeholder={'Alice,+15551234567\nBob,+4912345678'} />
          <button onClick={doSync} className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-2">Find who uses the app</button>
        </Section>
        <Section title="Matched contacts">
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.user_id} className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded px-3 py-2">
                <div>
                  <div className="text-slate-200 font-medium">{c.name || c.phone}</div>
                  <div className="text-slate-500 text-sm">{c.phone}</div>
                </div>
                <button onClick={()=>{ setPeer(c.user_id); setStep('chat') }} className="text-blue-400 hover:underline">Chat</button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 space-y-3">
        <Section title="Contacts">
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {contacts.map(c => (
              <div key={c.user_id} onClick={()=>setPeer(c.user_id)} className={`cursor-pointer px-3 py-2 rounded border ${peer===c.user_id ? 'bg-slate-700 border-slate-600' : 'bg-slate-900 border-slate-700'} `}>
                <div className="text-slate-200">{c.name || c.phone}</div>
                <div className="text-slate-500 text-xs">{c.phone}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="md:col-span-2 space-y-3">
        <Section title={peer ? 'Chat' : 'Select a contact'}>
          {peer ? (
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-auto space-y-2">
                {messages.map(m => (
                  <div key={m._id} className={`max-w-[70%] px-3 py-2 rounded ${m.sender_id===userId ? 'self-end bg-blue-600 text-white' : 'self-start bg-slate-700 text-slate-100'}`}>
                    <div>{m.text}</div>
                    <div className="text-[10px] opacity-70 mt-1">
                      {m.status === 'read' ? '✓✓ read' : m.status === 'delivered' ? '✓✓ delivered' : '✓ sent'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200" placeholder="Type a message" />
                <button onClick={sendText} className="bg-green-600 hover:bg-green-500 text-white rounded px-4">Send</button>
              </div>
            </div>
          ) : (
            <div className="text-slate-500">Pick someone from the list to start chatting.</div>
          )}
        </Section>
      </div>
    </div>
  )
}
