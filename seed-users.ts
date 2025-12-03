import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";

async function seedUsers() {
  console.log("🌱 Seeding demo users...");

  try {
    await db.insert(users).values([
      {
        id: "admin-001",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
      },
      {
        id: "employee-001",
        email: "employee@example.com",
        firstName: "Mario",
        lastName: "Rossi",
        role: "employee",
        isActive: true,
      },
      {
        id: "employee-002",
        email: "employee2@example.com",
        firstName: "Luigi",
        lastName: "Verdi",
        role: "employee",
        isActive: true,
      },
    ]).onConflictDoNothing();

    console.log("✅ Demo users created successfully!");
    console.log("\nDemo users:");
    console.log("- admin@example.com (Admin)");
    console.log("- employee@example.com (Employee)");
    console.log("- employee2@example.com (Employee)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
