
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, recommendationsTable } from '../db/schema';
import { getRecommendations } from '../handlers/get_recommendations';

describe('getRecommendations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recommendations exist', async () => {
    const result = await getRecommendations();

    expect(result).toEqual([]);
  });

  it('should return all recommendations', async () => {
    // Create a query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create test recommendations
    await db.insert(recommendationsTable)
      .values([
        {
          query_id: queryId,
          title: 'First Recommendation',
          description: 'First test recommendation',
          priority: 'high',
          related_keywords: ['keyword1', 'keyword2'],
          frequency_score: '95.50'
        },
        {
          query_id: queryId,
          title: 'Second Recommendation',
          description: 'Second test recommendation',
          priority: 'medium',
          related_keywords: ['keyword3'],
          frequency_score: '75.25'
        }
      ])
      .execute();

    const result = await getRecommendations();

    expect(result).toHaveLength(2);
    
    // Check first recommendation
    const firstRec = result.find(r => r.title === 'First Recommendation');
    expect(firstRec).toBeDefined();
    expect(firstRec!.query_id).toEqual(queryId);
    expect(firstRec!.description).toEqual('First test recommendation');
    expect(firstRec!.priority).toEqual('high');
    expect(firstRec!.related_keywords).toEqual(['keyword1', 'keyword2']);
    expect(firstRec!.frequency_score).toEqual(95.50);
    expect(typeof firstRec!.frequency_score).toEqual('number');
    expect(firstRec!.id).toBeDefined();
    expect(firstRec!.created_at).toBeInstanceOf(Date);

    // Check second recommendation
    const secondRec = result.find(r => r.title === 'Second Recommendation');
    expect(secondRec).toBeDefined();
    expect(secondRec!.query_id).toEqual(queryId);
    expect(secondRec!.description).toEqual('Second test recommendation');
    expect(secondRec!.priority).toEqual('medium');
    expect(secondRec!.related_keywords).toEqual(['keyword3']);
    expect(secondRec!.frequency_score).toEqual(75.25);
    expect(typeof secondRec!.frequency_score).toEqual('number');
  });

  it('should handle recommendations with empty related_keywords array', async () => {
    // Create a query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        expires_at: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const queryId = queryResult[0].id;

    // Create recommendation with empty keywords array
    await db.insert(recommendationsTable)
      .values({
        query_id: queryId,
        title: 'Empty Keywords Recommendation',
        description: 'Recommendation with no keywords',
        priority: 'low',
        related_keywords: [],
        frequency_score: '10.00'
      })
      .execute();

    const result = await getRecommendations();

    expect(result).toHaveLength(1);
    expect(result[0].related_keywords).toEqual([]);
    expect(result[0].frequency_score).toEqual(10.00);
  });
});
