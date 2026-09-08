/**
 * Deterministic chunking. The outline pass labels chunks by index and cites those
 * indices per topic; card generation re-derives the exact same list to pull source
 * text back out. Both passes must therefore agree byte-for-byte -- never change
 * these constants without regenerating existing courses.
 */
export const CHUNK_CHARS = 4000;
export const CHUNK_OVERLAP = 400;

export type Chunk = {
  index: number;
  documentId: string;
  filename: string;
  text: string;
};

type ChunkableDoc = { id: string; filename: string; content: string };

/** Splits on paragraph boundaries where possible, hard-splitting anything oversized. */
export function chunkDocuments(docs: ChunkableDoc[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const doc of docs) {
    const text = doc.content.trim();
    if (!text) continue;

    let cursor = 0;
    while (cursor < text.length) {
      let end = Math.min(cursor + CHUNK_CHARS, text.length);

      if (end < text.length) {
        // Prefer a paragraph break, then a sentence break, in the last 30%.
        const window = text.slice(cursor + Math.floor(CHUNK_CHARS * 0.7), end);
        const para = window.lastIndexOf("\n\n");
        const sentence = window.lastIndexOf(". ");
        const offset = para >= 0 ? para + 2 : sentence >= 0 ? sentence + 2 : -1;
        if (offset >= 0) end = cursor + Math.floor(CHUNK_CHARS * 0.7) + offset;
      }

      chunks.push({
        index: chunks.length,
        documentId: doc.id,
        filename: doc.filename,
        text: text.slice(cursor, end).trim(),
      });

      if (end >= text.length) break;
      cursor = Math.max(end - CHUNK_OVERLAP, cursor + 1);
    }
  }

  return chunks;
}

/** Chunks rendered with `[C12]` markers so the model can cite them by index. */
export function renderChunks(chunks: Chunk[], perChunkLimit?: number): string {
  return chunks
    .map((c) => {
      const body = perChunkLimit ? c.text.slice(0, perChunkLimit) : c.text;
      return `[C${c.index}] (${c.filename})\n${body}`;
    })
    .join("\n\n");
}

/** Pulls the cited chunks plus one neighbour each side, deduped and in order. */
export function gatherSource(chunks: Chunk[], refs: number[], padding = 1): string {
  const wanted = new Set<number>();
  for (const ref of refs) {
    for (let i = ref - padding; i <= ref + padding; i++) {
      if (i >= 0 && i < chunks.length) wanted.add(i);
    }
  }
  return [...wanted]
    .sort((a, b) => a - b)
    .map((i) => chunks[i].text)
    .join("\n\n");
}
