
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type DeleteLocationInput, type CreateLocationInput } from '../schema';
import { deleteLocation } from '../handlers/delete_location';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteLocationInput = {
  id: 1
};

describe('deleteLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing location', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location',
        address: '123 Test St',
        latitude: '40.7128'.toString(),
        longitude: '-74.0060'.toString(),
        category_id: categoryResult[0].id,
        phone: '555-0123',
        website: 'https://test.com',
        rating: '4.5'.toString()
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Delete the location
    const result = await deleteLocation({ id: locationId });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify location no longer exists in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(0);
  });

  it('should throw error when location does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteLocation({ id: nonExistentId }))
      .rejects.toThrow(/Location with id 999 not found/i);
  });

  it('should handle database constraint errors gracefully', async () => {
    // Test with invalid ID (negative number)
    await expect(deleteLocation({ id: -1 }))
      .rejects.toThrow(/Location with id -1 not found/i);
  });

  it('should verify location exists before attempting deletion', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location',
        address: '123 Test St',
        latitude: '40.7128'.toString(),
        longitude: '-74.0060'.toString(),
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Verify location exists before deletion
    const locationsBefore = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locationsBefore).toHaveLength(1);

    // Delete the location
    await deleteLocation({ id: locationId });

    // Verify location no longer exists after deletion
    const locationsAfter = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locationsAfter).toHaveLength(0);
  });
});
