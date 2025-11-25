import DocumentList from "../DocumentList";

export default function DocumentListExample() {
  const documents = [
    {
      id: "1",
      title: "Regolamento MBO 2025",
      description: "Linee guida e criteri di valutazione per il sistema MBO",
      type: "regulation" as const,
      date: "01/01/2025",
      requiresAcceptance: true,
      accepted: false,
    },
    {
      id: "2",
      title: "Codice di Condotta Aziendale",
      description: "Norme etiche e comportamentali",
      type: "policy" as const,
      date: "15/01/2025",
      requiresAcceptance: true,
      accepted: true,
    },
    {
      id: "3",
      title: "Accordo Riservatezza",
      description: "Non disclosure agreement",
      type: "contract" as const,
      date: "10/01/2025",
      requiresAcceptance: true,
      accepted: false,
    },
  ];

  return (
    <div className="w-full max-w-2xl">
      <DocumentList
        documents={documents}
        onAccept={(id) => console.log("Accepted:", id)}
        onView={(id) => console.log("View:", id)}
        onDownload={(id) => console.log("Download:", id)}
      />
    </div>
  );
}
