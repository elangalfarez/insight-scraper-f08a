
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { type BulkCreateRecommendationsInput } from '../schema';
import { bulkCreateRecommendations } from '../handlers/bulk_create_recommendations';
import { eq } from 'drizzle-orm';

describe('bulkCreateRecommendations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let queryId: string;

  beforeEach(async () => {
    // Create prerequisite query directly
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test product',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 86400000) // 24 hours from now
      })
      .returning()
      .execute();
    
    queryId = queryResult[0].id;
  });

  it('should create multiple recommendations', async () => {
    const testInput: BulkCreateRecommendationsInput = {
      recommendations: [
        {
          query_id: queryId,
          title: 'First Recommendation',
          description: 'First recommendation description',
          priority: 'high',
          related_keywords: ['keyword1', 'keyword2'],
          frequency_score: 95.5
        },
        {
          query_id: queryId,
          title: 'Second Recommendation',
          description: 'Second recommendation description',
          priority: 'medium',
          related_keywords: ['keyword3', 'keyword4', 'keyword5'],
          frequency_score: 78.25
        }
      ]
    };

    const result = await bulkCreateRecommendations(testInput);

    // Verify results structure
    expect(result).toHaveLength(2);
    
    // Verify first recommendation
    expect(result[0].title).toEqual('First Recommendation');
    expect(result[0].description).toEqual('First recommendation description');
    expect(result[0].priority).toEqual('high');
    expect(result[0].related_keywords).toEqual(['keyword1', 'keyword2']);
    expect(result[0].frequency_score).toEqual(95.5);
    expect(typeof result[0].frequency_score).toBe('number');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second recommendation
    expect(result[1].title).toEqual('Second Recommendation');
    expect(result[1].description).toEqual('Second recommendation description');
    expect(result[1].priority).toEqual('medium');
    expect(result[1].related_keywords).toEqual(['keyword3', 'keyword4', 'keyword5']);
    expect(result[1].frequency_score).toEqual(78.25);
    expect(typeof result[1].frequency_score).toBe('number');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should save recommendations to database', async () => {
    const testInput: BulkCreateRecommendationsInput = {
      recommendations: [
        {
          query_id: queryId,
          title: 'Test Recommendation',
          description: 'Test description',
          priority: 'low',
          related_keywords: ['test', 'keyword'],
          frequency_score: 42.75
        }
      ]
    };

    const result = await bulkCreateRecommendations(testInput);

    // Query database to verify
    const recommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, result[0].id))
      .execute();

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].title).toEqual('Test Recommendation');
    expect(recommendations[0].description).toEqual('Test description');
    expect(recommendations[0].priority).toEqual('low');
    expect(recommendations[0].related_keywords).toEqual(['test', 'keyword']);
    expect(parseFloat(recommendations[0].frequency_score)).toEqual(42.75);
    expect(recommendations[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle empty recommendations array', async () => {
    const testInput: BulkCreateRecommendationsInput = {
      recommendations: []
    };

    const result = await bulkCreateRecommendations(testInput);

    expect(result).toHaveLength(0);
  });

  it('should handle single recommendation', async () => {
    const testInput: BulkCreateRecommendationsInput = {
      recommendations: [
        {
          query_id: queryId,
          title: 'Single Recommendation',
          description: 'Single recommendation description',
          priority: 'high',
          related_keywords: ['single'],
          frequency_score: 100.0
        }
      ]
    };

    const result = await bulkCreateRecommendations(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Single Recommendation');
    expect(result[0].related_keywords).toEqual(['single']);
    expect(result[0].frequency_score).toEqual(100.0);
  });
});
