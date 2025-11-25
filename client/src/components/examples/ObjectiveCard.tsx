import ObjectiveCard from "../ObjectiveCard";

export default function ObjectiveCardExample() {
  const objective = {
    id: "1",
    title: "Migliorare la customer satisfaction del 15%",
    description: "Implementare un nuovo sistema di feedback clienti e ridurre i tempi di risposta alle richieste di supporto.",
    cluster: "Obiettivi Strategici",
    status: "in_corso" as const,
    deadline: "31/12/2025",
    progress: 65,
  };

  return (
    <div className="w-full max-w-md">
      <ObjectiveCard
        objective={objective}
        onStatusChange={(id, status) => console.log(`Objective ${id} changed to ${status}`)}
      />
    </div>
  );
}
