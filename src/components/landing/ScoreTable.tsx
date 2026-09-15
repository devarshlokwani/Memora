import { DrawnMark } from "@/components/ui/DrawnMark";

export type Result = "knew" | "missed" | null;

/**
 * A marked register rather than a running total: one column per question, one
 * row for each verdict, filled in as you go. It reads like a page of marking,
 * which is the point, and it stays in ink, so the only colour on the card is
 * the moment you are choosing.
 */
export function ScoreTable({ results }: { results: Result[] }) {
  const rows: { key: "knew" | "missed"; label: string }[] = [
    { key: "knew", label: "Knew it" },
    { key: "missed", label: "Missed it" },
  ];

  return (
    <table className="mx-auto border-collapse text-center">
      <caption className="sr-only">Your answers so far, by question</caption>
      <thead>
        <tr>
          <th scope="col" className="w-24 border-b border-rule pb-2 pr-3 text-right">
            <span className="sr-only">Verdict</span>
          </th>
          {results.map((_, i) => (
            <th
              key={i}
              scope="col"
              className="w-11 border-b border-rule pb-2 font-hand text-lg font-normal text-ink-faint"
            >
              {i + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, label }) => (
          <tr key={key} className="border-b border-rule last:border-b-0">
            <th scope="row" className="whitespace-nowrap py-1.5 pr-3 text-right align-middle">
              <span className="font-hand text-lg font-normal text-ink-faint">{label}</span>
            </th>
            {results.map((result, i) => (
              <td key={i} className="h-11 align-middle">
                {result === key && (
                  <DrawnMark
                    type={key}
                    colour="var(--color-ink)"
                    className="mx-auto h-5 w-5"
                  />
                )}
                <span className="sr-only">
                  {result === key
                    ? `Question ${i + 1}: ${label}`
                    : result
                      ? ""
                      : `Question ${i + 1}: not answered`}
                </span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
