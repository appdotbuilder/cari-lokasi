
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        { name: 'Restaurants', slug: 'restaurants' },
        { name: 'Hotels', slug: 'hotels' },
        { name: 'Museums', slug: 'museums' }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBeDefined();
    expect(result[0].slug).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return categories ordered by name', async () => {
    // Insert categories in random order
    await db.insert(categoriesTable)
      .values([
        { name: 'Zoos', slug: 'zoos' },
        { name: 'Airports', slug: 'airports' },
        { name: 'Museums', slug: 'museums' },
        { name: 'Banks', slug: 'banks' }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(4);
    expect(result[0].name).toEqual('Airports');
    expect(result[1].name).toEqual('Banks');
    expect(result[2].name).toEqual('Museums');
    expect(result[3].name).toEqual('Zoos');
  });

  it('should handle categories with same name prefix correctly', async () => {
    await db.insert(categoriesTable)
      .values([
        { name: 'Restaurant Bar', slug: 'restaurant-bar' },
        { name: 'Restaurant', slug: 'restaurant' },
        { name: 'Restaurant Cafe', slug: 'restaurant-cafe' }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Restaurant');
    expect(result[1].name).toEqual('Restaurant Bar');
    expect(result[2].name).toEqual('Restaurant Cafe');
  });
});
