'use client'

import { useState } from 'react'
import { prepareChunksFromParagraphs } from '@/lib/prepareChunks'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [loadingUpload, setLoadingUpload] = useState(false)

  const [loadingOcr, setLoadingOcr] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])

  const [loadingChunk, setLoadingChunk] = useState(false)
  const [chunkError, setChunkError] = useState<string | null>(null)
  const [chunks, setChunks] = useState<{ chunk: string; index: number }[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
    setUploadUrl(null)
    setParagraphs([])
    setChunks([])
    setOcrError(null)
    setChunkError(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoadingUpload(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (res.ok && json.url) {
        setUploadUrl(json.url)
      } else {
        alert('アップロードエラー: ' + (json.error || JSON.stringify(json)))
      }
    } catch (err) {
      console.error(err)
      alert('アップロードに失敗しました')
    } finally {
      setLoadingUpload(false)
    }
  }

  const handleOcr = async () => {
    if (!uploadUrl) return
    setLoadingOcr(true)
    setOcrError(null)
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadUrl }),
      })
      const json = await res.json()
      if (!res.ok || !Array.isArray(json.paragraphs)) {
        throw new Error(json.error || `status ${res.status}`)
      }
      setParagraphs(json.paragraphs)
    } catch (err: any) {
      console.error(err)
      setOcrError(err.message)
    } finally {
      setLoadingOcr(false)
    }
  }

  const handleSemanticChunk = async () => {
    if (paragraphs.length === 0) return
    setLoadingChunk(true)
    setChunkError(null)
    try {
      const res = await fetch('/api/semantic-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphs }),
      })
      const json = await res.json()
      if (!res.ok || !Array.isArray(json.chunks)) {
        throw new Error(json.error || `status ${res.status}`)
      }
      setChunks(json.chunks.map((c: string, i: number) => ({ chunk: c, index: i })))
    } catch (err: any) {
      console.error(err)
      setChunkError(err.message)
    } finally {
      setLoadingChunk(false)
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold text-center">RAG optimizer ver2</h1>

      {/* 1. ファイルアップロード */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. ファイルアップロード</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 
                       file:mr-4 file:py-2 file:px-4 
                       file:rounded file:border-0 
                       file:text-sm file:font-semibold 
                       file:bg-blue-50 file:text-blue-700 
                       hover:file:bg-blue-100"
          />
          {file && (
            <div className="mt-2 text-green-600">
              選択済み: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || loadingUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded 
                     hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingUpload ? 'アップロード中…' : 'アップロード'}
        </button>
        {uploadUrl && (
          <p className="mt-2 text-sm break-all">
            アップロード先:{' '}
            <a href={uploadUrl} target="_blank" className="text-blue-600 underline">
              {uploadUrl}
            </a>
          </p>
        )}
      </section>

      {/* 2. OCR 実行 */}
      {uploadUrl && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. OCR 実行</h2>
          <button
            onClick={handleOcr}
            disabled={loadingOcr}
            className="px-4 py-2 bg-green-600 text-white rounded 
                       hover:bg-green-700 disabled:opacity-50"
          >
            {loadingOcr ? 'OCR中…' : 'OCR 実行'}
          </button>
          {ocrError && <p className="text-red-600">エラー: {ocrError}</p>}
        </section>
      )}

      {/* 3. OCR 段落プレビュー */}
      {paragraphs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. OCR 段落プレビュー ({paragraphs.length} 個)</h2>
          <div className="space-y-2">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 4. セマンティックチャンク化 */}
      {paragraphs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. セマンティックチャンク化</h2>
          <button
            onClick={handleSemanticChunk}
            disabled={loadingChunk}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loadingChunk ? 'チャンク化中…' : '意味単位でチャンク化'}
          </button>
          {chunkError && <p className="text-red-600">エラー: {chunkError}</p>}
        </section>
      )}

      {/* 5. チャンクプレビュー */}
      {chunks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. チャンクプレビュー ({chunks.length} 個)</h2>
          <div className="space-y-4">
            {chunks.map((c) => (
              <div
                key={c.index}
                className="p-4 bg-white rounded shadow-sm border"
              >
                <strong className="block mb-2">Chunk {c.index + 1}:</strong>
                <p className="whitespace-pre-wrap">{c.chunk}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
