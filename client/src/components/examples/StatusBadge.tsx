import StatusBadge from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="assegnato" />
      <StatusBadge status="in_corso" />
      <StatusBadge status="completato" />
      <StatusBadge status="da_approvare" />
    </div>
  );
}
