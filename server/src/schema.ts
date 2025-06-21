
import { z } from 'zod';

// Enums
export const platformSchema = z.enum(['shopee', 'tiktok_shop', 'tokopedia']);
export const sentimentSchema = z.enum(['positive', 'neutral', 'negative']);
export const prioritySchema = z.enum(['high', 'medium', 'low']);

// Product schema
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  platform: platformSchema,
  image_url: z.string().url().nullable(),
  price: z.number().nullable(),
  average_rating: z.number().min(0).max(5).nullable(),
  total_reviews: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Review schema
export const reviewSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  review_text: z.string(),
  rating: z.number().min(1).max(5),
  review_date: z.coerce.date(),
  sentiment: sentimentSchema.nullable(),
  created_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

// Keyword schema
export const keywordSchema = z.object({
  id: z.string(),
  query_id: z.string(),
  keyword: z.string(),
  frequency: z.number().int().positive(),
  sentiment_context: sentimentSchema,
  created_at: z.coerce.date()
});

export type Keyword = z.infer<typeof keywordSchema>;

// Recommendation schema
export const recommendationSchema = z.object({
  id: z.string(),
  query_id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: prioritySchema,
  related_keywords: z.array(z.string()),
  frequency_score: z.number().nonnegative(),
  created_at: z.coerce.date()
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Query schema (for tracking scraping sessions)
export const querySchema = z.object({
  id: z.string(),
  input: z.string(), // keyword or URL
  query_type: z.enum(['keyword', 'url']),
  platform: platformSchema.nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  total_products_found: z.number().int().nonnegative(),
  total_reviews_scraped: z.number().int().nonnegative(),
  average_rating: z.number().min(0).max(5).nullable(),
  sentiment_summary: z.object({
    positive: z.number().int().nonnegative(),
    neutral: z.number().int().nonnegative(),
    negative: z.number().int().nonnegative()
  }).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  expires_at: z.coerce.date()
});

export type Query = z.infer<typeof querySchema>;

// Input schemas
export const createQueryInputSchema = z.object({
  input: z.string().min(1),
  platform: platformSchema.nullable()
});

export type CreateQueryInput = z.infer<typeof createQueryInputSchema>;

export const updateQueryStatusInputSchema = z.object({
  query_id: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  total_products_found: z.number().int().nonnegative().optional(),
  total_reviews_scraped: z.number().int().nonnegative().optional()
});

export type UpdateQueryStatusInput = z.infer<typeof updateQueryStatusInputSchema>;

export const createProductInputSchema = z.object({
  query_id: z.string(),
  name: z.string(),
  url: z.string().url(),
  platform: platformSchema,
  image_url: z.string().url().nullable(),
  price: z.number().nullable(),
  average_rating: z.number().min(0).max(5).nullable(),
  total_reviews: z.number().int().nonnegative()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createReviewInputSchema = z.object({
  product_id: z.string(),
  review_text: z.string(),
  rating: z.number().min(1).max(5),
  review_date: z.coerce.date()
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export const bulkCreateReviewsInputSchema = z.object({
  reviews: z.array(createReviewInputSchema)
});

export type BulkCreateReviewsInput = z.infer<typeof bulkCreateReviewsInputSchema>;

export const updateReviewSentimentInputSchema = z.object({
  review_id: z.string(),
  sentiment: sentimentSchema
});

export type UpdateReviewSentimentInput = z.infer<typeof updateReviewSentimentInputSchema>;

export const createKeywordInputSchema = z.object({
  query_id: z.string(),
  keyword: z.string(),
  frequency: z.number().int().positive(),
  sentiment_context: sentimentSchema
});

export type CreateKeywordInput = z.infer<typeof createKeywordInputSchema>;

export const bulkCreateKeywordsInputSchema = z.object({
  keywords: z.array(createKeywordInputSchema)
});

export type BulkCreateKeywordsInput = z.infer<typeof bulkCreateKeywordsInputSchema>;

export const createRecommendationInputSchema = z.object({
  query_id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: prioritySchema,
  related_keywords: z.array(z.string()),
  frequency_score: z.number().nonnegative()
});

export type CreateRecommendationInput = z.infer<typeof createRecommendationInputSchema>;

export const bulkCreateRecommendationsInputSchema = z.object({
  recommendations: z.array(createRecommendationInputSchema)
});

export type BulkCreateRecommendationsInput = z.infer<typeof bulkCreateRecommendationsInputSchema>;

// Query result schemas
export const queryResultSchema = z.object({
  query: querySchema,
  products: z.array(productSchema),
  reviews: z.array(reviewSchema),
  keywords: z.array(keywordSchema),
  recommendations: z.array(recommendationSchema)
});

export type QueryResult = z.infer<typeof queryResultSchema>;

export const queryHistoryItemSchema = z.object({
  id: z.string(),
  input: z.string(),
  query_type: z.enum(['keyword', 'url']),
  platform: platformSchema.nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  total_products_found: z.number().int().nonnegative(),
  total_reviews_scraped: z.number().int().nonnegative(),
  average_rating: z.number().min(0).max(5).nullable(),
  created_at: z.coerce.date()
});

export type QueryHistoryItem = z.infer<typeof queryHistoryItemSchema>;
