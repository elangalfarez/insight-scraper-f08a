
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type CreateQueryInput } from '../schema';
import { getQueryHistory } from '../handlers/get_query_history';

describe('getQueryHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no queries exist', async () => {
    const result = await getQueryHistory();
    expect(result).toEqual([]);
  });

  it('should return query history items', async () => {
    // Create test queries separately to ensure proper timestamps
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(queriesTable).values({
      input: 'gaming headset',
      query_type: 'keyword',
      platform: 'shopee',
      status: 'completed',
      total_products_found: 25,
      total_reviews_scraped: 150,
      expires_at: expiresAt
    }).execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(queriesTable).values({
      input: 'wireless mouse',
      query_type: 'keyword',
      platform: 'tokopedia',
      status: 'pending',
      total_products_found: 0,
      total_reviews_scraped: 0,
      expires_at: expiresAt
    }).execute();

    const result = await getQueryHistory();

    expect(result).toHaveLength(2);
    
    // Check first item (should be most recent - wireless mouse)
    expect(result[0].input).toEqual('wireless mouse');
    expect(result[0].query_type).toEqual('keyword');
    expect(result[0].platform).toEqual('tokopedia');
    expect(result[0].status).toEqual('pending');
    expect(result[0].total_products_found).toEqual(0);
    expect(result[0].total_reviews_scraped).toEqual(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second item (should be older - gaming headset)
    expect(result[1].input).toEqual('gaming headset');
    expect(result[1].query_type).toEqual('keyword');
    expect(result[1].platform).toEqual('shopee');
    expect(result[1].status).toEqual('completed');
    expect(result[1].total_products_found).toEqual(25);
    expect(result[1].total_reviews_scraped).toEqual(150);
  });

  it('should return queries ordered by created_at descending', async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create queries with slight delay to ensure different timestamps
    await db.insert(queriesTable).values({
      input: 'first query',
      query_type: 'keyword',
      platform: 'shopee',
      expires_at: expiresAt
    }).execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(queriesTable).values({
      input: 'second query',
      query_type: 'url',
      platform: null,
      expires_at: expiresAt
    }).execute();

    const result = await getQueryHistory();

    expect(result).toHaveLength(2);
    expect(result[0].input).toEqual('second query');
    expect(result[1].input).toEqual('first query');
    
    // Verify ordering by timestamp
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle queries with null platform', async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(queriesTable).values({
      input: 'https://example.com/product',
      query_type: 'url',
      platform: null,
      status: 'processing',
      total_products_found: 1,
      total_reviews_scraped: 10,
      expires_at: expiresAt
    }).execute();

    const result = await getQueryHistory();

    expect(result).toHaveLength(1);
    expect(result[0].input).toEqual('https://example.com/product');
    expect(result[0].query_type).toEqual('url');
    expect(result[0].platform).toBeNull();
    expect(result[0].status).toEqual('processing');
    expect(result[0].total_products_found).toEqual(1);
    expect(result[0].total_reviews_scraped).toEqual(10);
  });
});
