import { describe, expect, it } from "vitest";

import { CHUNK_CHARS, chunkDocuments, gatherSource, renderChunks } from "./chunk";

const doc = (id: string, content: string, filename = `${id}.pdf`) => ({ id, filename, content });

describe("chunkDocuments", () => {
  it("numbers chunks continuously across documents", () => {
    const chunks = chunkDocuments([
      doc("a", "alpha ".repeat(2000)),
      doc("b", "beta ".repeat(2000)),
    ]);

    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
    expect(new Set(chunks.map((c) => c.documentId))).toEqual(new Set(["a", "b"]));
  });

  it("is deterministic, which is what lets pass 2 resolve pass 1's citations", () => {
    const docs = [doc("a", "gamma ".repeat(3000)), doc("b", "delta ".repeat(1500))];
    expect(chunkDocuments(docs)).toEqual(chunkDocuments(docs));
  });

  it("skips empty documents entirely", () => {
    expect(chunkDocuments([doc("a", "   \n\n  "), doc("b", "real text here")])).toHaveLength(1);
  });

  it("keeps a short document to a single chunk", () => {
    expect(chunkDocuments([doc("a", "one short paragraph")])).toHaveLength(1);
  });

  it("never emits a chunk longer than the chunk size", () => {
    const chunks = chunkDocuments([doc("a", "word ".repeat(20_000))]);
    for (const chunk of chunks) expect(chunk.text.length).toBeLessThanOrEqual(CHUNK_CHARS);
  });

  it("covers the whole document -- no text is silently dropped", () => {
    const body = Array.from({ length: 400 }, (_, i) => `Sentence number ${i}.`).join(" ");
    const chunks = chunkDocuments([doc("a", body)]);
    const joined = chunks.map((c) => c.text).join(" ");
    expect(joined).toContain("Sentence number 0.");
    expect(joined).toContain("Sentence number 399.");
  });

  it("terminates on text with no paragraph or sentence breaks", () => {
    const chunks = chunkDocuments([doc("a", "x".repeat(30_000))]);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThan(60);
  });
});

describe("renderChunks", () => {
  it("labels each chunk with the index the model is asked to cite", () => {
    const chunks = chunkDocuments([doc("a", "alpha text"), doc("b", "beta text")]);
    const rendered = renderChunks(chunks);
    expect(rendered).toContain("[C0] (a.pdf)");
    expect(rendered).toContain("[C1] (b.pdf)");
  });

  it("truncates to the excerpt limit but keeps every chunk listed", () => {
    const chunks = chunkDocuments([doc("a", "alphabet ".repeat(2000))]);
    const rendered = renderChunks(chunks, 50);
    for (const chunk of chunks) expect(rendered).toContain(`[C${chunk.index}]`);
    expect(rendered.length).toBeLessThan(chunks.length * 150);
  });
});

describe("gatherSource", () => {
  const chunks = chunkDocuments([
    doc("a", Array.from({ length: 600 }, (_, i) => `Line ${i} of the source.`).join("\n\n")),
  ]);

  it("pulls the cited chunk plus one neighbour either side", () => {
    const source = gatherSource(chunks, [2]);
    expect(source).toContain(chunks[1].text);
    expect(source).toContain(chunks[2].text);
    expect(source).toContain(chunks[3].text);
  });

  it("returns each chunk once and in reading order when citations overlap", () => {
    const source = gatherSource(chunks, [2, 3]);
    const firstAt = source.indexOf(chunks[1].text);
    const lastAt = source.indexOf(chunks[4].text);
    expect(firstAt).toBeGreaterThanOrEqual(0);
    expect(lastAt).toBeGreaterThan(firstAt);
    expect(source.split(chunks[2].text)).toHaveLength(2);
  });

  it("clamps at the ends of the document instead of running off them", () => {
    expect(() => gatherSource(chunks, [0])).not.toThrow();
    expect(() => gatherSource(chunks, [chunks.length - 1])).not.toThrow();
    expect(gatherSource(chunks, [])).toBe("");
  });
});
