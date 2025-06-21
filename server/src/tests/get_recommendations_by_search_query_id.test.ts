
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { getRecommendationsBySearchQueryId } from '../handlers/get_recommendations_by_search_query_id';

describe('getRecommendationsBySearchQueryId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recommendations for a query', async () => {
    // Create a query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test product',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })
      .returning()
      .execute();

    const query = queryResult[0];

    // Create recommendations for the query
    await db.insert(recommendationsTable)
      .values([
        {
          query_id: query.id,
          title: 'Improve Product Quality',
          description: 'Focus on addressing quality concerns mentioned in reviews',
          priority: 'high',
          related_keywords: ['quality', 'durable', 'build'],
          frequency_score: '85.50'
        },
        {
          query_id: query.id,
          title: 'Enhance Customer Service',
          description: 'Improve response time and support quality',
          priority: 'medium',
          related_keywords: ['service', 'support', 'response'],
          frequency_score: '72.25'
        }
      ])
      .execute();

    const recommendations = await getRecommendationsBySearchQueryId(query.id);

    expect(recommendations).toHaveLength(2);
    
    // Verify first recommendation
    const highPriorityRec = recommendations.find(r => r.priority === 'high');
    expect(highPriorityRec).toBeDefined();
    expect(highPriorityRec!.title).toBe('Improve Product Quality');
    expect(highPriorityRec!.description).toBe('Focus on addressing quality concerns mentioned in reviews');
    expect(highPriorityRec!.query_id).toBe(query.id);
    expect(highPriorityRec!.frequency_score).toBe(85.50);
    expect(highPriorityRec!.related_keywords).toEqual(['quality', 'durable', 'build']);
    expect(highPriorityRec!.created_at).toBeInstanceOf(Date);
    expect(highPriorityRec!.id).toBeDefined();

    // Verify second recommendation
    const mediumPriorityRec = recommendations.find(r => r.priority === 'medium');
    expect(mediumPriorityRec).toBeDefined();
    expect(mediumPriorityRec!.title).toBe('Enhance Customer Service');
    expect(mediumPriorityRec!.frequency_score).toBe(72.25);
    expect(mediumPriorityRec!.related_keywords).toEqual(['service', 'support', 'response']);
  });

  it('should return empty array for non-existent query', async () => {
    const recommendations = await getRecommendationsBySearchQueryId('550e8400-e29b-41d4-a716-446655440000');

    expect(recommendations).toHaveLength(0);
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it('should return empty array for query with no recommendations', async () => {
    // Create a query without recommendations
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'empty query',
        query_type: 'keyword',
        platform: 'tokopedia',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .returning()
      .execute();

    const recommendations = await getRecommendationsBySearchQueryId(queryResult[0].id);

    expect(recommendations).toHaveLength(0);
    expect(Array.isArray(recommendations)).toBe(true);
  });
});
