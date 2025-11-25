// Script to seed the database with sample data
import { db } from "./db";

async function seed() {
  console.log("🌱 Seeding disabled - use direct SQL instead");
  return;
  /* Seeding is disabled - database is populated via direct SQL
     This prevents duplicate data from multiple seed execution attempts
   */
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
