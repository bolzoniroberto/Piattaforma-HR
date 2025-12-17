// Script to fix organizational hierarchy
// Sets user-002 (Laura Bianchi) as CEO with no manager
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixHierarchy() {
  console.log("🔧 Fixing organizational hierarchy...");

  try {
    // Set user-002 as CEO (no manager)
    const result = await db
      .update(users)
      .set({ managerId: null })
      .where(eq(users.id, "user-002"));

    console.log("✅ Successfully set user-002 (Laura Bianchi) as CEO");
    console.log("📊 Updated records:", result);

    // Verify the change
    const ceo = await db.query.users.findFirst({
      where: eq(users.id, "user-002")
    });

    console.log("🎯 CEO details:", {
      id: ceo?.id,
      name: `${ceo?.firstName} ${ceo?.lastName}`,
      managerId: ceo?.managerId
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing hierarchy:", error);
    process.exit(1);
  }
}

fixHierarchy();
