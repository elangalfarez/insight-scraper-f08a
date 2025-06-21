
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, keywordsTable } from '../db/schema';
import { type BulkCreateKeywordsInput } from '../schema';
import { bulkCreateKeywords } from '../handlers/bulk_create_keywords';
import { eq } from 'drizzle-orm';

describe('bulkCreateKeywords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create multiple keywords', async () => {
    // Create a query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    const testInput: BulkCreateKeywordsInput = {
      keywords: [
        {
          query_id: queryId,
          keyword: 'quality',
          frequency: 15,
          sentiment_context: 'positive'
        },
        {
          query_id: queryId,
          keyword: 'price',
          frequency: 10,
          sentiment_context: 'neutral'
        },
        {
          query_id: queryId,
          keyword: 'slow',
          frequency: 5,
          sentiment_context: 'negative'
        }
      ]
    };

    const result = await bulkCreateKeywords(testInput);

    // Verify correct number of keywords created
    expect(result).toHaveLength(3);

    // Verify first keyword
    expect(result[0].query_id).toEqual(queryId);
    expect(result[0].keyword).toEqual('quality');
    expect(result[0].frequency).toEqual(15);
    expect(result[0].sentiment_context).toEqual('positive');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second keyword
    expect(result[1].query_id).toEqual(queryId);
    expect(result[1].keyword).toEqual('price');
    expect(result[1].frequency).toEqual(10);
    expect(result[1].sentiment_context).toEqual('neutral');

    // Verify third keyword
    expect(result[2].query_id).toEqual(queryId);
    expect(result[2].keyword).toEqual('slow');
    expect(result[2].frequency).toEqual(5);
    expect(result[2].sentiment_context).toEqual('negative');
  });

  it('should save keywords to database', async () => {
    // Create a query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    const testInput: BulkCreateKeywordsInput = {
      keywords: [
        {
          query_id: queryId,
          keyword: 'excellent',
          frequency: 20,
          sentiment_context: 'positive'
        },
        {
          query_id: queryId,
          keyword: 'expensive',
          frequency: 8,
          sentiment_context: 'negative'
        }
      ]
    };

    const result = await bulkCreateKeywords(testInput);

    // Query database to verify keywords were saved
    const savedKeywords = await db.select()
      .from(keywordsTable)
      .where(eq(keywordsTable.query_id, queryId))
      .execute();

    expect(savedKeywords).toHaveLength(2);
    
    // Verify saved data matches input
    const excellentKeyword = savedKeywords.find(k => k.keyword === 'excellent');
    expect(excellentKeyword).toBeDefined();
    expect(excellentKeyword!.frequency).toEqual(20);
    expect(excellentKeyword!.sentiment_context).toEqual('positive');

    const expensiveKeyword = savedKeywords.find(k => k.keyword === 'expensive');
    expect(expensiveKeyword).toBeDefined();
    expect(expensiveKeyword!.frequency).toEqual(8);
    expect(expensiveKeyword!.sentiment_context).toEqual('negative');
  });

  it('should handle empty keywords array', async () => {
    const testInput: BulkCreateKeywordsInput = {
      keywords: []
    };

    const result = await bulkCreateKeywords(testInput);

    expect(result).toHaveLength(0);
  });

  it('should handle single keyword', async () => {
    // Create a query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'single keyword test',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    const testInput: BulkCreateKeywordsInput = {
      keywords: [
        {
          query_id: queryId,
          keyword: 'amazing',
          frequency: 25,
          sentiment_context: 'positive'
        }
      ]
    };

    const result = await bulkCreateKeywords(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].keyword).toEqual('amazing');
    expect(result[0].frequency).toEqual(25);
    expect(result[0].sentiment_context).toEqual('positive');
  });
});
