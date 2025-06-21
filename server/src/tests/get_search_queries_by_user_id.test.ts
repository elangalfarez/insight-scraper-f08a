
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { getSearchQueriesByUserId } from '../handlers/get_search_queries_by_user_id';

describe('getSearchQueriesByUserId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no queries exist', async () => {
    const result = await getSearchQueriesByUserId({ user_id: 'test-user-id' });
    expect(result).toEqual([]);
  });

  it('should return all queries (cannot filter by user_id due to schema limitation)', async () => {
    // Create test query without user_id (not available in current schema)
    const testQuery = {
      input: 'test query',
      query_type: 'keyword' as const,
      platform: 'shopee' as const,
      status: 'completed',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    await db.insert(queriesTable).values(testQuery).execute();

    const result = await getSearchQueriesByUserId({ user_id: 'any-user-id' });

    expect(result).toHaveLength(1);
    expect(result[0].input).toBe('test query');
    expect(result[0].query_type).toBe('keyword');
    expect(result[0].platform).toBe('shopee');
    expect(result[0].status).toBe('completed');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple queries', async () => {
    const queries = [
      {
        input: 'query 1',
        query_type: 'keyword' as const,
        platform: 'shopee' as const,
        status: 'completed',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        input: 'query 2',
        query_type: 'url' as const,
        platform: 'tiktok_shop' as const,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    await db.insert(queriesTable).values(queries).execute();

    const result = await getSearchQueriesByUserId({ user_id: 'test-user' });

    expect(result).toHaveLength(2);
    expect(result.map(q => q.input)).toEqual(['query 1', 'query 2']);
    expect(result.map(q => q.query_type)).toEqual(['keyword', 'url']);
    expect(result.map(q => q.platform)).toEqual(['shopee', 'tiktok_shop']);
  });

  it('should return queries with correct field types', async () => {
    const testQuery = {
      input: 'test query with stats',
      query_type: 'keyword' as const,
      platform: 'tokopedia' as const,
      status: 'completed',
      total_products_found: 15,
      total_reviews_scraped: 250,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    await db.insert(queriesTable).values(testQuery).execute();

    const result = await getSearchQueriesByUserId({ user_id: 'test-user' });

    expect(result).toHaveLength(1);
    const query = result[0];
    expect(typeof query.id).toBe('string');
    expect(typeof query.input).toBe('string');
    expect(typeof query.query_type).toBe('string');
    expect(typeof query.status).toBe('string');
    expect(typeof query.total_products_found).toBe('number');
    expect(typeof query.total_reviews_scraped).toBe('number');
    expect(query.created_at).toBeInstanceOf(Date);
  });
});
