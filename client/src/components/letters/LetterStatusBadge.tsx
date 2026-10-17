import { cn } from "@/lib/utils";

export type LetterStatus = "draft" | "published" | "viewed" | "signed" | "revoked" | "superseded";

const STATUS_META: Record<LetterStatus, { label: string; className: string }> = {
  draft: { label: "Bozza", className: "bg-slate-100 text-slate-600" },
  published: { label: "Da leggere", className: "bg-sky-100 text-sky-800" },
  viewed: { label: "Letta", className: "bg-indigo-100 text-indigo-800" },
  signed: { label: "Firmata", className: "bg-emerald-100 text-emerald-800" },
  revoked: { label: "Revocata", className: "bg-red-100 text-red-700" },
  superseded: { label: "Sostituita", className: "bg-slate-200 text-slate-600" },
};

export function LetterStatusBadge({ status, className }: { status: LetterStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span className={cn("text-[11px] font-medium rounded px-1.5 py-0.5 whitespace-nowrap", meta.className, className)}>
      {meta.label}
    </span>
  );
}
