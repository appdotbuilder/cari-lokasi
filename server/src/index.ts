
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createCategoryInputSchema,
  updateCategoryInputSchema,
  deleteCategoryInputSchema,
  createLocationInputSchema,
  updateLocationInputSchema,
  deleteLocationInputSchema,
  getNearbyLocationsInputSchema,
  getLocationsByCategoryInputSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createLocation } from './handlers/create_location';
import { getLocations } from './handlers/get_locations';
import { getLocationsByCategory } from './handlers/get_locations_by_category';
import { getNearbyLocations } from './handlers/get_nearby_locations';
import { updateLocation } from './handlers/update_location';
import { deleteLocation } from './handlers/delete_location';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),

  deleteCategory: publicProcedure
    .input(deleteCategoryInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  // Location management routes
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),

  getLocations: publicProcedure
    .query(() => getLocations()),

  getLocationsByCategory: publicProcedure
    .input(getLocationsByCategoryInputSchema)
    .query(({ input }) => getLocationsByCategory(input)),

  getNearbyLocations: publicProcedure
    .input(getNearbyLocationsInputSchema)
    .query(({ input }) => getNearbyLocations(input)),

  updateLocation: publicProcedure
    .input(updateLocationInputSchema)
    .mutation(({ input }) => updateLocation(input)),

  deleteLocation: publicProcedure
    .input(deleteLocationInputSchema)
    .mutation(({ input }) => deleteLocation(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
