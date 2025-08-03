
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type DeleteLocationInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteLocation = async (input: DeleteLocationInput): Promise<{ success: boolean }> => {
  try {
    // Check if location exists before deletion
    const existingLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    if (existingLocation.length === 0) {
      throw new Error(`Location with id ${input.id} not found`);
    }

    // Delete the location
    const result = await db.delete(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Location deletion failed:', error);
    throw error;
  }
};
