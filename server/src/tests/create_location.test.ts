
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, categoriesTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq } from 'drizzle-orm';

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCategoryId: number;

  beforeEach(async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();
    
    testCategoryId = categoryResult[0].id;
  });

  const testInput: CreateLocationInput = {
    name: 'Test Location',
    description: 'A location for testing',
    address: '123 Test Street, Test City',
    latitude: 40.7128,
    longitude: -74.0060,
    category_id: 0, // Will be set in test
    phone: '+1-555-0123',
    website: 'https://test-location.com',
    rating: 4.5
  };

  it('should create a location with all fields', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createLocation(input);

    // Basic field validation
    expect(result.name).toEqual('Test Location');
    expect(result.description).toEqual('A location for testing');
    expect(result.address).toEqual('123 Test Street, Test City');
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.website).toEqual('https://test-location.com');
    expect(result.rating).toEqual(4.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Category relation validation
    expect(result.category).toBeDefined();
    expect(result.category.id).toEqual(testCategoryId);
    expect(result.category.name).toEqual('Test Category');
    expect(result.category.slug).toEqual('test-category');
  });

  it('should create a location with minimal required fields', async () => {
    const minimalInput: CreateLocationInput = {
      name: 'Minimal Location',
      address: '456 Minimal Street',
      latitude: 34.0522,
      longitude: -118.2437,
      category_id: testCategoryId
    };

    const result = await createLocation(minimalInput);

    expect(result.name).toEqual('Minimal Location');
    expect(result.address).toEqual('456 Minimal Street');
    expect(result.latitude).toEqual(34.0522);
    expect(result.longitude).toEqual(-118.2437);
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.description).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.website).toBeNull();
    expect(result.rating).toBeNull();
    expect(result.category).toBeDefined();
  });

  it('should save location to database', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createLocation(input);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    const savedLocation = locations[0];
    
    expect(savedLocation.name).toEqual('Test Location');
    expect(savedLocation.description).toEqual('A location for testing');
    expect(savedLocation.address).toEqual('123 Test Street, Test City');
    expect(parseFloat(savedLocation.latitude)).toEqual(40.7128);
    expect(parseFloat(savedLocation.longitude)).toEqual(-74.0060);
    expect(savedLocation.category_id).toEqual(testCategoryId);
    expect(savedLocation.phone).toEqual('+1-555-0123');
    expect(savedLocation.website).toEqual('https://test-location.com');
    expect(parseFloat(savedLocation.rating!)).toEqual(4.5);
    expect(savedLocation.created_at).toBeInstanceOf(Date);
  });

  it('should validate numeric field types in result', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createLocation(input);

    // Verify numeric types are properly converted
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
    expect(typeof result.rating).toBe('number');
    expect(typeof result.category_id).toBe('number');
    expect(typeof result.id).toBe('number');
  });

  it('should throw error when category does not exist', async () => {
    const input = { ...testInput, category_id: 99999 }; // Non-existent category
    
    await expect(createLocation(input)).rejects.toThrow(/category with id 99999 does not exist/i);
  });

  it('should handle null rating correctly', async () => {
    const input: CreateLocationInput = {
      ...testInput,
      category_id: testCategoryId,
      rating: null
    };

    const result = await createLocation(input);
    expect(result.rating).toBeNull();

    // Verify in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations[0].rating).toBeNull();
  });
});
