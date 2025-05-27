'use client'

import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatPage() {
    const [question, setQuestion] = useState('')
    const [messages, setMessages] = useState<Msg[]>([])
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [question]);

    const handleAsk = async () => {
        const currentQuestion = question.trim();
        if (!currentQuestion) return

        setMessages((prev) => [...prev, { role: 'user', content: currentQuestion }])
        setQuestion('')
        setLoading(true)
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: currentQuestion })
            })
            const json = await res.json()
            if (res.ok) {
                setMessages((prev) => [...prev, { role: 'assistant', content: json.answer }])
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${json.error || '不明なエラー'}` }])
            }
        } catch (err) {
            console.error(err)
            setMessages((prev) => [...prev, { role: 'assistant', content: '通信エラーが発生しました' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex flex-col h-[calc(100vh-var(--header-height,80px))] max-w-3xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-center mb-6">社内ドキュメントチャット</h1>
            <div className="flex-grow border rounded-lg p-4 overflow-y-auto space-y-3 mb-4 bg-gray-50 shadow-inner">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={
                            `max-w-[80%] inline-block p-3 rounded-lg shadow ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                            }`
                        }>
                            {m.content.split('\n').map((line, idx) => <p key={idx} className="whitespace-pre-wrap">{line}</p>)}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] inline-block p-3 rounded-lg shadow bg-gray-200 text-gray-600 animate-pulse">
                            考え中…
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-end space-x-2 border-t pt-4">
                <textarea
                    ref={textareaRef}
                    className="flex-1 border rounded-lg p-3 resize-none overflow-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.shiftKey) {
                            return;
                        }
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing && !e.shiftKey) {
                            e.preventDefault();
                            handleAsk();
                        }
                    }}
                    placeholder="質問を入力 (Shift+Enterで改行)"
                    rows={1}
                    style={{ maxHeight: '150px' }}
                />
                <button
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors duration-200 shadow hover:shadow-md"
                >
                    {loading ? '送信中…' : '送信'}
                </button>
            </div>
        </main>
    )
}
