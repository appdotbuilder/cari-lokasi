
import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Location schema
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  category_id: z.number(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  rating: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

// Location with category relation
export const locationWithCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  category_id: z.number(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  rating: z.number().nullable(),
  created_at: z.coerce.date(),
  category: categorySchema
});

export type LocationWithCategory = z.infer<typeof locationWithCategorySchema>;

// Input schemas
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1)
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const createLocationInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category_id: z.number().int().positive(),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional()
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

export const updateLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category_id: z.number().int().positive().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional()
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Query schemas
export const getNearbyLocationsInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive().default(10), // radius in kilometers
  category_slug: z.string().optional() // optional category filter
});

export type GetNearbyLocationsInput = z.infer<typeof getNearbyLocationsInputSchema>;

export const getLocationsByCategoryInputSchema = z.object({
  category_slug: z.string()
});

export type GetLocationsByCategoryInput = z.infer<typeof getLocationsByCategoryInputSchema>;

export const deleteLocationInputSchema = z.object({
  id: z.number()
});

export type DeleteLocationInput = z.infer<typeof deleteLocationInputSchema>;

export const deleteCategoryInputSchema = z.object({
  id: z.number()
});

export type DeleteCategoryInput = z.infer<typeof deleteCategoryInputSchema>;
