
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, locationsTable } from '../db/schema';
import { type DeleteCategoryInput, type CreateCategoryInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // Create a test category
    const categoryData: CreateCategoryInput = {
      name: 'Test Category',
      slug: 'test-category'
    };

    const createdCategories = await db.insert(categoriesTable)
      .values(categoryData)
      .returning()
      .execute();

    const categoryId = createdCategories[0].id;

    // Delete the category
    const input: DeleteCategoryInput = { id: categoryId };
    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const input: DeleteCategoryInput = { id: 999 };

    expect(deleteCategory(input)).rejects.toThrow(/category with id 999 not found/i);
  });

  it('should throw error when category has associated locations', async () => {
    // Create a test category
    const categoryData: CreateCategoryInput = {
      name: 'Test Category',
      slug: 'test-category'
    };

    const createdCategories = await db.insert(categoriesTable)
      .values(categoryData)
      .returning()
      .execute();

    const categoryId = createdCategories[0].id;

    // Create a location associated with the category
    await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location',
        address: '123 Test Street',
        latitude: '40.71280000',
        longitude: '-74.00600000',
        category_id: categoryId,
        phone: '123-456-7890',
        website: 'https://test.com',
        rating: '4.5'
      })
      .execute();

    // Try to delete the category
    const input: DeleteCategoryInput = { id: categoryId };

    expect(deleteCategory(input)).rejects.toThrow(/cannot delete category.*associated locations/i);

    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should handle multiple associated locations error correctly', async () => {
    // Create a test category
    const categoryData: CreateCategoryInput = {
      name: 'Popular Category',
      slug: 'popular-category'
    };

    const createdCategories = await db.insert(categoriesTable)
      .values(categoryData)
      .returning()
      .execute();

    const categoryId = createdCategories[0].id;

    // Insert first location
    await db.insert(locationsTable)
      .values({
        name: 'Location 1',
        address: '123 First Street',
        latitude: '40.71280000',
        longitude: '-74.00600000',
        category_id: categoryId
      })
      .execute();

    // Insert second location
    await db.insert(locationsTable)
      .values({
        name: 'Location 2',
        address: '456 Second Street',
        latitude: '40.75890000',
        longitude: '-73.98510000',
        category_id: categoryId
      })
      .execute();

    // Try to delete the category
    const input: DeleteCategoryInput = { id: categoryId };

    expect(deleteCategory(input)).rejects.toThrow(/cannot delete category.*2 associated locations/i);
  });
});
