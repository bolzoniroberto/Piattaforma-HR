import { competenciesStorage } from "../server/competenciesStorage";
import { storage } from "../server/storage";

async function main() {
  console.log("🌱 Seeding competency system data...\n");

  try {
    // 1. Create Competency Models for each persona
    console.log("📋 Creating competency models...");

    const executiveModel = await competenciesStorage.createCompetencyModel({
      name: "Executive Competencies",
      description: "Competenze per ruoli executive e dirigenziali",
      personaType: "executive",
      isActive: true,
      createdBy: "admin-001",
    });
    console.log(`  ✓ Created: ${executiveModel.name}`);

    const managerModel = await competenciesStorage.createCompetencyModel({
      name: "Manager Competencies",
      description: "Competenze per manager e team leader",
      personaType: "manager",
      isActive: true,
      createdBy: "admin-001",
    });
    console.log(`  ✓ Created: ${managerModel.name}`);

    const professionalModel = await competenciesStorage.createCompetencyModel({
      name: "Professional Competencies",
      description: "Competenze per professionisti specializzati",
      personaType: "professional",
      isActive: true,
      createdBy: "admin-001",
    });
    console.log(`  ✓ Created: ${professionalModel.name}`);

    const individualModel = await competenciesStorage.createCompetencyModel({
      name: "Expert Competencies",
      description: "Competenze per esperti e specialisti",
      personaType: "expert",
      isActive: true,
      createdBy: "admin-001",
    });
    console.log(`  ✓ Created: ${individualModel.name}\n`);

    // 2. Create Executive Competencies
    console.log("🎯 Creating competencies for each model...\n");
    console.log("Executive competencies:");

    const executiveCompetencies = [
      { name: "Strategic Vision", description: "Capacità di definire visione e strategia aziendale a lungo termine", category: "leadership" },
      { name: "Change Management", description: "Guidare l'organizzazione attraverso trasformazioni significative", category: "leadership" },
      { name: "Stakeholder Management", description: "Gestione efficace di stakeholder interni ed esterni", category: "behavioral" },
      { name: "Financial Acumen", description: "Comprensione profonda dei driver finanziari del business", category: "technical" },
      { name: "Innovation Leadership", description: "Promuovere cultura dell'innovazione e della sperimentazione", category: "leadership" },
    ];

    for (let i = 0; i < executiveCompetencies.length; i++) {
      const comp = executiveCompetencies[i];
      await competenciesStorage.createCompetency({
        modelId: executiveModel.id,
        name: comp.name,
        description: comp.description,
        category: comp.category,
        isTransversal: false,
        displayOrder: i,
      });
      console.log(`  ✓ ${comp.name}`);
    }

    // 3. Create Manager Competencies
    console.log("\nManager competencies:");

    const managerCompetencies = [
      { name: "Team Leadership", description: "Guidare e motivare il team verso obiettivi comuni", category: "leadership" },
      { name: "Performance Management", description: "Gestire e sviluppare le performance del team", category: "behavioral" },
      { name: "Delegation", description: "Delegare efficacemente compiti e responsabilità", category: "behavioral" },
      { name: "Conflict Resolution", description: "Risolvere conflitti e tensioni nel team", category: "behavioral" },
      { name: "Resource Planning", description: "Pianificare e allocare risorse in modo efficiente", category: "technical" },
    ];

    for (let i = 0; i < managerCompetencies.length; i++) {
      const comp = managerCompetencies[i];
      await competenciesStorage.createCompetency({
        modelId: managerModel.id,
        name: comp.name,
        description: comp.description,
        category: comp.category,
        isTransversal: false,
        displayOrder: i,
      });
      console.log(`  ✓ ${comp.name}`);
    }

    // 4. Create Professional Competencies
    console.log("\nProfessional competencies:");

    const professionalCompetencies = [
      { name: "Technical Expertise", description: "Padronanza approfondita del proprio ambito tecnico", category: "technical" },
      { name: "Problem Solving", description: "Analizzare e risolvere problemi complessi", category: "technical" },
      { name: "Project Management", description: "Gestire progetti in modo autonomo ed efficace", category: "technical" },
      { name: "Continuous Learning", description: "Aggiornamento continuo delle competenze professionali", category: "behavioral" },
      { name: "Quality Focus", description: "Attenzione alla qualità e ai dettagli del lavoro", category: "behavioral" },
    ];

    for (let i = 0; i < professionalCompetencies.length; i++) {
      const comp = professionalCompetencies[i];
      await competenciesStorage.createCompetency({
        modelId: professionalModel.id,
        name: comp.name,
        description: comp.description,
        category: comp.category,
        isTransversal: false,
        displayOrder: i,
      });
      console.log(`  ✓ ${comp.name}`);
    }

    // 5. Create Individual Contributor Competencies
    console.log("\nIndividual Contributor competencies:");

    const individualCompetencies = [
      { name: "Task Execution", description: "Esecuzione efficace e puntuale dei compiti assegnati", category: "technical" },
      { name: "Attention to Detail", description: "Precisione e cura nei dettagli del lavoro", category: "behavioral" },
      { name: "Time Management", description: "Gestione efficace del proprio tempo e priorità", category: "behavioral" },
      { name: "Initiative", description: "Proattività e capacità di agire autonomamente", category: "behavioral" },
      { name: "Adaptability", description: "Flessibilità e adattamento a nuove situazioni", category: "behavioral" },
    ];

    for (let i = 0; i < individualCompetencies.length; i++) {
      const comp = individualCompetencies[i];
      await competenciesStorage.createCompetency({
        modelId: individualModel.id,
        name: comp.name,
        description: comp.description,
        category: comp.category,
        isTransversal: false,
        displayOrder: i,
      });
      console.log(`  ✓ ${comp.name}`);
    }

    // 6. Create Transversal Competencies (shared across all personas)
    console.log("\nTransversal competencies (shared across all personas):");

    const transversalCompetencies = [
      { name: "Communication", description: "Comunicazione chiara ed efficace", category: "transversal" },
      { name: "Teamwork", description: "Collaborazione efficace con colleghi e team", category: "transversal" },
      { name: "Accountability", description: "Assunzione di responsabilità per i propri risultati", category: "transversal" },
    ];

    // Add transversal competencies to all models
    for (const comp of transversalCompetencies) {
      for (const model of [executiveModel, managerModel, professionalModel, individualModel]) {
        await competenciesStorage.createCompetency({
          modelId: model.id,
          name: comp.name,
          description: comp.description,
          category: comp.category,
          isTransversal: true,
          displayOrder: 100, // Put at end
        });
      }
      console.log(`  ✓ ${comp.name} (added to all personas)`);
    }

    // 7. Create an Evaluation Cycle
    console.log("\n📅 Creating evaluation cycle...");

    const now = new Date();
    const cycleYear = now.getFullYear();

    const ts = (y: number, m: number, d: number) => Math.floor(new Date(y, m, d).getTime() / 1000);

    const cycle = await competenciesStorage.createEvaluationCycle({
      name: `Performance Review ${cycleYear}`,
      year: cycleYear,
      status: "active",
      selfAssessmentStart: ts(cycleYear, now.getMonth(), 1),
      selfAssessmentEnd: ts(cycleYear, now.getMonth(), 15),
      peerFeedbackStart: ts(cycleYear, now.getMonth(), 16),
      peerFeedbackEnd: ts(cycleYear, now.getMonth() + 1, 0),
      managerEvaluationStart: ts(cycleYear, now.getMonth() + 1, 1),
      managerEvaluationEnd: ts(cycleYear, now.getMonth() + 1, 15),
      feedbackDeliveryStart: ts(cycleYear, now.getMonth() + 1, 16),
      feedbackDeliveryEnd: ts(cycleYear, now.getMonth() + 1, 30),
      enable360Feedback: true,
      createdBy: "admin-001",
    });

    console.log(`  ✓ Created cycle: ${cycle.name} (status: ${cycle.status})`);

    // 8. Update some users with persona types
    console.log("\n👥 Updating users with persona types...");

    const users = await storage.getAllUsers();

    // Set admin as executive
    const admin = users.find(u => u.id === "admin-001");
    if (admin) {
      await storage.updateUser("admin-001", { personaType: "executive" });
      console.log(`  ✓ ${admin.name}: executive`);
    }

    // Set some managers
    const managers = users.filter(u => u.role === "manager").slice(0, 3);
    for (const manager of managers) {
      await storage.updateUser(manager.id, { personaType: "manager" });
      console.log(`  ✓ ${manager.name}: manager`);
    }

    // Set remaining employees as professionals or individual contributors
    const employees = users.filter(u => u.role === "employee");
    for (let i = 0; i < employees.length; i++) {
      const personaType = i % 2 === 0 ? "professional" : "expert";
      await storage.updateUser(employees[i].id, { personaType });
      console.log(`  ✓ ${employees[i].name}: ${personaType}`);
    }

    console.log("\n✅ Competency system seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - 4 competency models created`);
    console.log(`  - ${executiveCompetencies.length + managerCompetencies.length + professionalCompetencies.length + individualCompetencies.length} persona-specific competencies created`);
    console.log(`  - ${transversalCompetencies.length} transversal competencies created (across 4 personas = ${transversalCompetencies.length * 4} total)`);
    console.log(`  - 1 active evaluation cycle created`);
    console.log(`  - ${users.length} users updated with persona types`);

  } catch (error) {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  }
}

main();
