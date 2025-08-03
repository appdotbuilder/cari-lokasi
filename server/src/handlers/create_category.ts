
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    // Check if slug already exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, input.slug))
      .execute();

    if (existingCategory.length > 0) {
      throw new Error(`Category with slug '${input.slug}' already exists`);
    }

    // Insert category record
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name,
        slug: input.slug
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
