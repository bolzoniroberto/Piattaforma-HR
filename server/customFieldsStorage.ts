import {
  customFieldDefinitions,
  customFieldValues,
  type CustomFieldDefinition,
  type InsertCustomFieldDefinition,
  type CustomFieldValue,
  type InsertCustomFieldValue,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface ICustomFieldsStorage {
  // Custom Field Definitions
  getCustomFieldDefinitions(includeInactive?: boolean): Promise<CustomFieldDefinition[]>;
  getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition | undefined>;
  createCustomFieldDefinition(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition>;
  updateCustomFieldDefinition(id: string, field: Partial<InsertCustomFieldDefinition>): Promise<CustomFieldDefinition | undefined>;
  deleteCustomFieldDefinition(id: string): Promise<void>;

  // Custom Field Values
  getCustomFieldValues(userId: string): Promise<Array<CustomFieldValue & { field: CustomFieldDefinition }>>;
  getCustomFieldValue(fieldId: string, userId: string): Promise<CustomFieldValue | undefined>;
  setCustomFieldValue(data: InsertCustomFieldValue): Promise<CustomFieldValue>;
  deleteCustomFieldValue(fieldId: string, userId: string): Promise<void>;
}

export class CustomFieldsStorage implements ICustomFieldsStorage {
  // ===============================================
  // CUSTOM FIELD DEFINITIONS
  // ===============================================

  async getCustomFieldDefinitions(includeInactive = false): Promise<CustomFieldDefinition[]> {
    if (includeInactive) {
      return db.select().from(customFieldDefinitions).orderBy(customFieldDefinitions.displayOrder);
    }
    return db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.isActive, true))
      .orderBy(customFieldDefinitions.displayOrder);
  }

  async getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition | undefined> {
    const [field] = await db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.id, id))
      .limit(1);
    return field;
  }

  async createCustomFieldDefinition(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition> {
    const [created] = await db.insert(customFieldDefinitions).values(field).returning();
    return created;
  }

  async updateCustomFieldDefinition(
    id: string,
    field: Partial<InsertCustomFieldDefinition>
  ): Promise<CustomFieldDefinition | undefined> {
    const [updated] = await db
      .update(customFieldDefinitions)
      .set({ ...field, updatedAt: new Date() })
      .where(eq(customFieldDefinitions.id, id))
      .returning();
    return updated;
  }

  async deleteCustomFieldDefinition(id: string): Promise<void> {
    await db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, id));
  }

  // ===============================================
  // CUSTOM FIELD VALUES
  // ===============================================

  async getCustomFieldValues(userId: string): Promise<Array<CustomFieldValue & { field: CustomFieldDefinition }>> {
    const results = await db
      .select({
        id: customFieldValues.id,
        fieldId: customFieldValues.fieldId,
        userId: customFieldValues.userId,
        value: customFieldValues.value,
        createdAt: customFieldValues.createdAt,
        updatedAt: customFieldValues.updatedAt,
        field: customFieldDefinitions,
      })
      .from(customFieldValues)
      .innerJoin(customFieldDefinitions, eq(customFieldValues.fieldId, customFieldDefinitions.id))
      .where(
        and(
          eq(customFieldValues.userId, userId),
          eq(customFieldDefinitions.isActive, true)
        )
      )
      .orderBy(customFieldDefinitions.displayOrder);

    return results as Array<CustomFieldValue & { field: CustomFieldDefinition }>;
  }

  async getCustomFieldValue(fieldId: string, userId: string): Promise<CustomFieldValue | undefined> {
    const [value] = await db
      .select()
      .from(customFieldValues)
      .where(
        and(
          eq(customFieldValues.fieldId, fieldId),
          eq(customFieldValues.userId, userId)
        )
      )
      .limit(1);
    return value;
  }

  async setCustomFieldValue(data: InsertCustomFieldValue): Promise<CustomFieldValue> {
    // Check if value already exists
    const existing = await this.getCustomFieldValue(data.fieldId, data.userId);

    if (existing) {
      // Update existing value
      const [updated] = await db
        .update(customFieldValues)
        .set({ value: data.value, updatedAt: new Date() })
        .where(eq(customFieldValues.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new value
      const [created] = await db.insert(customFieldValues).values(data).returning();
      return created;
    }
  }

  async deleteCustomFieldValue(fieldId: string, userId: string): Promise<void> {
    await db
      .delete(customFieldValues)
      .where(
        and(
          eq(customFieldValues.fieldId, fieldId),
          eq(customFieldValues.userId, userId)
        )
      );
  }
}

// Export a singleton instance
export const customFieldsStorage = new CustomFieldsStorage();
