
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type GetNearbyLocationsInput } from '../schema';
import { getNearbyLocations } from '../handlers/get_nearby_locations';

describe('getNearbyLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test input - coordinates for downtown area
  const testInput: GetNearbyLocationsInput = {
    latitude: 40.7831,
    longitude: -73.9712,
    radius: 10 // 10 km radius
  };

  it('should return nearby locations within radius', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Restaurants',
        slug: 'restaurants'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create location within radius (very close - same coordinates)
    await db.insert(locationsTable)
      .values({
        name: 'Close Restaurant',
        address: '123 Main St',
        latitude: '40.7831', // Same latitude
        longitude: '-73.9712', // Same longitude
        category_id: category.id
      })
      .execute();

    // Create location outside radius (about 20km away)
    await db.insert(locationsTable)
      .values({
        name: 'Far Restaurant',
        address: '456 Far St',
        latitude: '40.9000', // Different latitude - much farther
        longitude: '-73.8000', // Different longitude
        category_id: category.id
      })
      .execute();

    const result = await getNearbyLocations(testInput);

    // Should only return the close location
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Close Restaurant');
    expect(result[0].latitude).toEqual(40.7831);
    expect(result[0].longitude).toEqual(-73.9712);
    expect(result[0].category.name).toEqual('Restaurants');
    expect(result[0].category.slug).toEqual('restaurants');
  });

  it('should filter by category when category_slug provided', async () => {
    // Create two categories
    const restaurantCategory = await db.insert(categoriesTable)
      .values({
        name: 'Restaurants',
        slug: 'restaurants'
      })
      .returning()
      .execute();

    const hotelCategory = await db.insert(categoriesTable)
      .values({
        name: 'Hotels',
        slug: 'hotels'
      })
      .returning()
      .execute();

    // Create locations in both categories (both nearby)
    await db.insert(locationsTable)
      .values({
        name: 'Nearby Restaurant',
        address: '123 Main St',
        latitude: '40.7831',
        longitude: '-73.9712',
        category_id: restaurantCategory[0].id
      })
      .execute();

    await db.insert(locationsTable)
      .values({
        name: 'Nearby Hotel',
        address: '456 Hotel St',
        latitude: '40.7832', // Slightly different but still very close
        longitude: '-73.9713',
        category_id: hotelCategory[0].id
      })
      .execute();

    // Filter by restaurants only
    const inputWithCategory: GetNearbyLocationsInput = {
      ...testInput,
      category_slug: 'restaurants'
    };

    const result = await getNearbyLocations(inputWithCategory);

    // Should only return restaurant
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Nearby Restaurant');
    expect(result[0].category.slug).toEqual('restaurants');
  });

  it('should return locations ordered by distance', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Shops',
        slug: 'shops'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create locations at different distances
    await db.insert(locationsTable)
      .values({
        name: 'Closer Shop',
        address: '123 Close St',
        latitude: '40.7832', // Very close
        longitude: '-73.9713',
        category_id: category.id
      })
      .execute();

    await db.insert(locationsTable)
      .values({
        name: 'Farther Shop',
        address: '456 Far St',
        latitude: '40.7850', // A bit farther but still within radius
        longitude: '-73.9730',
        category_id: category.id
      })
      .execute();

    const result = await getNearbyLocations(testInput);

    // Should return both locations ordered by distance (closest first)
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Closer Shop');
    expect(result[1].name).toEqual('Farther Shop');
  });

  it('should return empty array when no locations within radius', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Restaurants',
        slug: 'restaurants'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create location very far away
    await db.insert(locationsTable)
      .values({
        name: 'Very Far Restaurant',
        address: '123 Far Far Away',
        latitude: '50.0000', // Very far latitude
        longitude: '-80.0000', // Very far longitude
        category_id: category.id
      })
      .execute();

    const result = await getNearbyLocations(testInput);

    expect(result).toHaveLength(0);
  });

  it('should handle numeric fields correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Restaurants',
        slug: 'restaurants'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create location with rating
    await db.insert(locationsTable)
      .values({
        name: 'Rated Restaurant',
        address: '123 Main St',
        latitude: '40.7831',
        longitude: '-73.9712',
        category_id: category.id,
        rating: '4.5'
      })
      .execute();

    const result = await getNearbyLocations(testInput);

    expect(result).toHaveLength(1);
    expect(typeof result[0].latitude).toBe('number');
    expect(typeof result[0].longitude).toBe('number');
    expect(typeof result[0].rating).toBe('number');
    expect(result[0].rating).toEqual(4.5);
  });
});
