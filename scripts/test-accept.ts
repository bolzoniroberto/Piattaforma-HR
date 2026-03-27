import "dotenv/config";
import { db } from "../server/db";
import { mboRegulationAcceptances, users } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { storage } from "../server/storage";

async function test() {
  const userId = "user-emp-t5-001"; // Torrisi - appena inserito

  try {
    const [acceptance] = await db
      .insert(mboRegulationAcceptances)
      .values({ userId })
      .onConflictDoUpdate({
        target: mboRegulationAcceptances.userId,
        set: { acceptedAt: sql`(unixepoch())` },
      })
      .returning();
    console.log("Acceptance:", acceptance);

    const updatedUser = await storage.updateUser(userId, {
      mboRegulationAcceptedAt: acceptance.acceptedAt,
    });
    console.log("User updated, mboRegulationAcceptedAt:", updatedUser.mboRegulationAcceptedAt);
  } catch(e: any) {
    console.error("ERRORE:", e.message);
    console.error("STACK:", e.stack?.split('\n').slice(0,5).join('\n'));
  }

  process.exit(0);
}
test();
