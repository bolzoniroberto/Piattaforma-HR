import ObjectiveClusterCard from "../ObjectiveClusterCard";

export default function ObjectiveClusterCardExample() {
  const cluster = {
    id: "1",
    name: "Obiettivi Strategici",
    description: "Obiettivi a lungo termine allineati con la visione aziendale",
    totalObjectives: 8,
    completedObjectives: 6,
  };

  return (
    <div className="w-full max-w-md">
      <ObjectiveClusterCard
        cluster={cluster}
        onClick={() => console.log("Cluster clicked")}
      />
    </div>
  );
}
