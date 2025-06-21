
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { getQueryResults } from '../handlers/get_query_results';

describe('getQueryResults', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty results for query with no data', async () => {
    // Create a query first
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

    const results = await getQueryResults(queryId);

    expect(results.products).toEqual([]);
    expect(results.reviews).toEqual([]);
    expect(results.keywords).toEqual([]);
    expect(results.recommendations).toEqual([]);
  });

  it('should return all related data for a query', async () => {
    // Create a query
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'smartphone',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'Test Phone',
        url: 'https://test.com/phone',
        platform: 'shopee',
        price: '599.99',
        average_rating: '4.5',
        total_reviews: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create a review
    await db.insert(reviewsTable)
      .values({
        product_id: productId,
        review_text: 'Great phone!',
        rating: 5,
        review_date: new Date(),
        sentiment: 'positive'
      })
      .execute();

    // Create a keyword
    await db.insert(keywordsTable)
      .values({
        query_id: queryId,
        keyword: 'battery',
        frequency: 15,
        sentiment_context: 'positive'
      })
      .execute();

    // Create a recommendation
    await db.insert(recommendationsTable)
      .values({
        query_id: queryId,
        title: 'Focus on battery life',
        description: 'Customers value long battery life',
        priority: 'high',
        related_keywords: JSON.stringify(['battery', 'power']),
        frequency_score: '25.5'
      })
      .execute();

    const results = await getQueryResults(queryId);

    // Verify products
    expect(results.products).toHaveLength(1);
    expect(results.products[0].name).toBe('Test Phone');
    expect(results.products[0].price).toBe(599.99);
    expect(results.products[0].average_rating).toBe(4.5);
    expect(typeof results.products[0].price).toBe('number');
    expect(typeof results.products[0].average_rating).toBe('number');

    // Verify reviews
    expect(results.reviews).toHaveLength(1);
    expect(results.reviews[0].review_text).toBe('Great phone!');
    expect(results.reviews[0].rating).toBe(5);
    expect(results.reviews[0].sentiment).toBe('positive');

    // Verify keywords
    expect(results.keywords).toHaveLength(1);
    expect(results.keywords[0].keyword).toBe('battery');
    expect(results.keywords[0].frequency).toBe(15);
    expect(results.keywords[0].sentiment_context).toBe('positive');

    // Verify recommendations
    expect(results.recommendations).toHaveLength(1);
    expect(results.recommendations[0].title).toBe('Focus on battery life');
    expect(results.recommendations[0].priority).toBe('high');
    expect(results.recommendations[0].related_keywords).toEqual(['battery', 'power']);
    expect(results.recommendations[0].frequency_score).toBe(25.5);
    expect(typeof results.recommendations[0].frequency_score).toBe('number');
  });

  it('should handle multiple products with reviews', async () => {
    // Create a query
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'laptop',
        query_type: 'keyword',
        platform: 'tokopedia',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create two products
    const product1Result = await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'Gaming Laptop',
        url: 'https://test.com/gaming',
        platform: 'tokopedia',
        price: '1299.99'
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'Business Laptop',
        url: 'https://test.com/business',
        platform: 'tokopedia',
        price: '899.99'
      })
      .returning()
      .execute();

    // Create reviews for both products
    await db.insert(reviewsTable)
      .values({
        product_id: product1Result[0].id,
        review_text: 'Excellent for gaming',
        rating: 5,
        review_date: new Date()
      })
      .execute();

    await db.insert(reviewsTable)
      .values({
        product_id: product2Result[0].id,
        review_text: 'Perfect for work',
        rating: 4,
        review_date: new Date()
      })
      .execute();

    const results = await getQueryResults(queryId);

    expect(results.products).toHaveLength(2);
    expect(results.reviews).toHaveLength(2);
    
    const productNames = results.products.map(p => p.name).sort();
    expect(productNames).toEqual(['Business Laptop', 'Gaming Laptop']);
    
    const reviewTexts = results.reviews.map(r => r.review_text).sort();
    expect(reviewTexts).toEqual(['Excellent for gaming', 'Perfect for work']);
  });

  it('should handle null numeric values correctly', async () => {
    // Create a query and product with null price and rating
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test product',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'No Price Product',
        url: 'https://test.com/noprice',
        platform: 'shopee',
        price: null,
        average_rating: null
      })
      .execute();

    const results = await getQueryResults(queryId);

    expect(results.products).toHaveLength(1);
    expect(results.products[0].price).toBeNull();
    expect(results.products[0].average_rating).toBeNull();
  });
});
