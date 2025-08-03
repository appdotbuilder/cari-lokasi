
import { db } from '../db';
import { locationsTable, categoriesTable } from '../db/schema';
import { type LocationWithCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const getLocations = async (): Promise<LocationWithCategory[]> => {
  try {
    const results = await db.select()
      .from(locationsTable)
      .innerJoin(categoriesTable, eq(locationsTable.category_id, categoriesTable.id))
      .execute();

    return results.map(result => ({
      id: result.locations.id,
      name: result.locations.name,
      description: result.locations.description,
      address: result.locations.address,
      latitude: parseFloat(result.locations.latitude),
      longitude: parseFloat(result.locations.longitude),
      category_id: result.locations.category_id,
      phone: result.locations.phone,
      website: result.locations.website,
      rating: result.locations.rating ? parseFloat(result.locations.rating) : null,
      created_at: result.locations.created_at,
      category: {
        id: result.categories.id,
        name: result.categories.name,
        slug: result.categories.slug,
        created_at: result.categories.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get locations:', error);
    throw error;
  }
};
