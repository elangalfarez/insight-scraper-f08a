
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type CreateQueryInput } from '../schema';
import { createQuery } from '../handlers/create_query';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateQueryInput = {
  input: 'wireless headphones',
  query_type: 'keyword',
  platform: 'shopee',
  expires_at: new Date('2024-12-31T23:59:59Z')
};

// Test input without optional platform
const testInputNoPlat: CreateQueryInput = {
  input: 'https://shopee.com/product/123',
  query_type: 'url',
  expires_at: new Date('2024-12-31T23:59:59Z')
};

describe('createQuery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a query with platform', async () => {
    const result = await createQuery(testInput);

    // Basic field validation
    expect(result.input).toEqual('wireless headphones');
    expect(result.query_type).toEqual('keyword');
    expect(result.platform).toEqual('shopee');
    expect(result.status).toEqual('pending');
    expect(result.total_products_found).toEqual(0);
    expect(result.total_reviews_scraped).toEqual(0);
    expect(result.average_rating).toEqual(null);
    expect(result.expires_at).toEqual(testInput.expires_at);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify sentiment summary structure
    expect(result.sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
  });

  it('should create a query without platform', async () => {
    const result = await createQuery(testInputNoPlat);

    expect(result.input).toEqual('https://shopee.com/product/123');
    expect(result.query_type).toEqual('url');
    expect(result.platform).toEqual(null);
    expect(result.status).toEqual('pending');
    expect(result.expires_at).toEqual(testInputNoPlat.expires_at);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save query to database', async () => {
    const result = await createQuery(testInput);

    // Query using proper drizzle syntax
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, result.id))
      .execute();

    expect(queries).toHaveLength(1);
    expect(queries[0].input).toEqual('wireless headphones');
    expect(queries[0].query_type).toEqual('keyword');
    expect(queries[0].platform).toEqual('shopee');
    expect(queries[0].status).toEqual('pending');
    expect(queries[0].total_products_found).toEqual(0);
    expect(queries[0].total_reviews_scraped).toEqual(0);
    expect(queries[0].sentiment_positive).toEqual(0);
    expect(queries[0].sentiment_neutral).toEqual(0);
    expect(queries[0].sentiment_negative).toEqual(0);
    expect(queries[0].created_at).toBeInstanceOf(Date);
    expect(queries[0].updated_at).toBeInstanceOf(Date);
    expect(queries[0].expires_at).toEqual(testInput.expires_at);
  });

  it('should handle different query types', async () => {
    const keywordQuery = await createQuery({
      input: 'smartphone',
      query_type: 'keyword',
      platform: 'tokopedia',
      expires_at: new Date('2024-12-31T23:59:59Z')
    });

    const urlQuery = await createQuery({
      input: 'https://tiktok.com/shop/product/456',
      query_type: 'url',
      platform: 'tiktok_shop',
      expires_at: new Date('2024-12-31T23:59:59Z')
    });

    expect(keywordQuery.query_type).toEqual('keyword');
    expect(keywordQuery.platform).toEqual('tokopedia');
    expect(urlQuery.query_type).toEqual('url');
    expect(urlQuery.platform).toEqual('tiktok_shop');
  });

  it('should handle all platform types', async () => {
    const shopeeQuery = await createQuery({
      input: 'test product',
      query_type: 'keyword',
      platform: 'shopee',
      expires_at: new Date('2024-12-31T23:59:59Z')
    });

    const tiktokQuery = await createQuery({
      input: 'test product',
      query_type: 'keyword',
      platform: 'tiktok_shop',
      expires_at: new Date('2024-12-31T23:59:59Z')
    });

    const tokopediaQuery = await createQuery({
      input: 'test product',
      query_type: 'keyword',
      platform: 'tokopedia',
      expires_at: new Date('2024-12-31T23:59:59Z')
    });

    expect(shopeeQuery.platform).toEqual('shopee');
    expect(tiktokQuery.platform).toEqual('tiktok_shop');
    expect(tokopediaQuery.platform).toEqual('tokopedia');
  });
});
