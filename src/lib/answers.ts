/** Answer checking and ordering helpers. Pure, so the study UI stays thin. */

/** Forgiving comparison for typed answers: case, accents, punctuation and spacing don't count. */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesAnswer(input: string, answer: string, accepted: string[] = []) {
  const given = normalize(input);
  if (!given) return false;
  return [answer, ...accepted].some((candidate) => normalize(candidate) === given);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
