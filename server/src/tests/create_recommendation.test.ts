
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { type CreateRecommendationInput, createRecommendation } from '../handlers/create_recommendation';
import { eq } from 'drizzle-orm';

describe('createRecommendation', () => {
  let testQueryId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite query record
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test product',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })
      .returning()
      .execute();
    
    testQueryId = queryResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateRecommendationInput = {
    query_id: '', // Will be set in tests
    title: 'Improve Product Description',
    description: 'Consider adding more detailed specifications to attract customers',
    priority: 'high',
    related_keywords: ['specification', 'detail', 'feature'],
    frequency_score: 87.5
  };

  it('should create a recommendation', async () => {
    const input = { ...testInput, query_id: testQueryId };
    const result = await createRecommendation(input);

    // Basic field validation
    expect(result.title).toEqual('Improve Product Description');
    expect(result.description).toEqual(testInput.description);
    expect(result.priority).toEqual('high');
    expect(result.related_keywords).toEqual(['specification', 'detail', 'feature']);
    expect(result.frequency_score).toEqual(87.5);
    expect(typeof result.frequency_score).toEqual('number');
    expect(result.query_id).toEqual(testQueryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save recommendation to database', async () => {
    const input = { ...testInput, query_id: testQueryId };
    const result = await createRecommendation(input);

    // Query using proper drizzle syntax
    const recommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, result.id))
      .execute();

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].title).toEqual('Improve Product Description');
    expect(recommendations[0].description).toEqual(testInput.description);
    expect(recommendations[0].priority).toEqual('high');
    expect(recommendations[0].related_keywords).toEqual(['specification', 'detail', 'feature']);
    expect(parseFloat(recommendations[0].frequency_score)).toEqual(87.5);
    expect(recommendations[0].query_id).toEqual(testQueryId);
    expect(recommendations[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different priority levels', async () => {
    const mediumPriorityInput = {
      ...testInput,
      query_id: testQueryId,
      title: 'Medium Priority Task',
      priority: 'medium' as const
    };

    const result = await createRecommendation(mediumPriorityInput);
    expect(result.priority).toEqual('medium');
    expect(result.title).toEqual('Medium Priority Task');
  });

  it('should handle empty related keywords array', async () => {
    const input = {
      ...testInput,
      query_id: testQueryId,
      related_keywords: []
    };

    const result = await createRecommendation(input);
    expect(result.related_keywords).toEqual([]);
    expect(Array.isArray(result.related_keywords)).toBe(true);
  });

  it('should handle decimal frequency scores correctly', async () => {
    const input = {
      ...testInput,
      query_id: testQueryId,
      frequency_score: 42.75
    };

    const result = await createRecommendation(input);
    expect(result.frequency_score).toEqual(42.75);
    expect(typeof result.frequency_score).toEqual('number');
  });
});
