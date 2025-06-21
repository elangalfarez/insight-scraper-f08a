
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { getRecommendation } from '../handlers/get_recommendation';

describe('getRecommendation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a recommendation by id', async () => {
    // Create prerequisite query
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

    // Create test recommendation
    const recommendationResult = await db.insert(recommendationsTable)
      .values({
        query_id: queryId,
        title: 'Test Recommendation',
        description: 'A test recommendation for testing',
        priority: 'high',
        related_keywords: ['test', 'keyword'],
        frequency_score: '85.5'
      })
      .returning()
      .execute();

    const recommendationId = recommendationResult[0].id;

    // Test the handler
    const result = await getRecommendation(recommendationId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recommendationId);
    expect(result!.query_id).toEqual(queryId);
    expect(result!.title).toEqual('Test Recommendation');
    expect(result!.description).toEqual('A test recommendation for testing');
    expect(result!.priority).toEqual('high');
    expect(result!.related_keywords).toEqual(['test', 'keyword']);
    expect(result!.frequency_score).toEqual(85.5);
    expect(typeof result!.frequency_score).toEqual('number');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent recommendation', async () => {
    const result = await getRecommendation('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('should handle jsonb array conversion correctly', async () => {
    // Create prerequisite query
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'tokopedia',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create recommendation with complex keywords array
    const recommendationResult = await db.insert(recommendationsTable)
      .values({
        query_id: queryId,
        title: 'Complex Keywords Test',
        description: 'Testing complex keyword arrays',
        priority: 'medium',
        related_keywords: ['keyword1', 'keyword2', 'keyword3', 'long keyword phrase'],
        frequency_score: '92.75'
      })
      .returning()
      .execute();

    const result = await getRecommendation(recommendationResult[0].id);

    expect(result).not.toBeNull();
    expect(Array.isArray(result!.related_keywords)).toBe(true);
    expect(result!.related_keywords).toHaveLength(4);
    expect(result!.related_keywords).toContain('keyword1');
    expect(result!.related_keywords).toContain('long keyword phrase');
  });
});
