
import { z } from 'zod';

// Enums matching Drizzle schema
export const queryTypeEnum = z.enum(['keyword', 'url']);
export const platformEnum = z.enum(['shopee', 'tiktok_shop', 'tokopedia']);
export const sentimentEnum = z.enum(['positive', 'neutral', 'negative']);
export const priorityEnum = z.enum(['high', 'medium', 'low']);

export type QueryType = z.infer<typeof queryTypeEnum>;
export type Platform = z.infer<typeof platformEnum>;
export type Sentiment = z.infer<typeof sentimentEnum>;
export type Priority = z.infer<typeof priorityEnum>;

// Product schema
export const productSchema = z.object({
  id: z.string().uuid(),
  query_id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  platform: platformEnum,
  image_url: z.string().nullable(),
  price: z.number().nullable(),
  average_rating: z.number().nullable(),
  total_reviews: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Review schema
export const reviewSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  review_text: z.string(),
  rating: z.number().int(),
  review_date: z.coerce.date(),
  sentiment: sentimentEnum.nullable(),
  created_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

// Keyword schema
export const keywordSchema = z.object({
  id: z.string().uuid(),
  query_id: z.string().uuid(),
  keyword: z.string(),
  frequency: z.number().int(),
  sentiment_context: sentimentEnum,
  created_at: z.coerce.date()
});

export type Keyword = z.infer<typeof keywordSchema>;

// Recommendation schema
export const recommendationSchema = z.object({
  id: z.string().uuid(),
  query_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  priority: priorityEnum,
  related_keywords: z.array(z.string()),
  frequency_score: z.number(),
  created_at: z.coerce.date()
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Query schema
export const querySchema = z.object({
  id: z.string().uuid(),
  input: z.string(),
  query_type: queryTypeEnum,
  platform: platformEnum.nullable(),
  status: z.string(),
  total_products_found: z.number().int(),
  total_reviews_scraped: z.number().int(),
  average_rating: z.number().nullable(),
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

// Query result schema
export const queryResultSchema = z.object({
  query: querySchema,
  products: z.array(productSchema),
  reviews: z.array(reviewSchema),
  keywords: z.array(keywordSchema),
  recommendations: z.array(recommendationSchema)
});

export type QueryResult = z.infer<typeof queryResultSchema>;

// Query history item schema
export const queryHistoryItemSchema = z.object({
  id: z.string().uuid(),
  input: z.string(),
  query_type: queryTypeEnum,
  platform: platformEnum.nullable(),
  status: z.string(),
  total_products_found: z.number().int(),
  total_reviews_scraped: z.number().int(),
  created_at: z.coerce.date()
});

export type QueryHistoryItem = z.infer<typeof queryHistoryItemSchema>;

// Input schemas
export const createQueryInputSchema = z.object({
  input: z.string(),
  query_type: queryTypeEnum,
  platform: platformEnum.optional(),
  expires_at: z.coerce.date()
});

export type CreateQueryInput = z.infer<typeof createQueryInputSchema>;

export const updateQueryStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  total_products_found: z.number().int().optional(),
  total_reviews_scraped: z.number().int().optional(),
  average_rating: z.number().optional(),
  sentiment_positive: z.number().int().optional(),
  sentiment_neutral: z.number().int().optional(),
  sentiment_negative: z.number().int().optional()
});

export type UpdateQueryStatusInput = z.infer<typeof updateQueryStatusInputSchema>;

export const createProductInputSchema = z.object({
  query_id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  platform: platformEnum,
  image_url: z.string().optional(),
  price: z.number().optional(),
  average_rating: z.number().optional(),
  total_reviews: z.number().int().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const bulkCreateReviewsInputSchema = z.object({
  reviews: z.array(z.object({
    product_id: z.string().uuid(),
    review_text: z.string(),
    rating: z.number().int(),
    review_date: z.coerce.date(),
    sentiment: sentimentEnum.optional()
  }))
});

export type BulkCreateReviewsInput = z.infer<typeof bulkCreateReviewsInputSchema>;

export const updateReviewSentimentInputSchema = z.object({
  id: z.string().uuid(),
  sentiment: sentimentEnum
});

export type UpdateReviewSentimentInput = z.infer<typeof updateReviewSentimentInputSchema>;

export const bulkCreateKeywordsInputSchema = z.object({
  keywords: z.array(z.object({
    query_id: z.string().uuid(),
    keyword: z.string(),
    frequency: z.number().int(),
    sentiment_context: sentimentEnum
  }))
});

export type BulkCreateKeywordsInput = z.infer<typeof bulkCreateKeywordsInputSchema>;

export const bulkCreateRecommendationsInputSchema = z.object({
  recommendations: z.array(z.object({
    query_id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    priority: priorityEnum,
    related_keywords: z.array(z.string()),
    frequency_score: z.number()
  }))
});

export type BulkCreateRecommendationsInput = z.infer<typeof bulkCreateRecommendationsInputSchema>;
