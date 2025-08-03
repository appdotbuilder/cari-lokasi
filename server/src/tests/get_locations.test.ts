
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type CreateCategoryInput, type CreateLocationInput } from '../schema';
import { getLocations } from '../handlers/get_locations';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  slug: 'test-category'
};

const testLocation: CreateLocationInput = {
  name: 'Test Location',
  description: 'A test location',
  address: '123 Test Street',
  latitude: 40.7128,
  longitude: -74.0060,
  category_id: 1, // Will be set after creating category
  phone: '+1234567890',
  website: 'https://test.com',
  rating: 4.5
};

describe('getLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no locations exist', async () => {
    const result = await getLocations();
    expect(result).toEqual([]);
  });

  it('should return locations with category information', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        slug: testCategory.slug
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create location
    await db.insert(locationsTable)
      .values({
        name: testLocation.name,
        description: testLocation.description,
        address: testLocation.address,
        latitude: testLocation.latitude.toString(),
        longitude: testLocation.longitude.toString(),
        category_id: category.id,
        phone: testLocation.phone,
        website: testLocation.website,
        rating: testLocation.rating!.toString()
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    
    const location = result[0];
    expect(location.name).toEqual('Test Location');
    expect(location.description).toEqual('A test location');
    expect(location.address).toEqual('123 Test Street');
    expect(location.latitude).toEqual(40.7128);
    expect(location.longitude).toEqual(-74.0060);
    expect(location.phone).toEqual('+1234567890');
    expect(location.website).toEqual('https://test.com');
    expect(location.rating).toEqual(4.5);
    expect(location.id).toBeDefined();
    expect(location.created_at).toBeInstanceOf(Date);

    // Verify category relation
    expect(location.category).toBeDefined();
    expect(location.category.id).toEqual(category.id);
    expect(location.category.name).toEqual('Test Category');
    expect(location.category.slug).toEqual('test-category');
    expect(location.category.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple locations with their categories', async () => {
    // Create two categories
    const category1Result = await db.insert(categoriesTable)
      .values({
        name: 'Category 1',
        slug: 'category-1'
      })
      .returning()
      .execute();

    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Category 2',
        slug: 'category-2'
      })
      .returning()
      .execute();

    // Create locations for different categories
    await db.insert(locationsTable)
      .values([
        {
          name: 'Location 1',
          description: 'First location',
          address: '123 First Street',
          latitude: '40.7128',
          longitude: '-74.0060',
          category_id: category1Result[0].id,
          phone: null,
          website: null,
          rating: null
        },
        {
          name: 'Location 2',
          description: null,
          address: '456 Second Street',
          latitude: '41.8781',
          longitude: '-87.6298',
          category_id: category2Result[0].id,
          phone: '+9876543210',
          website: 'https://location2.com',
          rating: '3.5'
        }
      ])
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(2);

    // Check first location
    const location1 = result.find(loc => loc.name === 'Location 1');
    expect(location1).toBeDefined();
    expect(location1!.category.name).toEqual('Category 1');
    expect(location1!.phone).toBeNull();
    expect(location1!.website).toBeNull();
    expect(location1!.rating).toBeNull();

    // Check second location
    const location2 = result.find(loc => loc.name === 'Location 2');
    expect(location2).toBeDefined();
    expect(location2!.category.name).toEqual('Category 2');
    expect(location2!.description).toBeNull();
    expect(location2!.rating).toEqual(3.5);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    // Create location with specific numeric values
    await db.insert(locationsTable)
      .values({
        name: 'Numeric Test Location',
        description: 'Testing numeric conversions',
        address: '789 Numeric Street',
        latitude: '34.0522',
        longitude: '-118.2437',
        category_id: categoryResult[0].id,
        phone: null,
        website: null,
        rating: '2.8'
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    
    const location = result[0];
    expect(typeof location.latitude).toBe('number');
    expect(typeof location.longitude).toBe('number');
    expect(typeof location.rating).toBe('number');
    expect(location.latitude).toEqual(34.0522);
    expect(location.longitude).toEqual(-118.2437);
    expect(location.rating).toEqual(2.8);
  });
});
