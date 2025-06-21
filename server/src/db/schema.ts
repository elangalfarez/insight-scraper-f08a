
import { uuid, text, pgTable, timestamp, numeric, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const queryTypeEnum = pgEnum('query_type', ['keyword', 'url']);
export const platformEnum = pgEnum('platform', ['shopee', 'tiktok_shop', 'tokopedia']);
export const sentimentEnum = pgEnum('sentiment', ['positive', 'neutral', 'negative']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);

// Queries table
export const queriesTable = pgTable('queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  input: text('input').notNull(),
  query_type: queryTypeEnum('query_type').notNull(),
  platform: platformEnum('platform'),
  status: text('status').notNull().default('pending'),
  total_products_found: integer('total_products_found').notNull().default(0),
  total_reviews_scraped: integer('total_reviews_scraped').notNull().default(0),
  average_rating: numeric('average_rating', { precision: 3, scale: 2 }),
  sentiment_positive: integer('sentiment_positive').default(0),
  sentiment_neutral: integer('sentiment_neutral').default(0),
  sentiment_negative: integer('sentiment_negative').default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at').notNull()
});

// Products table
export const productsTable = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  query_id: uuid('query_id').notNull().references(() => queriesTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  platform: platformEnum('platform').notNull(),
  image_url: text('image_url'),
  price: numeric('price', { precision: 12, scale: 2 }),
  average_rating: numeric('average_rating', { precision: 3, scale: 2 }),
  total_reviews: integer('total_reviews').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Reviews table
export const reviewsTable = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  review_text: text('review_text').notNull(),
  rating: integer('rating').notNull(),
  review_date: timestamp('review_date').notNull(),
  sentiment: sentimentEnum('sentiment'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Keywords table
export const keywordsTable = pgTable('keywords', {
  id: uuid('id').defaultRandom().primaryKey(),
  query_id: uuid('query_id').notNull().references(() => queriesTable.id, { onDelete: 'cascade' }),
  keyword: text('keyword').notNull(),
  frequency: integer('frequency').notNull(),
  sentiment_context: sentimentEnum('sentiment_context').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Recommendations table
export const recommendationsTable = pgTable('recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  query_id: uuid('query_id').notNull().references(() => queriesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: priorityEnum('priority').notNull(),
  related_keywords: jsonb('related_keywords').notNull(),
  frequency_score: numeric('frequency_score', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const queriesRelations = relations(queriesTable, ({ many }) => ({
  products: many(productsTable),
  keywords: many(keywordsTable),
  recommendations: many(recommendationsTable)
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  query: one(queriesTable, {
    fields: [productsTable.query_id],
    references: [queriesTable.id]
  }),
  reviews: many(reviewsTable)
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [reviewsTable.product_id],
    references: [productsTable.id]
  })
}));

export const keywordsRelations = relations(keywordsTable, ({ one }) => ({
  query: one(queriesTable, {
    fields: [keywordsTable.query_id],
    references: [queriesTable.id]
  })
}));

export const recommendationsRelations = relations(recommendationsTable, ({ one }) => ({
  query: one(queriesTable, {
    fields: [recommendationsTable.query_id],
    references: [queriesTable.id]
  })
}));

// Export all tables
export const tables = {
  queries: queriesTable,
  products: productsTable,
  reviews: reviewsTable,
  keywords: keywordsTable,
  recommendations: recommendationsTable
};
