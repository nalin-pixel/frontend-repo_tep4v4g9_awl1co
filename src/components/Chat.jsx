import { useEffect, useRef, useState } from 'react'

function MessageBubble({ me, m }) {
  const mine = m.sender_id === me
  return (
    <div className={`flex ${mine? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`${mine? 'bg-blue-600 text-white' : 'bg-slate-700 text-blue-50'} rounded-2xl px-3 py-2 max-w-[70%]`}> 
        {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
        <div className="text-[10px] opacity-70 text-right mt-1">
          {m.status === 'read' ? '✓✓' : (m.status === 'delivered' ? '✓✓' : '✓')}
        </div>
      </div>
    </div>
  )
}

export default function Chat({ session, peer, api, socketUrl }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const wsRef = useRef(null)
  const listRef = useRef(null)

  const scrollBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }

  useEffect(() => {
    const load = async () => {
      const hist = await api('/messages/history', { query: { token: session.token, peer_user_id: peer.user_id } })
      setMessages(hist)
      setTimeout(scrollBottom, 50)
    }
    load()
  }, [peer.user_id])

  useEffect(() => {
    const ws = new WebSocket(socketUrl.replace('http', 'ws') + '/ws')
    wsRef.current = ws
    ws.onopen = () => ws.send(JSON.stringify({ token: session.token }))
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data)
      if (data.type === 'message' && data.sender_id === peer.user_id) {
        setMessages(m => [...m, { ...data, status: 'delivered' }])
        setTimeout(scrollBottom, 50)
      }
      if (data.type === 'read') {
        setMessages(m => m.map(mm => mm._id === data.message_id ? { ...mm, status: 'read' } : mm))
      }
    }
    ws.onclose = () => {}
    return () => ws.close()
  }, [session.token, peer.user_id])

  const send = async () => {
    if (!input.trim()) return
    const optimistic = {
      _id: 'tmp-' + Math.random(),
      sender_id: session.userId,
      recipient_id: peer.user_id,
      text: input,
      status: 'sent'
    }
    setMessages(m => [...m, optimistic])
    setInput('')
    setTimeout(scrollBottom, 30)
    try {
      const res = await api('/messages/send', { method: 'POST', body: { token: session.token, recipient_id: peer.user_id, text: optimistic.text } })
      setMessages(m => m.map(mm => mm._id === optimistic._id ? { ...mm, _id: res.message_id } : mm))
    } catch (e) {
      // revert on error
    }
  }

  useEffect(() => {
    // mark read when view opens
    const unread = messages.filter(m => m.sender_id === peer.user_id && m.status !== 'read')
    if (unread.length) {
      api('/messages/read', { method: 'POST', body: { token: session.token, message_ids: unread.map(u=>u._id) } })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-700 p-3 flex items-center gap-3">
        <img src={peer.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer.name||peer.phone)}`} alt="" className="w-8 h-8 rounded-full" />
        <div>
          <div className="text-white font-medium">{peer.name || peer.phone}</div>
          <div className="text-xs text-blue-200/70">Direct message</div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-900/30">
        {messages.map(m => (
          <MessageBubble key={m._id} me={session.userId} m={m} />
        ))}
      </div>

      <div className="p-3 border-t border-slate-700 flex items-center gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message" className="flex-1 bg-slate-800/60 border border-slate-700 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={send} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2">Send</button>
      </div>
    </div>
  )
}
