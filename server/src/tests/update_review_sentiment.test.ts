
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable } from '../db/schema';
import { type UpdateReviewSentimentInput } from '../schema';
import { updateReviewSentiment } from '../handlers/update_review_sentiment';
import { eq } from 'drizzle-orm';

describe('updateReviewSentiment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update review sentiment', async () => {
    // Create prerequisite data
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 86400000) // 24 hours from now
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryResult[0].id,
        name: 'Test Product',
        url: 'https://example.com/product',
        platform: 'shopee'
      })
      .returning()
      .execute();

    const reviewResult = await db.insert(reviewsTable)
      .values({
        product_id: productResult[0].id,
        review_text: 'Great product!',
        rating: 5,
        review_date: new Date(),
        sentiment: null
      })
      .returning()
      .execute();

    const input: UpdateReviewSentimentInput = {
      id: reviewResult[0].id,
      sentiment: 'positive'
    };

    const result = await updateReviewSentiment(input);

    // Verify the updated review
    expect(result.id).toEqual(reviewResult[0].id);
    expect(result.sentiment).toEqual('positive');
    expect(result.review_text).toEqual('Great product!');
    expect(result.rating).toEqual(5);
    expect(result.product_id).toEqual(productResult[0].id);
  });

  it('should save updated sentiment to database', async () => {
    // Create prerequisite data
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryResult[0].id,
        name: 'Test Product',
        url: 'https://example.com/product',
        platform: 'shopee'
      })
      .returning()
      .execute();

    const reviewResult = await db.insert(reviewsTable)
      .values({
        product_id: productResult[0].id,
        review_text: 'Terrible product',
        rating: 1,
        review_date: new Date(),
        sentiment: null
      })
      .returning()
      .execute();

    const input: UpdateReviewSentimentInput = {
      id: reviewResult[0].id,
      sentiment: 'negative'
    };

    await updateReviewSentiment(input);

    // Query database to verify persistence
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, reviewResult[0].id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].sentiment).toEqual('negative');
    expect(reviews[0].review_text).toEqual('Terrible product');
    expect(reviews[0].rating).toEqual(1);
  });

  it('should throw error for non-existent review', async () => {
    const input: UpdateReviewSentimentInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent UUID
      sentiment: 'positive'
    };

    await expect(updateReviewSentiment(input)).rejects.toThrow(/Review not found/i);
  });

  it('should update from one sentiment to another', async () => {
    // Create prerequisite data
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryResult[0].id,
        name: 'Test Product',
        url: 'https://example.com/product',
        platform: 'shopee'
      })
      .returning()
      .execute();

    const reviewResult = await db.insert(reviewsTable)
      .values({
        product_id: productResult[0].id,
        review_text: 'Mixed feelings about this product',
        rating: 3,
        review_date: new Date(),
        sentiment: 'neutral'
      })
      .returning()
      .execute();

    const input: UpdateReviewSentimentInput = {
      id: reviewResult[0].id,
      sentiment: 'positive'
    };

    const result = await updateReviewSentiment(input);

    expect(result.sentiment).toEqual('positive');

    // Verify in database
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, reviewResult[0].id))
      .execute();

    expect(reviews[0].sentiment).toEqual('positive');
  });
});
