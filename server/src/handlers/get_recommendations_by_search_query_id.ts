
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Recommendation } from '../schema';

export const getRecommendationsBySearchQueryId = async (query_id: string): Promise<Recommendation[]> => {
  try {
    const results = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.query_id, query_id))
      .execute();

    return results.map(recommendation => ({
      ...recommendation,
      frequency_score: parseFloat(recommendation.frequency_score), // Convert numeric to number
      related_keywords: recommendation.related_keywords as string[] // Cast jsonb to string array
    }));
  } catch (error) {
    console.error('Failed to get recommendations by query ID:', error);
    throw error;
  }
};
