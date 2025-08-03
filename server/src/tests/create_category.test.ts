
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  slug: 'test-category'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.slug).toEqual('test-category');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].slug).toEqual('test-category');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate slug', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create second category with same slug
    await expect(createCategory(testInput))
      .rejects.toThrow(/slug.*already exists/i);
  });

  it('should allow same name with different slug', async () => {
    // Create first category
    await createCategory(testInput);

    // Create second category with same name but different slug
    const secondInput: CreateCategoryInput = {
      name: 'Test Category',
      slug: 'test-category-2'
    };

    const result = await createCategory(secondInput);

    expect(result.name).toEqual('Test Category');
    expect(result.slug).toEqual('test-category-2');
    expect(result.id).toBeDefined();

    // Verify both categories exist in database
    const categories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(categories).toHaveLength(2);
  });
});
