
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { eq, count } from 'drizzle-orm';

export const deleteCategory = async (input: DeleteCategoryInput): Promise<{ success: boolean }> => {
  try {
    // First check if category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    // Check if category has associated locations
    const locationCount = await db.select({ count: count() })
      .from(locationsTable)
      .where(eq(locationsTable.category_id, input.id))
      .execute();

    if (locationCount[0].count > 0) {
      throw new Error(`Cannot delete category with id ${input.id} because it has ${locationCount[0].count} associated locations`);
    }

    // Delete the category
    await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};
