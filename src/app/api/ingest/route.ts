// src/app/api/ingest/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { AzureOpenAI } from 'openai'
import { SearchClient, AzureKeyCredential } from '@azure/search-documents'
import { Buffer } from 'buffer'

// 環境変数読み込み
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
        const { chunks, sourceId } = await req.json()
        if (!Array.isArray(chunks) || typeof sourceId !== 'string') {
            return NextResponse.json(
                { error: 'chunks (array) and sourceId (string) are required' },
                { status: 400 }
            )
        }

        // 1) 埋め込み生成
        const texts = chunks.map((c: { chunk: string }) => c.chunk)
        const embedRes = await openai.embeddings.create({
            model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
            input: texts
        })

        console.log(`chunks count: ${chunks.length}`);
        console.log(`embeddings count: ${embedRes.data.length}`);

        // 2) ドキュメント配列作成
        const docs = embedRes.data.map((d, i) => {
            const safeSource = Buffer.from(sourceId)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '')

            return {
                id: `${safeSource}-${i}`,
                content: chunks[i].chunk,
                contentVector: d.embedding,
                metadata_source: safeSource,
            }
        })

        // 3) Azure Cognitive Search にアップサート
        const result = await searchClient.uploadDocuments(docs)

        // 成功件数を返す
        return NextResponse.json({ ingested: result.results.length })
    } catch (err: any) {
        console.error('Ingest error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
