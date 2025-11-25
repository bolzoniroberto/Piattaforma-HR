// Script to seed the database with sample data
import { db } from "./db";
import { objectiveClusters, objectives, documents } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create objective clusters
    console.log("Creating objective clusters...");
    const [strategicCluster, operationalCluster, developmentCluster] = await db
      .insert(objectiveClusters)
      .values([
        {
          name: "Obiettivi Strategici",
          description: "Obiettivi a lungo termine allineati con la visione aziendale",
          weight: 40,
        },
        {
          name: "Obiettivi Operativi",
          description: "Obiettivi operativi per migliorare l'efficienza dei processi",
          weight: 40,
        },
        {
          name: "Obiettivi di Sviluppo",
          description: "Obiettivi di crescita personale e professionale",
          weight: 20,
        },
      ])
      .returning();

    console.log("✅ Created 3 objective clusters");

    // Create objectives
    console.log("Creating objectives...");
    await db.insert(objectives).values([
      // Strategic objectives
      {
        title: "Migliorare la customer satisfaction del 15%",
        description: "Implementare un nuovo sistema di feedback clienti e ridurre i tempi di risposta alle richieste di supporto.",
        clusterId: strategicCluster.id,
        deadline: new Date("2025-12-31"),
      },
      {
        title: "Aumentare il fatturato del 20%",
        description: "Espandere il portafoglio clienti e aumentare le vendite attraverso nuove strategie di marketing.",
        clusterId: strategicCluster.id,
        deadline: new Date("2025-12-31"),
      },
      {
        title: "Espandere la presenza sul mercato internazionale",
        description: "Aprire operazioni in almeno 2 nuovi paesi europei entro fine anno.",
        clusterId: strategicCluster.id,
        deadline: new Date("2025-11-30"),
      },
      // Operational objectives
      {
        title: "Ridurre i tempi di risposta del supporto del 30%",
        description: "Ottimizzare i processi interni e implementare automazioni per il supporto clienti.",
        clusterId: operationalCluster.id,
        deadline: new Date("2025-08-31"),
      },
      {
        title: "Ridurre bug in produzione del 40%",
        description: "Implementare test automatizzati e code review più rigorosi.",
        clusterId: operationalCluster.id,
        deadline: new Date("2025-09-30"),
      },
      {
        title: "Migliorare l'efficienza operativa del 25%",
        description: "Identificare e eliminare processi ridondanti, automatizzare task ripetitivi.",
        clusterId: operationalCluster.id,
        deadline: new Date("2025-10-31"),
      },
      // Development objectives
      {
        title: "Completare certificazione AWS Solutions Architect",
        description: "Ottenere la certificazione professionale per supportare la migrazione cloud dell'azienda.",
        clusterId: developmentCluster.id,
        deadline: new Date("2025-06-30"),
      },
      {
        title: "Partecipare a 2 conferenze di settore",
        description: "Aggiornarsi sulle ultime tendenze tecnologiche e fare networking professionale.",
        clusterId: developmentCluster.id,
        deadline: new Date("2025-10-31"),
      },
      {
        title: "Mentorare 2 junior developer",
        description: "Supportare la crescita professionale di colleghi junior attraverso sessioni di mentoring settimanali.",
        clusterId: developmentCluster.id,
        deadline: new Date("2025-12-31"),
      },
    ]);

    console.log("✅ Created 9 objectives");

    // Create documents
    console.log("Creating documents...");
    await db.insert(documents).values([
      {
        title: "Regolamento MBO 2025",
        description: "Linee guida e criteri di valutazione per il sistema MBO aziendale",
        type: "regulation",
        requiresAcceptance: true,
      },
      {
        title: "Codice di Condotta Aziendale",
        description: "Norme etiche e comportamentali per tutti i dipendenti",
        type: "policy",
        requiresAcceptance: true,
      },
      {
        title: "Accordo di Riservatezza",
        description: "Non disclosure agreement aziendale",
        type: "contract",
        requiresAcceptance: true,
      },
      {
        title: "Linee Guida Valutazione Performance",
        description: "Criteri e metodologie per la valutazione delle performance annuali",
        type: "policy",
        requiresAcceptance: false,
      },
    ]);

    console.log("✅ Created 4 documents");

    console.log("✨ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("🎉 Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });
