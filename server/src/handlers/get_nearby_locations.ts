
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type GetNearbyLocationsInput, type LocationWithCategory } from '../schema';
import { eq, sql, and } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const getNearbyLocations = async (input: GetNearbyLocationsInput): Promise<LocationWithCategory[]> => {
  try {
    // Start with base query - need to build step by step to handle TypeScript issues
    const baseQuery = db.select({
      id: locationsTable.id,
      name: locationsTable.name,
      description: locationsTable.description,
      address: locationsTable.address,
      latitude: locationsTable.latitude,
      longitude: locationsTable.longitude,
      category_id: locationsTable.category_id,
      phone: locationsTable.phone,
      website: locationsTable.website,
      rating: locationsTable.rating,
      created_at: locationsTable.created_at,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        created_at: categoriesTable.created_at
      }
    })
    .from(locationsTable)
    .innerJoin(categoriesTable, eq(locationsTable.category_id, categoriesTable.id));

    // Create distance calculation SQL
    const distanceCalculation = sql<number>`
      6371 * acos(
        cos(radians(${input.latitude})) * 
        cos(radians(${locationsTable.latitude})) * 
        cos(radians(${locationsTable.longitude}) - radians(${input.longitude})) + 
        sin(radians(${input.latitude})) * 
        sin(radians(${locationsTable.latitude}))
      )
    `;

    // Build conditions
    const conditions: SQL<unknown>[] = [];
    
    if (input.category_slug) {
      conditions.push(eq(categoriesTable.slug, input.category_slug));
    }

    // Add distance filter
    conditions.push(sql`${distanceCalculation} <= ${input.radius}`);

    // Execute query with conditions and ordering in one go
    const finalQuery = conditions.length === 1 
      ? baseQuery.where(conditions[0]).orderBy(distanceCalculation)
      : baseQuery.where(and(...conditions)).orderBy(distanceCalculation);

    const results = await finalQuery.execute();

    // Convert numeric fields and format response
    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      address: result.address,
      latitude: parseFloat(result.latitude),
      longitude: parseFloat(result.longitude),
      category_id: result.category_id,
      phone: result.phone,
      website: result.website,
      rating: result.rating ? parseFloat(result.rating) : null,
      created_at: result.created_at,
      category: {
        id: result.category.id,
        name: result.category.name,
        slug: result.category.slug,
        created_at: result.category.created_at
      }
    }));
  } catch (error) {
    console.error('Get nearby locations failed:', error);
    throw error;
  }
};
