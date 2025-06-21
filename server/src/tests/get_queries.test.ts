
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type CreateQueryInput } from '../schema';
import { getQueries } from '../handlers/get_queries';

const testQuery1: CreateQueryInput = {
  input: 'wireless headphones',
  query_type: 'keyword',
  platform: 'shopee',
  expires_at: new Date(Date.now() + 86400000) // 24 hours from now
};

const testQuery2: CreateQueryInput = {
  input: 'https://shopee.com/product/123',
  query_type: 'url',
  expires_at: new Date(Date.now() + 86400000)
};

describe('getQueries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no queries exist', async () => {
    const result = await getQueries();
    expect(result).toEqual([]);
  });

  it('should return all queries', async () => {
    // Create test queries
    await db.insert(queriesTable)
      .values([
        {
          input: testQuery1.input,
          query_type: testQuery1.query_type,
          platform: testQuery1.platform,
          expires_at: testQuery1.expires_at
        },
        {
          input: testQuery2.input,
          query_type: testQuery2.query_type,
          platform: testQuery2.platform,
          expires_at: testQuery2.expires_at
        }
      ])
      .execute();

    const result = await getQueries();

    expect(result).toHaveLength(2);
    
    // Check first query
    const query1 = result.find(q => q.input === 'wireless headphones');
    expect(query1).toBeDefined();
    expect(query1!.query_type).toEqual('keyword');
    expect(query1!.platform).toEqual('shopee');
    expect(query1!.status).toEqual('pending');
    expect(query1!.total_products_found).toEqual(0);
    expect(query1!.total_reviews_scraped).toEqual(0);
    expect(query1!.average_rating).toBeNull();
    expect(query1!.sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
    expect(query1!.id).toBeDefined();
    expect(query1!.created_at).toBeInstanceOf(Date);
    expect(query1!.updated_at).toBeInstanceOf(Date);
    expect(query1!.expires_at).toBeInstanceOf(Date);

    // Check second query
    const query2 = result.find(q => q.input === 'https://shopee.com/product/123');
    expect(query2).toBeDefined();
    expect(query2!.query_type).toEqual('url');
    expect(query2!.platform).toBeNull();
  });

  it('should handle queries with numeric values', async () => {
    // Create query with numeric values
    await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'tokopedia',
        status: 'completed',
        total_products_found: 15,
        total_reviews_scraped: 250,
        average_rating: '4.25',
        sentiment_positive: 120,
        sentiment_neutral: 80,
        sentiment_negative: 50,
        expires_at: new Date(Date.now() + 86400000)
      })
      .execute();

    const result = await getQueries();

    expect(result).toHaveLength(1);
    const query = result[0];
    
    expect(query.status).toEqual('completed');
    expect(query.total_products_found).toEqual(15);
    expect(query.total_reviews_scraped).toEqual(250);
    expect(query.average_rating).toEqual(4.25);
    expect(typeof query.average_rating).toBe('number');
    expect(query.sentiment_summary).toEqual({
      positive: 120,
      neutral: 80,
      negative: 50
    });
  });

  it('should handle null sentiment values', async () => {
    // Create query with null sentiment values
    await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 86400000),
        sentiment_positive: null,
        sentiment_neutral: null,
        sentiment_negative: null
      })
      .execute();

    const result = await getQueries();

    expect(result).toHaveLength(1);
    expect(result[0].sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
  });
});
