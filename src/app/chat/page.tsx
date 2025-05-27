'use client'

import { useState } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatPage() {
    const [question, setQuestion] = useState('')
    const [messages, setMessages] = useState<Msg[]>([])
    const [loading, setLoading] = useState(false)

    const handleAsk = async () => {
        if (!question.trim()) return
        // ユーザーメッセージを追加
        setMessages((prev) => [...prev, { role: 'user', content: question }])
        setLoading(true)
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            })
            const json = await res.json()
            if (res.ok) {
                setMessages((prev) => [...prev, { role: 'assistant', content: json.answer }])
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${json.error}` }])
            }
            setQuestion('')
        } catch (err) {
            console.error(err)
            setMessages((prev) => [...prev, { role: 'assistant', content: '通信エラーが発生しました' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="p-8 max-w-2xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">社内ドキュメントチャット</h1>
            <div className="border rounded p-4 h-96 overflow-y-auto space-y-2">
                {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                        <span className={
                            `inline-block p-2 rounded ${m.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
                            }`
                        }>
                            {m.content}
                        </span>
                    </div>
                ))}
                {loading && <p className="text-center text-gray-500">考え中…</p>}
            </div>
            <div className="flex space-x-2">
                <input
                    className="flex-1 border rounded p-2"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="質問を入力…"
                />
                <button
                    onClick={handleAsk}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    送信
                </button>
            </div>
        </main>
    )
}
