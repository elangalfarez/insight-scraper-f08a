
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { getQueryDetails } from '../handlers/get_query_details';

describe('getQueryDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve query with all related data', async () => {
    // Create test query
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        status: 'completed',
        total_products_found: 2,
        total_reviews_scraped: 3,
        average_rating: '4.50',
        sentiment_positive: 2,
        sentiment_neutral: 1,
        sentiment_negative: 0,
        expires_at: new Date(Date.now() + 86400000) // 24 hours from now
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create test products
    const productResults = await db.insert(productsTable)
      .values([
        {
          query_id: queryId,
          name: 'Test Product 1',
          url: 'https://example.com/product1',
          platform: 'shopee',
          price: '29.99',
          average_rating: '4.5',
          total_reviews: 10
        },
        {
          query_id: queryId,
          name: 'Test Product 2',
          url: 'https://example.com/product2',
          platform: 'shopee',
          price: '39.99',
          average_rating: '4.0',
          total_reviews: 5
        }
      ])
      .returning()
      .execute();

    const productIds = productResults.map(p => p.id);

    // Create test reviews
    await db.insert(reviewsTable)
      .values([
        {
          product_id: productIds[0],
          review_text: 'Great product!',
          rating: 5,
          review_date: new Date(),
          sentiment: 'positive'
        },
        {
          product_id: productIds[0],
          review_text: 'Good quality',
          rating: 4,
          review_date: new Date(),
          sentiment: 'positive'
        },
        {
          product_id: productIds[1],
          review_text: 'Average product',
          rating: 3,
          review_date: new Date(),
          sentiment: 'neutral'
        }
      ])
      .execute();

    // Create test keywords
    await db.insert(keywordsTable)
      .values([
        {
          query_id: queryId,
          keyword: 'quality',
          frequency: 5,
          sentiment_context: 'positive'
        },
        {
          query_id: queryId,
          keyword: 'price',
          frequency: 3,
          sentiment_context: 'neutral'
        }
      ])
      .execute();

    // Create test recommendations
    await db.insert(recommendationsTable)
      .values([
        {
          query_id: queryId,
          title: 'Improve Product Quality',
          description: 'Focus on quality improvements based on reviews',
          priority: 'high',
          related_keywords: JSON.stringify(['quality', 'durability']),
          frequency_score: '8.5'
        }
      ])
      .execute();

    // Test the handler
    const result = await getQueryDetails({ id: queryId });

    // Verify query data
    expect(result.query.id).toBe(queryId);
    expect(result.query.input).toBe('test query');
    expect(result.query.query_type).toBe('keyword');
    expect(result.query.platform).toBe('shopee');
    expect(result.query.status).toBe('completed');
    expect(result.query.total_products_found).toBe(2);
    expect(result.query.total_reviews_scraped).toBe(3);
    expect(result.query.average_rating).toBe(4.5);
    expect(result.query.sentiment_summary).toEqual({
      positive: 2,
      neutral: 1,
      negative: 0
    });

    // Verify products
    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toBe('Test Product 1');
    expect(result.products[0].price).toBe(29.99);
    expect(result.products[0].average_rating).toBe(4.5);
    expect(result.products[1].name).toBe('Test Product 2');
    expect(result.products[1].price).toBe(39.99);
    expect(result.products[1].average_rating).toBe(4.0);

    // Verify reviews
    expect(result.reviews).toHaveLength(3);
    expect(result.reviews.some(r => r.review_text === 'Great product!')).toBe(true);
    expect(result.reviews.some(r => r.review_text === 'Good quality')).toBe(true);
    expect(result.reviews.some(r => r.review_text === 'Average product')).toBe(true);

    // Verify keywords
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords.some(k => k.keyword === 'quality' && k.frequency === 5)).toBe(true);
    expect(result.keywords.some(k => k.keyword === 'price' && k.frequency === 3)).toBe(true);

    // Verify recommendations
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].title).toBe('Improve Product Quality');
    expect(result.recommendations[0].priority).toBe('high');
    expect(result.recommendations[0].frequency_score).toBe(8.5);
    expect(result.recommendations[0].related_keywords).toEqual(['quality', 'durability']);
  });

  it('should handle query with no related data', async () => {
    // Create query with no products, reviews, keywords, or recommendations
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'empty query',
        query_type: 'url',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const result = await getQueryDetails({ id: queryResult[0].id });

    expect(result.query.input).toBe('empty query');
    expect(result.products).toHaveLength(0);
    expect(result.reviews).toHaveLength(0);
    expect(result.keywords).toHaveLength(0);
    expect(result.recommendations).toHaveLength(0);
  });

  it('should throw error for non-existent query', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    
    await expect(getQueryDetails({ id: nonExistentId }))
      .rejects.toThrow(/Query not found/i);
  });
});
