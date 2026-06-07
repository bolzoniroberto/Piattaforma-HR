import "dotenv/config";
import { db } from "../server/db";
import { objectiveAssignments, objectives, objectivesDictionary, indicatorClusters, calculationTypes, users } from "../shared/schema";
import { like, or } from "drizzle-orm";

async function main() {
  await db.delete(objectiveAssignments).where(like(objectiveAssignments.id, "asgn-%"));
  console.log("Assignments deleted");
  await db.delete(objectives).where(like(objectives.id, "obj-%"));
  console.log("Objectives deleted");
  await db.delete(objectivesDictionary).where(like(objectivesDictionary.id, "dict-%"));
  console.log("Dictionary deleted");
  await db.delete(indicatorClusters).where(or(
    like(indicatorClusters.id, "cluster-gruppo%"),
    like(indicatorClusters.id, "cluster-perf%"),
    like(indicatorClusters.id, "cluster-esg%"),
  ));
  console.log("Clusters deleted");
  await db.delete(users).where(like(users.id, "usr-%"));
  console.log("Users deleted");
}

main().catch(err => { console.error(err); process.exit(1); });
