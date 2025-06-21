
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type CreateQueryInput } from '../schema';
import { createSearchQuery } from '../handlers/create_search_query';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateQueryInput = {
  input: 'test product keyword',
  query_type: 'keyword',
  platform: 'shopee',
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
};

describe('createSearchQuery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a query', async () => {
    const result = await createSearchQuery(testInput);

    // Basic field validation
    expect(result.input).toEqual('test product keyword');
    expect(result.query_type).toEqual('keyword');
    expect(result.platform).toEqual('shopee');
    expect(result.status).toEqual('pending');
    expect(result.total_products_found).toEqual(0);
    expect(result.total_reviews_scraped).toEqual(0);
    expect(result.average_rating).toBeNull();
    expect(result.sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.expires_at).toBeInstanceOf(Date);
  });

  it('should save query to database', async () => {
    const result = await createSearchQuery(testInput);

    // Query database to verify
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, result.id))
      .execute();

    expect(queries).toHaveLength(1);
    expect(queries[0].input).toEqual('test product keyword');
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
    expect(queries[0].expires_at).toBeInstanceOf(Date);
  });

  it('should create query without platform', async () => {
    const inputWithoutPlatform: CreateQueryInput = {
      input: 'url query test',
      query_type: 'url',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    const result = await createSearchQuery(inputWithoutPlatform);

    expect(result.input).toEqual('url query test');
    expect(result.query_type).toEqual('url');
    expect(result.platform).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
  });

  it('should handle different query types', async () => {
    const urlInput: CreateQueryInput = {
      input: 'https://example.com/product',
      query_type: 'url',
      platform: 'tokopedia',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000)
    };

    const result = await createSearchQuery(urlInput);

    expect(result.input).toEqual('https://example.com/product');
    expect(result.query_type).toEqual('url');
    expect(result.platform).toEqual('tokopedia');
    expect(result.status).toEqual('pending');
  });
});
