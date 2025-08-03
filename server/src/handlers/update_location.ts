
import { db } from '../db';
import { locationsTable, categoriesTable } from '../db/schema';
import { type UpdateLocationInput, type LocationWithCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLocation = async (input: UpdateLocationInput): Promise<LocationWithCategory> => {
  try {
    // Check if location exists
    const existingLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    if (existingLocation.length === 0) {
      throw new Error(`Location with id ${input.id} not found`);
    }

    // If category_id is being updated, verify it exists
    if (input.category_id !== undefined) {
      const existingCategory = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (existingCategory.length === 0) {
        throw new Error(`Category with id ${input.category_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.latitude !== undefined) updateData.latitude = input.latitude.toString();
    if (input.longitude !== undefined) updateData.longitude = input.longitude.toString();
    if (input.category_id !== undefined) updateData.category_id = input.category_id;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.website !== undefined) updateData.website = input.website;
    if (input.rating !== undefined) updateData.rating = input.rating !== null ? input.rating.toString() : null;

    // Update the location
    await db.update(locationsTable)
      .set(updateData)
      .where(eq(locationsTable.id, input.id))
      .execute();

    // Fetch updated location with category
    const result = await db.select()
      .from(locationsTable)
      .innerJoin(categoriesTable, eq(locationsTable.category_id, categoriesTable.id))
      .where(eq(locationsTable.id, input.id))
      .execute();

    const locationData = result[0];

    return {
      id: locationData.locations.id,
      name: locationData.locations.name,
      description: locationData.locations.description,
      address: locationData.locations.address,
      latitude: parseFloat(locationData.locations.latitude),
      longitude: parseFloat(locationData.locations.longitude),
      category_id: locationData.locations.category_id,
      phone: locationData.locations.phone,
      website: locationData.locations.website,
      rating: locationData.locations.rating ? parseFloat(locationData.locations.rating) : null,
      created_at: locationData.locations.created_at,
      category: {
        id: locationData.categories.id,
        name: locationData.categories.name,
        slug: locationData.categories.slug,
        created_at: locationData.categories.created_at
      }
    };
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
};
