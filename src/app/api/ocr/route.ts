export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer'

// 環境変数からエンドポイントとキーを取得
const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT!
const apiKey = process.env.FORM_RECOGNIZER_KEY!

// Document Intelligence クライアントの初期化
const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(apiKey)
)

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()
        if (!url) {
            return NextResponse.json({ error: 'URLが指定されていません' }, { status: 400 })
        }

        // prebuilt-layout モデルを使って PDF の構造化解析
        const poller = await client.beginAnalyzeDocumentFromUrl('prebuilt-layout', url)
        const result = await poller.pollUntilDone()
        if (!result) {
            return NextResponse.json({ error: '解析結果が取得できませんでした' }, { status: 500 })
        }

        // 段落（Paragraphs）を抽出
        const paragraphs = result.paragraphs?.map(p => p.content) ?? []

        // キー／バリュー ペアを抽出
        const keyValuePairs = result.keyValuePairs?.map(kv => ({
            key: kv.key.content,
            value: kv.value?.content ?? ''
        })) ?? []

        // テーブル情報を抽出（セル単位）
        const tables = result.tables?.map(table => ({
            rowCount: table.rowCount,
            columnCount: table.columnCount,
            cells: table.cells.map(cell => ({
                content: cell.content,
                rowIndex: cell.rowIndex,
                columnIndex: cell.columnIndex
            }))
        })) ?? []

        return NextResponse.json({ paragraphs, keyValuePairs, tables })
    } catch (err: unknown) {
        console.error('OCR error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}