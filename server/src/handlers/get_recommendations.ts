
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { type Recommendation } from '../schema';

export const getRecommendations = async (): Promise<Recommendation[]> => {
  try {
    const results = await db.select()
      .from(recommendationsTable)
      .execute();

    return results.map(recommendation => ({
      ...recommendation,
      frequency_score: parseFloat(recommendation.frequency_score),
      related_keywords: recommendation.related_keywords as string[]
    }));
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    throw error;
  }
};
