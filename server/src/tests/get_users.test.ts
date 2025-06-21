
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { type CreateQueryInput } from '../schema';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no queries exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all queries', async () => {
    // Create test queries
    const testQuery1: CreateQueryInput = {
      input: 'test product 1',
      query_type: 'keyword',
      platform: 'shopee',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    const testQuery2: CreateQueryInput = {
      input: 'test product 2',
      query_type: 'url',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    await db.insert(queriesTable).values([
      {
        input: testQuery1.input,
        query_type: testQuery1.query_type,
        platform: testQuery1.platform,
        expires_at: testQuery1.expires_at
      },
      {
        input: testQuery2.input,
        query_type: testQuery2.query_type,
        expires_at: testQuery2.expires_at
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].input).toBe('test product 1');
    expect(result[0].query_type).toBe('keyword');
    expect(result[0].platform).toBe('shopee');
    expect(result[0].status).toBe('pending');
    expect(result[0].sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });

    expect(result[1].input).toBe('test product 2');
    expect(result[1].query_type).toBe('url');
    expect(result[1].platform).toBeNull();
  });

  it('should handle numeric field conversions correctly', async () => {
    await db.insert(queriesTable).values({
      input: 'test query',
      query_type: 'keyword',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      average_rating: '4.5',
      sentiment_positive: 10,
      sentiment_neutral: 5,
      sentiment_negative: 2
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(typeof result[0].average_rating).toBe('number');
    expect(result[0].average_rating).toBe(4.5);
    expect(result[0].sentiment_summary).toEqual({
      positive: 10,
      neutral: 5,
      negative: 2
    });
  });
});
