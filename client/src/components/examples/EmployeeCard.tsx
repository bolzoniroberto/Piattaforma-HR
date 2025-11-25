import EmployeeCard from "../EmployeeCard";

export default function EmployeeCardExample() {
  const employee = {
    id: "1",
    name: "Mario Rossi",
    role: "Senior Developer",
    department: "IT Development",
    totalObjectives: 12,
    completedObjectives: 8,
    clusters: [
      { name: "Obiettivi Strategici", progress: 75 },
      { name: "Obiettivi Operativi", progress: 60 },
      { name: "Obiettivi di Sviluppo", progress: 85 },
    ],
  };

  return (
    <div className="w-full max-w-md">
      <EmployeeCard employee={employee} />
    </div>
  );
}
