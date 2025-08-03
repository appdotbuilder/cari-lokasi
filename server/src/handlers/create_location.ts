
import { db } from '../db';
import { locationsTable, categoriesTable } from '../db/schema';
import { type CreateLocationInput, type LocationWithCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const createLocation = async (input: CreateLocationInput): Promise<LocationWithCategory> => {
  try {
    // First, verify that the category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Insert location record
    const result = await db.insert(locationsTable)
      .values({
        name: input.name,
        description: input.description || null,
        address: input.address,
        latitude: input.latitude.toString(), // Convert number to string for numeric column
        longitude: input.longitude.toString(), // Convert number to string for numeric column
        category_id: input.category_id,
        phone: input.phone || null,
        website: input.website || null,
        rating: input.rating?.toString() || null // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const location = result[0];

    // Get the category information
    const category = categoryExists[0];

    // Convert numeric fields back to numbers and return with category
    return {
      ...location,
      latitude: parseFloat(location.latitude), // Convert string back to number
      longitude: parseFloat(location.longitude), // Convert string back to number
      rating: location.rating ? parseFloat(location.rating) : null, // Convert string back to number
      category: category
    };
  } catch (error) {
    console.error('Location creation failed:', error);
    throw error;
  }
};
