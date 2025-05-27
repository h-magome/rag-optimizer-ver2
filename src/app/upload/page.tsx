'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [chunks, setChunks] = useState<{ chunk: string; index: number }[]>([])

  const [processingStep, setProcessingStep] = useState<string | null>(null) // Overall progress
  const [globalError, setGlobalError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
    setUploadUrl(null)
    setParagraphs([])
    setChunks([])
    setProcessingStep(null)
    setGlobalError(null)
  }

  const handleProcessAll = async () => {
    if (!file) return

    setGlobalError(null)
    setUploadUrl(null) // Reset previous results if any
    setParagraphs([])
    setChunks([])

    // 1. Upload
    setProcessingStep('アップロード中…')
    let currentUploadUrl = null;
    try {
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || `アップロードエラー: ${uploadRes.statusText}`)
      }
      currentUploadUrl = uploadJson.url;
      setUploadUrl(currentUploadUrl)
    } catch (err: unknown) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setGlobalError(`アップロード失敗: ${errorMessage}`)
      setProcessingStep('エラー')
      return
    }

    // 2. OCR
    if (!currentUploadUrl) {
      setGlobalError('アップロードURLが取得できませんでした。')
      setProcessingStep('エラー')
      return
    }
    setProcessingStep('OCR処理中…')
    let currentParagraphs: string[] = [];
    try {
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUploadUrl }),
      })
      const ocrJson = await ocrRes.json()
      if (!ocrRes.ok || !Array.isArray(ocrJson.paragraphs)) {
        throw new Error(ocrJson.error || `OCRエラー: ${ocrRes.statusText}`)
      }
      currentParagraphs = ocrJson.paragraphs;
      setParagraphs(currentParagraphs)
    } catch (err: unknown) {
      console.error('OCR error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setGlobalError(`OCR処理失敗: ${errorMessage}`)
      setProcessingStep('エラー')
      return
    }

    // 3. Semantic Chunk
    if (currentParagraphs.length === 0) {
      setGlobalError('OCR結果が空です。')
      setProcessingStep('エラー')
      return
    }
    setProcessingStep('セマンティックチャンク化中…')
    let currentChunks: { chunk: string; index: number }[] = [];
    try {
      const chunkRes = await fetch('/api/semantic-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphs: currentParagraphs }),
      })
      const chunkJson = await chunkRes.json()
      if (!chunkRes.ok || !Array.isArray(chunkJson.chunks)) {
        throw new Error(chunkJson.error || `チャンク化エラー: ${chunkRes.statusText}`)
      }
      currentChunks = chunkJson.chunks.map((c: string, i: number) => ({ chunk: c, index: i }));
      setChunks(currentChunks)
    } catch (err: unknown) {
      console.error('Semantic chunk error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setGlobalError(`セマンティックチャンク化失敗: ${errorMessage}`)
      setProcessingStep('エラー')
      return
    }

    // 4. Ingest
    if (currentChunks.length === 0 || !file) {
      setGlobalError('チャンク結果が空か、ファイル情報がありません。')
      setProcessingStep('エラー')
      return
    }
    setProcessingStep('データベース登録中…')
    try {
      const ingestRes = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: file.name,
          chunks: currentChunks.map(c => ({ chunk: c.chunk, index: c.index })) // Ensure correct format for ingest
        }),
      })
      const ingestJson = await ingestRes.json()
      if (!ingestRes.ok || !ingestJson.ingested) {
        throw new Error(ingestJson.error || `DB登録エラー: ${ingestRes.statusText}`)
      }
      setProcessingStep(`処理完了: ${ingestJson.ingested} 件登録`)
    } catch (err: unknown) {
      console.error('Ingest error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setGlobalError(`DB登録失敗: ${errorMessage}`)
      setProcessingStep('エラー')
      return
    }
  }

  const isProcessing = !!(processingStep && processingStep !== 'エラー' && !processingStep?.startsWith('処理完了'));

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold text-center">RAG optimizer ver2</h1>

      {/* 1. ファイルアップロード & 処理開始 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ファイルを選択して処理を開始</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500 
                       file:mr-4 file:py-2 file:px-4 
                       file:rounded file:border-0 
                       file:text-sm file:font-semibold 
                       file:bg-blue-50 file:text-blue-700 
                       hover:file:bg-blue-100 disabled:opacity-50"
          />
          {file && !isProcessing && (
            <div className="mt-2 text-green-600">
              選択済み: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleProcessAll}
          disabled={!file || isProcessing}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded text-lg 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? processingStep : (processingStep?.startsWith('処理完了') ? '再度処理する' : 'アップロードして処理を開始')}
        </button>

        {/* 進捗・エラー表示 */}
        {processingStep && processingStep !== 'エラー' && !processingStep?.startsWith('処理完了') && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p>{processingStep}</p>
          </div>
        )}
        {globalError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>エラー: {globalError}</p>
          </div>
        )}
        {processingStep?.startsWith('処理完了') && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <p>{processingStep}</p>
          </div>
        )}

        {uploadUrl && (
          <p className="mt-2 text-sm break-all">
            アップロード先:{' '}
            <a href={uploadUrl} target="_blank" className="text-blue-600 underline">
              {uploadUrl}
            </a>
          </p>
        )}
      </section>

      {/* 2. OCR 段落プレビュー (処理が完了していれば表示) */}
      {paragraphs.length > 0 && (
        <section className="space-y-4 mt-8 pt-8 border-t">
          <h2 className="text-xl font-semibold">OCR 段落プレビュー ({paragraphs.length} 個)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-sm">
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 3. チャンクプレビュー (処理が完了していれば表示) */}
      {chunks.length > 0 && (
        <section className="space-y-4 mt-8 pt-8 border-t">
          <h2 className="text-xl font-semibold">チャンクプレビュー ({chunks.length} 個)</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded">
            {chunks.map((c) => (
              <div
                key={c.index}
                className="p-3 bg-white rounded shadow-sm border text-sm"
              >
                <strong className="block mb-1">Chunk {c.index + 1}:</strong>
                <p className="whitespace-pre-wrap">{c.chunk}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
