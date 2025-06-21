
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { getQuery } from '../handlers/get_user_by_id';

// Test data
const testQuery = {
  input: 'smartphone reviews',
  query_type: 'keyword' as const,
  platform: 'shopee' as const,
  status: 'completed',
  total_products_found: 5,
  total_reviews_scraped: 100,
  average_rating: '4.25',
  sentiment_positive: 60,
  sentiment_neutral: 25,
  sentiment_negative: 15,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
};

const testProduct = {
  name: 'Test Smartphone',
  url: 'https://example.com/phone',
  platform: 'shopee' as const,
  image_url: 'https://example.com/image.jpg',
  price: '299.99',
  average_rating: '4.5',
  total_reviews: 50
};

const testReview = {
  review_text: 'Great phone, excellent value',
  rating: 5,
  review_date: new Date('2024-01-15'),
  sentiment: 'positive' as const
};

const testKeyword = {
  keyword: 'excellent',
  frequency: 25,
  sentiment_context: 'positive' as const
};

const testRecommendation = {
  title: 'Focus on Value Proposition',
  description: 'Customers appreciate the value for money',
  priority: 'high' as const,
  related_keywords: ['value', 'price', 'affordable'],
  frequency_score: '85.5'
};

describe('getQuery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent query', async () => {
    const result = await getQuery('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('should return query with all related data', async () => {
    // Create query
    const queryResult = await db.insert(queriesTable)
      .values(testQuery)
      .returning()
      .execute();
    
    const queryId = queryResult[0].id;

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        ...testProduct,
        query_id: queryId
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;

    // Create review
    await db.insert(reviewsTable)
      .values({
        ...testReview,
        product_id: productId
      })
      .execute();

    // Create keyword
    await db.insert(keywordsTable)
      .values({
        ...testKeyword,
        query_id: queryId
      })
      .execute();

    // Create recommendation
    await db.insert(recommendationsTable)
      .values({
        ...testRecommendation,
        query_id: queryId
      })
      .execute();

    // Test the handler
    const result = await getQuery(queryId);

    expect(result).not.toBeNull();
    expect(result!.query.id).toEqual(queryId);
    expect(result!.query.input).toEqual('smartphone reviews');
    expect(result!.query.average_rating).toEqual(4.25);
    expect(result!.query.sentiment_summary).toEqual({
      positive: 60,
      neutral: 25,
      negative: 15
    });

    expect(result!.products).toHaveLength(1);
    expect(result!.products[0].name).toEqual('Test Smartphone');
    expect(result!.products[0].price).toEqual(299.99);
    expect(result!.products[0].average_rating).toEqual(4.5);

    expect(result!.reviews).toHaveLength(1);
    expect(result!.reviews[0].review_text).toEqual('Great phone, excellent value');
    expect(result!.reviews[0].rating).toEqual(5);

    expect(result!.keywords).toHaveLength(1);
    expect(result!.keywords[0].keyword).toEqual('excellent');
    expect(result!.keywords[0].frequency).toEqual(25);

    expect(result!.recommendations).toHaveLength(1);
    expect(result!.recommendations[0].title).toEqual('Focus on Value Proposition');
    expect(result!.recommendations[0].frequency_score).toEqual(85.5);
    expect(result!.recommendations[0].related_keywords).toEqual(['value', 'price', 'affordable']);
  });

  it('should return query with empty arrays when no related data exists', async () => {
    // Create only the query
    const queryResult = await db.insert(queriesTable)
      .values({
        ...testQuery,
        average_rating: null,
        sentiment_positive: null,
        sentiment_neutral: null,
        sentiment_negative: null
      })
      .returning()
      .execute();
    
    const queryId = queryResult[0].id;

    const result = await getQuery(queryId);

    expect(result).not.toBeNull();
    expect(result!.query.id).toEqual(queryId);
    expect(result!.query.average_rating).toBeNull();
    expect(result!.query.sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
    expect(result!.products).toHaveLength(0);
    expect(result!.reviews).toHaveLength(0);
    expect(result!.keywords).toHaveLength(0);
    expect(result!.recommendations).toHaveLength(0);
  });
});
