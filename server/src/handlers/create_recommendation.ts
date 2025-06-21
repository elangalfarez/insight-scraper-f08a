
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { type Recommendation } from '../schema';

// Define input type that matches the bulk create pattern
export type CreateRecommendationInput = {
  query_id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  related_keywords: string[];
  frequency_score: number;
};

export const createRecommendation = async (input: CreateRecommendationInput): Promise<Recommendation> => {
  try {
    // Insert recommendation record
    const result = await db.insert(recommendationsTable)
      .values({
        query_id: input.query_id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        related_keywords: input.related_keywords, // jsonb column accepts array directly
        frequency_score: input.frequency_score.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const recommendation = result[0];
    return {
      ...recommendation,
      frequency_score: parseFloat(recommendation.frequency_score), // Convert string back to number
      related_keywords: recommendation.related_keywords as string[] // Type assertion for jsonb
    };
  } catch (error) {
    console.error('Recommendation creation failed:', error);
    throw error;
  }
};
