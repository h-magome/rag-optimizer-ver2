import { splitIntoChunks } from './splitIntoChunks'

export function prepareChunksFromParagraphs(
    paragraphs: string[],
    maxWords = 500
): { chunk: string; index: number }[] {
    const fullText = paragraphs.join('\n\n')
    // splitIntoChunks を呼び出してチャンク化
    return splitIntoChunks(fullText, maxWords)
}
