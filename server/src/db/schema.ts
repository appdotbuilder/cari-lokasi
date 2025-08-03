
import { serial, text, pgTable, timestamp, numeric, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  address: text('address').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id),
  phone: varchar('phone', { length: 20 }),
  website: text('website'),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  locations: many(locationsTable),
}));

export const locationsRelations = relations(locationsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [locationsTable.category_id],
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  categories: categoriesTable, 
  locations: locationsTable 
};
