import ProgressBar from "../ProgressBar";

export default function ProgressBarExample() {
  return (
    <div className="space-y-4 w-full max-w-md">
      <ProgressBar value={75} label="Obiettivi Strategici" />
      <ProgressBar value={40} label="Obiettivi Operativi" />
      <ProgressBar value={90} label="Obiettivi di Sviluppo" />
    </div>
  );
}
