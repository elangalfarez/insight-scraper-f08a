
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { type Recommendation } from '../schema';
import { eq } from 'drizzle-orm';

export const getRecommendation = async (id: string): Promise<Recommendation | null> => {
  try {
    const results = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const recommendation = results[0];
    return {
      ...recommendation,
      frequency_score: parseFloat(recommendation.frequency_score), // Convert numeric to number
      related_keywords: recommendation.related_keywords as string[] // Cast jsonb to string array
    };
  } catch (error) {
    console.error('Failed to get recommendation:', error);
    throw error;
  }
};
