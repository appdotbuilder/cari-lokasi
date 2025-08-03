
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Helper function to create a test category
const createTestCategory = async (name: string, slug: string) => {
  const result = await db.insert(categoriesTable)
    .values({ name, slug })
    .returning()
    .execute();
  return result[0];
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name', async () => {
    // Create initial category
    const created = await createTestCategory('Original Category', 'original-category');

    // Update name
    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Updated Category'
    };
    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Category');
    expect(result.slug).toEqual('original-category'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update category slug', async () => {
    // Create initial category
    const created = await createTestCategory('Test Category', 'test-category');

    // Update slug
    const updateInput: UpdateCategoryInput = {
      id: created.id,
      slug: 'updated-slug'
    };
    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.slug).toEqual('updated-slug');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and slug', async () => {
    // Create initial category
    const created = await createTestCategory('Original Category', 'original-category');

    // Update both fields
    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Completely Updated Category',
      slug: 'completely-updated-category'
    };
    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Completely Updated Category');
    expect(result.slug).toEqual('completely-updated-category');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated category to database', async () => {
    // Create initial category
    const created = await createTestCategory('Test Category', 'test-category');

    // Update category
    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Updated Name',
      slug: 'updated-slug'
    };
    await updateCategory(updateInput);

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, created.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Name');
    expect(categories[0].slug).toEqual('updated-slug');
  });

  it('should throw error when category does not exist', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999,
      name: 'Non-existent Category'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when slug already exists', async () => {
    // Create first category
    await createTestCategory('First Category', 'first-category');

    // Create second category
    const secondCategory = await createTestCategory('Second Category', 'second-category');

    // Try to update second category with first category's slug
    const updateInput: UpdateCategoryInput = {
      id: secondCategory.id,
      slug: 'first-category'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow updating category with its own slug', async () => {
    // Create category
    const created = await createTestCategory('Test Category', 'test-category');

    // Update with same slug (should be allowed)
    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Updated Name',
      slug: 'test-category' // Same slug
    };
    const result = await updateCategory(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.slug).toEqual('test-category');
  });
});
