
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type GetLocationsByCategoryInput } from '../schema';
import { getLocationsByCategory } from '../handlers/get_locations_by_category';

const testCategoryInput = {
  name: 'Restaurants',
  slug: 'restaurants'
};

const testLocationInput = {
  name: 'Test Restaurant',
  description: 'A great place to eat',
  address: '123 Main St',
  latitude: 40.7128,
  longitude: -74.0060,
  phone: '555-0123',
  website: 'https://example.com',
  rating: 4.5
};

describe('getLocationsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return locations for a specific category', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategoryInput)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create location
    await db.insert(locationsTable)
      .values({
        ...testLocationInput,
        latitude: testLocationInput.latitude.toString(),
        longitude: testLocationInput.longitude.toString(),
        rating: testLocationInput.rating.toString(),
        category_id: category.id
      })
      .execute();

    const input: GetLocationsByCategoryInput = {
      category_slug: 'restaurants'
    };

    const result = await getLocationsByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Restaurant');
    expect(result[0].description).toEqual('A great place to eat');
    expect(result[0].address).toEqual('123 Main St');
    expect(result[0].latitude).toEqual(40.7128);
    expect(result[0].longitude).toEqual(-74.0060);
    expect(result[0].phone).toEqual('555-0123');
    expect(result[0].website).toEqual('https://example.com');
    expect(result[0].rating).toEqual(4.5);
    expect(result[0].category.name).toEqual('Restaurants');
    expect(result[0].category.slug).toEqual('restaurants');
    expect(result[0].category.id).toEqual(category.id);
  });

  it('should return empty array for non-existent category', async () => {
    const input: GetLocationsByCategoryInput = {
      category_slug: 'non-existent'
    };

    const result = await getLocationsByCategory(input);

    expect(result).toHaveLength(0);
  });

  it('should return multiple locations for the same category', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategoryInput)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create multiple locations
    await db.insert(locationsTable)
      .values([
        {
          name: 'Restaurant 1',
          description: 'First restaurant',
          address: '123 Main St',
          latitude: '40.7128',
          longitude: '-74.0060',
          category_id: category.id,
          phone: null,
          website: null,
          rating: null
        },
        {
          name: 'Restaurant 2',
          description: 'Second restaurant',
          address: '456 Oak Ave',
          latitude: '40.7589',
          longitude: '-73.9851',
          category_id: category.id,
          phone: '555-0456',
          website: 'https://restaurant2.com',
          rating: '3.5'
        }
      ])
      .execute();

    const input: GetLocationsByCategoryInput = {
      category_slug: 'restaurants'
    };

    const result = await getLocationsByCategory(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Restaurant 1');
    expect(result[0].phone).toBeNull();
    expect(result[0].website).toBeNull();
    expect(result[0].rating).toBeNull();
    expect(result[1].name).toEqual('Restaurant 2');
    expect(result[1].phone).toEqual('555-0456');
    expect(result[1].rating).toEqual(3.5);
    
    // Both should have the same category
    result.forEach(location => {
      expect(location.category.name).toEqual('Restaurants');
      expect(location.category.slug).toEqual('restaurants');
    });
  });

  it('should handle locations with null optional fields correctly', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategoryInput)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create location with null optional fields
    await db.insert(locationsTable)
      .values({
        name: 'Basic Restaurant',
        description: null,
        address: '789 Pine St',
        latitude: '40.7831',
        longitude: '-73.9712',
        category_id: category.id,
        phone: null,
        website: null,
        rating: null
      })
      .execute();

    const input: GetLocationsByCategoryInput = {
      category_slug: 'restaurants'
    };

    const result = await getLocationsByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Restaurant');
    expect(result[0].description).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].website).toBeNull();
    expect(result[0].rating).toBeNull();
    expect(typeof result[0].latitude).toEqual('number');
    expect(typeof result[0].longitude).toEqual('number');
  });
});
