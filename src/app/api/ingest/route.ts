export const runtime = 'edge'  // or 'nodejs' でもOK

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AzureKeyCredential, SearchClient } from '@azure/search-documents'
import { splitIntoChunks } from '@/lib/splitIntoChunks'

// 環境変数
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT!,
    process.env.AZURE_SEARCH_INDEX_NAME!,
    new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
)

export async function POST(request: NextRequest) {
    const { text, sourceId } = await request.json()
    // 1. テキストをチャンクに分割
    const chunks = splitIntoChunks(text, 500)

    // 2. 埋め込み生成
    const inputs = chunks.map(c => c.chunk)
    const embedRes = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: inputs
    })

    // 3. ドキュメントの形で Azure Search にアップサート
    const docs = embedRes.data.map((d, i) => ({
        id: `${sourceId}-${i}`,
        content: chunks[i].chunk,
        contentVector: d.embedding,
        metadata_source: sourceId
    }))

    await searchClient.uploadDocuments(docs)

    return NextResponse.json({ ingested: docs.length })
}