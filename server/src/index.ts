
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import {
  createQueryInputSchema,
  updateQueryStatusInputSchema,
  createProductInputSchema,
  bulkCreateReviewsInputSchema,
  updateReviewSentimentInputSchema,
  bulkCreateKeywordsInputSchema,
  bulkCreateRecommendationsInputSchema
} from './schema';

import { createQuery } from './handlers/create_query';
import { getQuery } from './handlers/get_query';
import { getQueryHistory } from './handlers/get_query_history';
import { updateQueryStatus } from './handlers/update_query_status';
import { createProduct } from './handlers/create_product';
import { bulkCreateReviews } from './handlers/bulk_create_reviews';
import { updateReviewSentiment } from './handlers/update_review_sentiment';
import { bulkCreateKeywords } from './handlers/bulk_create_keywords';
import { bulkCreateRecommendations } from './handlers/bulk_create_recommendations';
import { cleanupExpiredQueries } from './handlers/cleanup_expired_queries';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createQuery: publicProcedure
    .input(createQueryInputSchema)
    .mutation(({ input }) => createQuery(input)),
  getQuery: publicProcedure
    .input(z.string())
    .query(({ input }) => getQuery(input)),
  getQueryHistory: publicProcedure
    .query(() => getQueryHistory()),
  updateQueryStatus: publicProcedure
    .input(updateQueryStatusInputSchema)
    .mutation(({ input }) => updateQueryStatus(input)),
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  bulkCreateReviews: publicProcedure
    .input(bulkCreateReviewsInputSchema)
    .mutation(({ input }) => bulkCreateReviews(input)),
  updateReviewSentiment: publicProcedure
    .input(updateReviewSentimentInputSchema)
    .mutation(({ input }) => updateReviewSentiment(input)),
  bulkCreateKeywords: publicProcedure
    .input(bulkCreateKeywordsInputSchema)
    .mutation(({ input }) => bulkCreateKeywords(input)),
  bulkCreateRecommendations: publicProcedure
    .input(bulkCreateRecommendationsInputSchema)
    .mutation(({ input }) => bulkCreateRecommendations(input)),
  cleanupExpiredQueries: publicProcedure
    .mutation(() => cleanupExpiredQueries())
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
