
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type UpdateQueryStatusInput } from '../schema';
import { updateQueryStatus } from '../handlers/update_query_status';
import { eq } from 'drizzle-orm';

// Helper to create a test query directly in database
const createTestQuery = async (): Promise<string> => {
  const result = await db.insert(queriesTable)
    .values({
      input: 'test keyword',
      query_type: 'keyword',
      platform: 'shopee',
      status: 'pending',
      total_products_found: 0,
      total_reviews_scraped: 0,
      expires_at: new Date(Date.now() + 86400000) // 24 hours from now
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateQueryStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update query status', async () => {
    const queryId = await createTestQuery();
    
    const updateInput: UpdateQueryStatusInput = {
      id: queryId,
      status: 'completed'
    };

    const result = await updateQueryStatus(updateInput);

    expect(result.id).toEqual(queryId);
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update optional numeric fields', async () => {
    const queryId = await createTestQuery();
    
    const updateInput: UpdateQueryStatusInput = {
      id: queryId,
      status: 'completed',
      total_products_found: 25,
      total_reviews_scraped: 150,
      average_rating: 4.2,
      sentiment_positive: 80,
      sentiment_neutral: 50,
      sentiment_negative: 20
    };

    const result = await updateQueryStatus(updateInput);

    expect(result.status).toEqual('completed');
    expect(result.total_products_found).toEqual(25);
    expect(result.total_reviews_scraped).toEqual(150);
    expect(result.average_rating).toEqual(4.2);
    expect(typeof result.average_rating).toBe('number');
    expect(result.sentiment_summary).toEqual({
      positive: 80,
      neutral: 50,
      negative: 20
    });
  });

  it('should save updated data to database', async () => {
    const queryId = await createTestQuery();
    
    const updateInput: UpdateQueryStatusInput = {
      id: queryId,
      status: 'processing',
      total_products_found: 10,
      average_rating: 3.8
    };

    await updateQueryStatus(updateInput);

    // Verify data was saved to database
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, queryId))
      .execute();

    expect(queries).toHaveLength(1);
    const savedQuery = queries[0];
    expect(savedQuery.status).toEqual('processing');
    expect(savedQuery.total_products_found).toEqual(10);
    expect(parseFloat(savedQuery.average_rating!)).toEqual(3.8);
    expect(savedQuery.updated_at).toBeInstanceOf(Date);
  });

  it('should handle partial updates', async () => {
    const queryId = await createTestQuery();
    
    // First update - only status
    const firstUpdate: UpdateQueryStatusInput = {
      id: queryId,
      status: 'processing'
    };

    const firstResult = await updateQueryStatus(firstUpdate);
    expect(firstResult.status).toEqual('processing');
    expect(firstResult.total_products_found).toEqual(0); // Should remain default

    // Second update - add products found
    const secondUpdate: UpdateQueryStatusInput = {
      id: queryId,
      status: 'processing',
      total_products_found: 5
    };

    const secondResult = await updateQueryStatus(secondUpdate);
    expect(secondResult.status).toEqual('processing');
    expect(secondResult.total_products_found).toEqual(5);
  });

  it('should handle null average_rating correctly', async () => {
    const queryId = await createTestQuery();
    
    const updateInput: UpdateQueryStatusInput = {
      id: queryId,
      status: 'completed',
      total_products_found: 0 // No products found, so no average rating
    };

    const result = await updateQueryStatus(updateInput);

    expect(result.average_rating).toBeNull();
    expect(result.sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
  });

  it('should throw error for non-existent query', async () => {
    const updateInput: UpdateQueryStatusInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format but non-existent
      status: 'completed'
    };

    await expect(updateQueryStatus(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle sentiment summary with zero values', async () => {
    const queryId = await createTestQuery();
    
    const updateInput: UpdateQueryStatusInput = {
      id: queryId,
      status: 'completed',
      sentiment_positive: 0,
      sentiment_neutral: 0,
      sentiment_negative: 0
    };

    const result = await updateQueryStatus(updateInput);

    expect(result.sentiment_summary).toEqual({
      positive: 0,
      neutral: 0,
      negative: 0
    });
  });
});
