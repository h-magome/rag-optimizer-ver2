export function splitIntoChunks(
    text: string,
    maxWords = 500
): { chunk: string; index: number }[] {
    // 改行で一旦分割し、空行は除外
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
    const chunks: { chunk: string; index: number }[] = []
    let buffer: string[] = []
    let count = 0

    for (const line of lines) {
        // 単語数をおおまかに計算
        const words = line.trim().split(/\s+/).length
        // 次のラインを入れると maxWords を超える場合はチャンクを確定
        if (count + words > maxWords && buffer.length > 0) {
            chunks.push({ chunk: buffer.join('\n'), index: chunks.length })
            buffer = []
            count = 0
        }
        buffer.push(line)
        count += words
    }

    // 残ったバッファを最後のチャンクに
    if (buffer.length > 0) {
        chunks.push({ chunk: buffer.join('\n'), index: chunks.length })
    }

    return chunks
}