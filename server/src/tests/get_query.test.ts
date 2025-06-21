
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { getQuery } from '../handlers/get_query';

// Test data
const testQuery = {
  input: 'test product search',
  query_type: 'keyword' as const,
  platform: 'shopee' as const,
  status: 'completed',
  total_products_found: 2,
  total_reviews_scraped: 5,
  average_rating: '4.50',
  sentiment_positive: 3,
  sentiment_neutral: 1,
  sentiment_negative: 1,
  expires_at: new Date(Date.now() + 86400000) // 24 hours from now
};

const testProduct1 = {
  name: 'Test Product 1',
  url: 'https://shopee.com/product1',
  platform: 'shopee' as const,
  image_url: 'https://example.com/image1.jpg',
  price: '29.99',
  average_rating: '4.20',
  total_reviews: 3
};

const testProduct2 = {
  name: 'Test Product 2',
  url: 'https://shopee.com/product2',
  platform: 'shopee' as const,
  price: '39.99',
  average_rating: '4.80',
  total_reviews: 2
};

describe('getQuery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve complete query result with all related data', async () => {
    // Create query
    const [createdQuery] = await db.insert(queriesTable)
      .values(testQuery)
      .returning()
      .execute();

    // Create products
    const [product1] = await db.insert(productsTable)
      .values({ ...testProduct1, query_id: createdQuery.id })
      .returning()
      .execute();

    const [product2] = await db.insert(productsTable)
      .values({ ...testProduct2, query_id: createdQuery.id })
      .returning()
      .execute();

    // Create reviews
    await db.insert(reviewsTable)
      .values([
        {
          product_id: product1.id,
          review_text: 'Great product!',
          rating: 5,
          review_date: new Date('2024-01-01'),
          sentiment: 'positive'
        },
        {
          product_id: product1.id,
          review_text: 'Good quality',
          rating: 4,
          review_date: new Date('2024-01-02'),
          sentiment: 'positive'
        },
        {
          product_id: product2.id,
          review_text: 'Excellent value',
          rating: 5,
          review_date: new Date('2024-01-03'),
          sentiment: 'positive'
        }
      ])
      .execute();

    // Create keywords
    await db.insert(keywordsTable)
      .values([
        {
          query_id: createdQuery.id,
          keyword: 'quality',
          frequency: 10,
          sentiment_context: 'positive'
        },
        {
          query_id: createdQuery.id,
          keyword: 'price',
          frequency: 8,
          sentiment_context: 'neutral'
        }
      ])
      .execute();

    // Create recommendations
    await db.insert(recommendationsTable)
      .values([
        {
          query_id: createdQuery.id,
          title: 'Focus on Quality Features',
          description: 'Emphasize quality in product descriptions',
          priority: 'high',
          related_keywords: ['quality', 'durable'],
          frequency_score: '85.50'
        }
      ])
      .execute();

    // Test the handler
    const result = await getQuery(createdQuery.id);

    // Validate query data
    expect(result.query.id).toEqual(createdQuery.id);
    expect(result.query.input).toEqual('test product search');
    expect(result.query.query_type).toEqual('keyword');
    expect(result.query.platform).toEqual('shopee');
    expect(result.query.status).toEqual('completed');
    expect(result.query.total_products_found).toEqual(2);
    expect(result.query.total_reviews_scraped).toEqual(5);
    expect(result.query.average_rating).toEqual(4.50);
    expect(result.query.sentiment_summary).toEqual({
      positive: 3,
      neutral: 1,
      negative: 1
    });

    // Validate products
    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toEqual('Test Product 1');
    expect(result.products[0].price).toEqual(29.99);
    expect(result.products[0].average_rating).toEqual(4.20);
    expect(result.products[1].name).toEqual('Test Product 2');
    expect(result.products[1].price).toEqual(39.99);
    expect(result.products[1].average_rating).toEqual(4.80);

    // Validate reviews
    expect(result.reviews).toHaveLength(3);
    expect(result.reviews.some(r => r.review_text === 'Great product!')).toBe(true);
    expect(result.reviews.some(r => r.review_text === 'Good quality')).toBe(true);
    expect(result.reviews.some(r => r.review_text === 'Excellent value')).toBe(true);

    // Validate keywords
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords.some(k => k.keyword === 'quality' && k.frequency === 10)).toBe(true);
    expect(result.keywords.some(k => k.keyword === 'price' && k.frequency === 8)).toBe(true);

    // Validate recommendations
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].title).toEqual('Focus on Quality Features');
    expect(result.recommendations[0].frequency_score).toEqual(85.50);
    expect(result.recommendations[0].related_keywords).toEqual(['quality', 'durable']);
  });

  it('should handle query with no related data', async () => {
    // Create query only
    const [createdQuery] = await db.insert(queriesTable)
      .values({
        input: 'empty search',
        query_type: 'keyword',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const result = await getQuery(createdQuery.id);

    expect(result.query.id).toEqual(createdQuery.id);
    expect(result.query.input).toEqual('empty search');
    expect(result.products).toHaveLength(0);
    expect(result.reviews).toHaveLength(0);
    expect(result.keywords).toHaveLength(0);
    expect(result.recommendations).toHaveLength(0);
  });

  it('should throw error for non-existent query', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    
    expect(getQuery(nonExistentId)).rejects.toThrow(/Query with id .* not found/i);
  });

  it('should handle null sentiment summary correctly', async () => {
    // Create query with null sentiment values
    const [createdQuery] = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        status: 'pending',
        sentiment_positive: null,
        sentiment_neutral: null,
        sentiment_negative: null,
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const result = await getQuery(createdQuery.id);

    expect(result.query.sentiment_summary).toBeNull();
  });
});
