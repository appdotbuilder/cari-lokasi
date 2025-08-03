
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type UpdateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let locationId: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Original Location',
        description: 'Original description',
        address: '123 Original St',
        latitude: '40.7589',
        longitude: '-73.9851',
        category_id: categoryId,
        phone: '555-0123',
        website: 'https://original.com',
        rating: '4.5'
      })
      .returning()
      .execute();
    locationId = locationResult[0].id;
  });

  it('should update location with all fields', async () => {
    const input: UpdateLocationInput = {
      id: locationId,
      name: 'Updated Location',
      description: 'Updated description',
      address: '456 Updated Ave',
      latitude: 41.8781,
      longitude: -87.6298,
      category_id: categoryId,
      phone: '555-9876',
      website: 'https://updated.com',
      rating: 3.8
    };

    const result = await updateLocation(input);

    expect(result.id).toEqual(locationId);
    expect(result.name).toEqual('Updated Location');
    expect(result.description).toEqual('Updated description');
    expect(result.address).toEqual('456 Updated Ave');
    expect(result.latitude).toEqual(41.8781);
    expect(result.longitude).toEqual(-87.6298);
    expect(result.category_id).toEqual(categoryId);
    expect(result.phone).toEqual('555-9876');
    expect(result.website).toEqual('https://updated.com');
    expect(result.rating).toEqual(3.8);
    expect(result.category).toBeDefined();
    expect(result.category.name).toEqual('Test Category');
  });

  it('should update location with partial fields', async () => {
    const input: UpdateLocationInput = {
      id: locationId,
      name: 'Partially Updated',
      latitude: 42.3601,
      longitude: -71.0589
    };

    const result = await updateLocation(input);

    expect(result.name).toEqual('Partially Updated');
    expect(result.latitude).toEqual(42.3601);
    expect(result.longitude).toEqual(-71.0589);
    // Other fields should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.address).toEqual('123 Original St');
    expect(result.phone).toEqual('555-0123');
    expect(result.website).toEqual('https://original.com');
    expect(result.rating).toEqual(4.5);
  });

  it('should update location with null values', async () => {
    const input: UpdateLocationInput = {
      id: locationId,
      description: null,
      phone: null,
      website: null,
      rating: null
    };

    const result = await updateLocation(input);

    expect(result.description).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.website).toBeNull();
    expect(result.rating).toBeNull();
    // Other fields should remain unchanged
    expect(result.name).toEqual('Original Location');
  });

  it('should save updated data to database', async () => {
    const input: UpdateLocationInput = {
      id: locationId,
      name: 'Database Test Location',
      rating: 2.5
    };

    await updateLocation(input);

    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Database Test Location');
    expect(parseFloat(locations[0].rating!)).toEqual(2.5);
  });

  it('should update category_id when provided', async () => {
    // Create second category
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        slug: 'new-category'
      })
      .returning()
      .execute();
    const newCategoryId = newCategoryResult[0].id;

    const input: UpdateLocationInput = {
      id: locationId,
      category_id: newCategoryId
    };

    const result = await updateLocation(input);

    expect(result.category_id).toEqual(newCategoryId);
    expect(result.category.name).toEqual('New Category');
    expect(result.category.slug).toEqual('new-category');
  });

  it('should throw error for non-existent location', async () => {
    const input: UpdateLocationInput = {
      id: 99999,
      name: 'Non-existent'
    };

    expect(updateLocation(input)).rejects.toThrow(/location with id 99999 not found/i);
  });

  it('should throw error for non-existent category', async () => {
    const input: UpdateLocationInput = {
      id: locationId,
      category_id: 99999
    };

    expect(updateLocation(input)).rejects.toThrow(/category with id 99999 not found/i);
  });

  it('should handle numeric type conversions correctly', async () => {
    const input: UpdateLocationInput = {
      id: locationId,
      latitude: 35.6762,
      longitude: 139.6503,
      rating: 4.2
    };

    const result = await updateLocation(input);

    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
    expect(typeof result.rating).toBe('number');
    expect(result.latitude).toEqual(35.6762);
    expect(result.longitude).toEqual(139.6503);
    expect(result.rating).toEqual(4.2);
  });
});
