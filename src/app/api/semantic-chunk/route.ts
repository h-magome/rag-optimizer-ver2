export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { AzureOpenAI } from 'openai'

const openai = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    apiKey: process.env.AZURE_OPENAI_KEY!,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
})

export async function POST(req: NextRequest) {
    const { paragraphs } = await req.json()
    if (!Array.isArray(paragraphs)) {
        return NextResponse.json(
            { error: 'paragraphs must be an array of strings' },
            { status: 400 }
        )
    }

    // 意味単位で分割するプロンプト
    const prompt = `
以下の段落を「意味のまとまり」で分割し、JSON形式で返してください。
出力例のみを返してください：
{
  "chunks": ["chunk1のテキスト", "chunk2のテキスト", ...]
}

段落リスト:
${JSON.stringify(paragraphs, null, 2)}
`

    // Chat Completion を呼び出し
    const resp = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!, // 例: "gpt-4.1-mini"
        messages: [
            {
                role: 'system',
                content: 'あなたはテキストを意味単位で分割する AI です。'
            },
            {
                role: 'user',
                content: prompt
            }
        ]
    })

    const content = resp.choices[0]?.message?.content
    if (!content) {
        return NextResponse.json(
            { error: 'No content returned from OpenAI' },
            { status: 500 }
        )
    }

    try {
        const { chunks } = JSON.parse(content)
        if (!Array.isArray(chunks)) {
            throw new Error('parsed JSON.chunks is not an array')
        }
        // 文字列配列として返却
        return NextResponse.json({ chunks })
    } catch (e) {
        return NextResponse.json(
            { error: 'JSON parse error', raw: content },
            { status: 500 }
        )
    }
}
