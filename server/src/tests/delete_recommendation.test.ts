
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { deleteRecommendation } from '../handlers/delete_recommendation';
import { eq } from 'drizzle-orm';

describe('deleteRecommendation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a recommendation', async () => {
    // Create test query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 86400000) // 24 hours from now
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create test recommendation
    const recommendationResult = await db.insert(recommendationsTable)
      .values({
        query_id: queryId,
        title: 'Test Recommendation',
        description: 'A test recommendation',
        priority: 'high',
        related_keywords: ['test', 'keyword'],
        frequency_score: '85.5' // Convert to string for numeric column
      })
      .returning()
      .execute();

    const recommendationId = recommendationResult[0].id;

    // Delete the recommendation
    await deleteRecommendation(recommendationId);

    // Verify deletion
    const recommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, recommendationId))
      .execute();

    expect(recommendations).toHaveLength(0);
  });

  it('should handle deletion of non-existent recommendation', async () => {
    const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

    // Should not throw error for non-existent ID
    await expect(deleteRecommendation(nonExistentId)).resolves.toBeUndefined();
  });

  it('should not affect other recommendations when deleting one', async () => {
    // Create test query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create two test recommendations
    const recommendationResults = await db.insert(recommendationsTable)
      .values([
        {
          query_id: queryId,
          title: 'First Recommendation',
          description: 'First test recommendation',
          priority: 'high',
          related_keywords: ['first', 'test'],
          frequency_score: '85.5' // Convert to string for numeric column
        },
        {
          query_id: queryId,
          title: 'Second Recommendation',
          description: 'Second test recommendation',
          priority: 'medium',
          related_keywords: ['second', 'test'],
          frequency_score: '75.2' // Convert to string for numeric column
        }
      ])
      .returning()
      .execute();

    const firstId = recommendationResults[0].id;
    const secondId = recommendationResults[1].id;

    // Delete first recommendation
    await deleteRecommendation(firstId);

    // Verify first is deleted
    const firstRecommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, firstId))
      .execute();

    expect(firstRecommendations).toHaveLength(0);

    // Verify second still exists
    const secondRecommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, secondId))
      .execute();

    expect(secondRecommendations).toHaveLength(1);
    expect(secondRecommendations[0].title).toEqual('Second Recommendation');
  });
});
