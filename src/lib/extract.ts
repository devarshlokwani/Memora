import "server-only";

export type Extraction = {
  text: string;
  pageCount: number | null;
};

export class UnsupportedFileError extends Error {}

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".csv", ".json", ".rtf"];

function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

/** Collapses the ragged whitespace PDF extraction leaves behind. */
function tidy(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractDocument(
  filename: string,
  mimeType: string,
  buffer: ArrayBuffer,
): Promise<Extraction> {
  const ext = extensionOf(filename);

  if (mimeType === "application/pdf" || ext === ".pdf") {
    const { extractText } = await import("unpdf");
    const { totalPages, text } = await extractText(new Uint8Array(buffer), {
      mergePages: false,
    });
    return { text: tidy(text.join("\n\n")), pageCount: totalPages };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return { text: tidy(value), pageCount: null };
  }

  if (mimeType.startsWith("text/") || TEXT_EXTENSIONS.includes(ext)) {
    return { text: tidy(new TextDecoder().decode(buffer)), pageCount: null };
  }

  throw new UnsupportedFileError(
    `${filename}: only PDF, DOCX, TXT and Markdown files can be read right now.`,
  );
}
