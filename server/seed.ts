// Script to seed the database with sample data
import { db } from "./db";
import { indicatorClusters, calculationTypes, objectivesDictionary, objectiveClusters, objectives, documents, users } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create indicator clusters
    console.log("Creating indicator clusters...");
    const [groupCluster, individualCluster, esgCluster] = await db
      .insert(indicatorClusters)
      .values([
        {
          name: "Obiettivi di Gruppo",
          description: "Obiettivi a livello di team/dipartimento",
        },
        {
          name: "Obiettivi Individuali",
          description: "Obiettivi personali e di direzione",
        },
        {
          name: "Obiettivi ESG",
          description: "Obiettivi di sostenibilità e responsabilità sociale",
        },
      ])
      .returning();

    console.log("✅ Created 3 indicator clusters");

    // Create calculation types
    console.log("Creating calculation types...");
    const [linearCalc, targetCalc, inverseCalc] = await db
      .insert(calculationTypes)
      .values([
        {
          name: "Interpolazione Lineare",
          description: "Punteggio proporzionale al progresso",
          formula: "score = (actual / target) * 100",
        },
        {
          name: "100% al Target",
          description: "100% solo al raggiungimento del target",
          formula: "score = 100 if actual >= target else 0",
        },
        {
          name: "Interpolazione Lineare Inversa",
          description: "Punteggio inversamente proporzionale (per ridurre target)",
          formula: "score = 100 - ((actual / target) * 100)",
        },
      ])
      .returning();

    console.log("✅ Created 3 calculation types");

    // Create objectives dictionary
    console.log("Creating objectives dictionary...");
    const [obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8, obj9] = await db
      .insert(objectivesDictionary)
      .values([
        {
          title: "Migliorare la customer satisfaction del 15%",
          description: "Implementare un nuovo sistema di feedback clienti e ridurre i tempi di risposta.",
          indicatorClusterId: individualCluster.id,
          calculationTypeId: linearCalc.id,
        },
        {
          title: "Aumentare il fatturato del 20%",
          description: "Espandere il portafoglio clienti e aumentare le vendite attraverso nuove strategie di marketing.",
          indicatorClusterId: groupCluster.id,
          calculationTypeId: linearCalc.id,
        },
        {
          title: "Espandere la presenza sul mercato internazionale",
          description: "Aprire operazioni in almeno 2 nuovi paesi europei entro fine anno.",
          indicatorClusterId: groupCluster.id,
          calculationTypeId: targetCalc.id,
        },
        {
          title: "Ridurre i tempi di risposta del supporto del 30%",
          description: "Ottimizzare i processi interni e implementare automazioni per il supporto clienti.",
          indicatorClusterId: groupCluster.id,
          calculationTypeId: inverseCalc.id,
        },
        {
          title: "Ridurre bug in produzione del 40%",
          description: "Implementare test automatizzati e code review più rigorosi.",
          indicatorClusterId: individualCluster.id,
          calculationTypeId: inverseCalc.id,
        },
        {
          title: "Migliorare l'efficienza operativa del 25%",
          description: "Identificare e eliminare processi ridondanti, automatizzare task ripetitivi.",
          indicatorClusterId: groupCluster.id,
          calculationTypeId: linearCalc.id,
        },
        {
          title: "Completare certificazione AWS Solutions Architect",
          description: "Ottenere la certificazione professionale per supportare la migrazione cloud dell'azienda.",
          indicatorClusterId: individualCluster.id,
          calculationTypeId: targetCalc.id,
        },
        {
          title: "Ridurre emissioni di carbonio aziendale del 20%",
          description: "Implementare iniziative di sostenibilità nel nostro processo produttivo.",
          indicatorClusterId: esgCluster.id,
          calculationTypeId: linearCalc.id,
        },
        {
          title: "Incrementare la parità di genere del 15%",
          description: "Aumentare la percentuale di donne in posizioni di leadership.",
          indicatorClusterId: esgCluster.id,
          calculationTypeId: linearCalc.id,
        },
      ])
      .returning();

    console.log("✅ Created 9 objectives in dictionary");

    // Create objective clusters for scoring
    console.log("Creating objective clusters for scoring...");
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

    console.log("✅ Created 3 objective clusters for scoring");

    // Create objectives instances
    console.log("Creating objective instances...");
    await db.insert(objectives).values([
      {
        dictionaryId: obj1.id,
        clusterId: strategicCluster.id,
        deadline: new Date("2025-12-31"),
      },
      {
        dictionaryId: obj2.id,
        clusterId: strategicCluster.id,
        deadline: new Date("2025-12-31"),
      },
      {
        dictionaryId: obj3.id,
        clusterId: strategicCluster.id,
        deadline: new Date("2025-11-30"),
      },
      {
        dictionaryId: obj4.id,
        clusterId: operationalCluster.id,
        deadline: new Date("2025-08-31"),
      },
      {
        dictionaryId: obj5.id,
        clusterId: operationalCluster.id,
        deadline: new Date("2025-09-30"),
      },
      {
        dictionaryId: obj6.id,
        clusterId: operationalCluster.id,
        deadline: new Date("2025-10-31"),
      },
      {
        dictionaryId: obj7.id,
        clusterId: developmentCluster.id,
        deadline: new Date("2025-06-30"),
      },
      {
        dictionaryId: obj8.id,
        clusterId: strategicCluster.id,
        deadline: new Date("2025-12-31"),
      },
      {
        dictionaryId: obj9.id,
        clusterId: strategicCluster.id,
        deadline: new Date("2025-12-31"),
      },
    ]);

    console.log("✅ Created 9 objective instances");

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
        title: "FAQ",
        description: "Domande frequenti e risposte sul sistema MBO",
        type: "policy",
        requiresAcceptance: false,
      },
    ]);

    console.log("✅ Created 2 documents");

    // Create test users
    console.log("Creating test users...");
    await db.insert(users).values([
      {
        id: "test-user-giovanni",
        email: "giovanni@example.com",
        firstName: "Giovanni",
        lastName: "Utente",
        role: "employee",
        department: "IT Development",
        ral: "45000.00",
        mboPercentage: 20,
      },
      {
        id: "test-admin-franco",
        email: "franco@example.com",
        firstName: "Franco",
        lastName: "Amministratore",
        role: "admin",
        department: "Management",
        ral: "75000.00",
        mboPercentage: 30,
      },
    ]);

    console.log("✅ Created 2 test users (Giovanni - employee, Franco - admin)");

    console.log("✨ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Export for programmatic use
export { seed };

// Run the seed function only if executed directly as a script
// Add a check to prevent accidental execution in other contexts
if (typeof process !== "undefined" && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("🎉 Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seed failed:", error);
      process.exit(1);
    });
}
