export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { AzureOpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { SearchClient, AzureKeyCredential } from '@azure/search-documents'

const openai = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    apiKey: process.env.AZURE_OPENAI_KEY!,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
})
const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT!,
    process.env.AZURE_SEARCH_INDEX_NAME!,
    new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
)

export async function POST(req: NextRequest) {
    try {
        const { question } = await req.json()
        if (typeof question !== 'string' || !question.trim()) {
            return NextResponse.json({ error: 'question is required' }, { status: 400 })
        }

        // 1) 質問を埋め込みベクトルに変換
        const embedRes = await openai.embeddings.create({
            model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
            input: [question]
        })
        const qVec = embedRes.data[0].embedding

        // 2) ベクトル検索（k-NN）
        const searchResults = await searchClient.search('*_SEARCH_STRING_PLACEHOLDER_*', {
            vectorSearchOptions: {
                queries: [
                    {
                        kind: "vector",
                        vector: qVec,
                        kNearestNeighborsCount: 5,
                        fields: ['contentVector']
                    }
                ]
            },
            top: 5
        })

        // 3) 上位結果からテキストを抽出
        const contexts: string[] = []
        for await (const res of searchResults.results) {
            contexts.push((res.document as { content: string }).content)
        }
        const contextText = contexts.join('\n\n')

        // 4) Chat 用プロンプト組み立て
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: 'あなたは社内ドキュメントを元に回答するアシスタントです。' },
            { role: 'system', content: `以下の文書を参考にユーザーの質問に答えてください。\n\n${contextText}` },
            { role: 'user', content: question }
        ]

        // 5) Chat Completion 実行
        const chatRes = await openai.chat.completions.create({
            model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!,
            messages
        })

        const answer = chatRes.choices[0].message?.content ?? ''
        return NextResponse.json({ answer })

    } catch (err: unknown) {
        console.error('Chat API error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}