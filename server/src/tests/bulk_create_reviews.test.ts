
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable } from '../db/schema';
import { type BulkCreateReviewsInput } from '../schema';
import { bulkCreateReviews } from '../handlers/bulk_create_reviews';
import { eq } from 'drizzle-orm';

describe('bulkCreateReviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create multiple reviews', async () => {
    // Create prerequisite query
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create prerequisite product
    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'Test Product',
        url: 'https://example.com',
        platform: 'shopee'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    const testInput: BulkCreateReviewsInput = {
      reviews: [
        {
          product_id: productId,
          review_text: 'Great product!',
          rating: 5,
          review_date: new Date('2024-01-01'),
          sentiment: 'positive'
        },
        {
          product_id: productId,
          review_text: 'Decent quality',
          rating: 3,
          review_date: new Date('2024-01-02'),
          sentiment: 'neutral'
        },
        {
          product_id: productId,
          review_text: 'Not satisfied',
          rating: 2,
          review_date: new Date('2024-01-03'),
          sentiment: 'negative'
        }
      ]
    };

    const result = await bulkCreateReviews(testInput);

    // Verify all reviews were created
    expect(result).toHaveLength(3);
    
    result.forEach((review, index) => {
      expect(review.id).toBeDefined();
      expect(review.product_id).toEqual(productId);
      expect(review.review_text).toEqual(testInput.reviews[index].review_text);
      expect(review.rating).toEqual(testInput.reviews[index].rating);
      expect(review.review_date).toBeInstanceOf(Date);
      expect(review.sentiment).toEqual(testInput.reviews[index].sentiment ?? null);
      expect(review.created_at).toBeInstanceOf(Date);
    });
  });

  it('should save all reviews to database', async () => {
    // Create prerequisite query
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create prerequisite product
    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'Test Product',
        url: 'https://example.com',
        platform: 'shopee'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    const testInput: BulkCreateReviewsInput = {
      reviews: [
        {
          product_id: productId,
          review_text: 'Excellent product',
          rating: 5,
          review_date: new Date('2024-01-01'),
          sentiment: 'positive'
        },
        {
          product_id: productId,
          review_text: 'Average quality',
          rating: 3,
          review_date: new Date('2024-01-02')
          // sentiment is optional
        }
      ]
    };

    const result = await bulkCreateReviews(testInput);

    // Query database to verify persistence
    const savedReviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.product_id, productId))
      .execute();

    expect(savedReviews).toHaveLength(2);
    
    // Verify first review
    const firstReview = savedReviews.find(r => r.review_text === 'Excellent product');
    expect(firstReview).toBeDefined();
    expect(firstReview!.rating).toEqual(5);
    expect(firstReview!.sentiment).toEqual('positive');
    expect(firstReview!.created_at).toBeInstanceOf(Date);

    // Verify second review (without sentiment)
    const secondReview = savedReviews.find(r => r.review_text === 'Average quality');
    expect(secondReview).toBeDefined();
    expect(secondReview!.rating).toEqual(3);
    expect(secondReview!.sentiment).toBeNull();
    expect(secondReview!.created_at).toBeInstanceOf(Date);
  });

  it('should handle empty reviews array', async () => {
    const testInput: BulkCreateReviewsInput = {
      reviews: []
    };

    const result = await bulkCreateReviews(testInput);

    expect(result).toHaveLength(0);
  });

  it('should throw error for invalid product_id', async () => {
    const testInput: BulkCreateReviewsInput = {
      reviews: [
        {
          product_id: '00000000-0000-0000-0000-000000000000', // Non-existent product ID
          review_text: 'Test review',
          rating: 4,
          review_date: new Date('2024-01-01'),
          sentiment: 'positive'
        }
      ]
    };

    await expect(bulkCreateReviews(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
