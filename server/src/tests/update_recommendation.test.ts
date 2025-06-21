
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { updateRecommendation, type UpdateRecommendationInput } from '../handlers/update_recommendation';
import { eq } from 'drizzle-orm';

describe('updateRecommendation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let queryId: string;
  let recommendationId: string;

  beforeEach(async () => {
    // Create a test query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        status: 'completed',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })
      .returning()
      .execute();
    
    queryId = queryResult[0].id;

    // Create a test recommendation
    const recommendationResult = await db.insert(recommendationsTable)
      .values({
        query_id: queryId,
        title: 'Original Title',
        description: 'Original description',
        priority: 'medium',
        related_keywords: ['keyword1', 'keyword2'],
        frequency_score: '50.5'
      })
      .returning()
      .execute();
    
    recommendationId = recommendationResult[0].id;
  });

  it('should update recommendation title', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      title: 'Updated Title'
    };

    const result = await updateRecommendation(input);

    expect(result.id).toEqual(recommendationId);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.priority).toEqual('medium');
    expect(result.related_keywords).toEqual(['keyword1', 'keyword2']);
    expect(result.frequency_score).toEqual(50.5);
  });

  it('should update recommendation description', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      description: 'Updated description'
    };

    const result = await updateRecommendation(input);

    expect(result.description).toEqual('Updated description');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update recommendation priority', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      priority: 'high'
    };

    const result = await updateRecommendation(input);

    expect(result.priority).toEqual('high');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update related keywords', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      related_keywords: ['new_keyword1', 'new_keyword2', 'new_keyword3']
    };

    const result = await updateRecommendation(input);

    expect(result.related_keywords).toEqual(['new_keyword1', 'new_keyword2', 'new_keyword3']);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update frequency score', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      frequency_score: 75.25
    };

    const result = await updateRecommendation(input);

    expect(result.frequency_score).toEqual(75.25);
    expect(typeof result.frequency_score).toEqual('number');
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      title: 'Multi Update Title',
      priority: 'low',
      frequency_score: 25.75
    };

    const result = await updateRecommendation(input);

    expect(result.title).toEqual('Multi Update Title');
    expect(result.priority).toEqual('low');
    expect(result.frequency_score).toEqual(25.75);
    expect(result.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateRecommendationInput = {
      id: recommendationId,
      title: 'Database Test Title',
      priority: 'high'
    };

    await updateRecommendation(input);

    // Verify changes were saved to database
    const recommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, recommendationId))
      .execute();

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].title).toEqual('Database Test Title');
    expect(recommendations[0].priority).toEqual('high');
    expect(recommendations[0].description).toEqual('Original description');
  });

  it('should throw error for non-existent recommendation', async () => {
    const input: UpdateRecommendationInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent UUID
      title: 'Should Fail'
    };

    await expect(updateRecommendation(input)).rejects.toThrow(/not found/i);
  });
});
