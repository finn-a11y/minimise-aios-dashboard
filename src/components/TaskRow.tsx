import { formatHours } from "@/lib/format";

type TaskRowProps = {
  name: string;
  hoursPerWeek: number;
  automatedBy: string | null;
};

export function TaskRow({ name, hoursPerWeek, automatedBy }: TaskRowProps) {
  const ticked = automatedBy !== null;
  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="py-3 pr-4 text-lg w-8">{ticked ? "✅" : "☐"}</td>
      <td className={`py-3 pr-4 ${ticked ? "text-ink" : "text-ink-muted"}`}>
        {name}
      </td>
      <td className="py-3 pr-4 text-right text-ink-muted text-sm w-24">
        {formatHours(hoursPerWeek)}h
      </td>
      <td className="py-3 text-sm font-mono text-ink-muted">
        {automatedBy ?? "—"}
      </td>
    </tr>
  );
}
