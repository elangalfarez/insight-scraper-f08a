
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { type BulkCreateRecommendationsInput, type Recommendation } from '../schema';

export const bulkCreateRecommendations = async (input: BulkCreateRecommendationsInput): Promise<Recommendation[]> => {
  try {
    // Handle empty array case
    if (input.recommendations.length === 0) {
      return [];
    }

    // Insert recommendations in bulk
    const result = await db.insert(recommendationsTable)
      .values(input.recommendations.map(rec => ({
        query_id: rec.query_id,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        related_keywords: rec.related_keywords, // JSONB column - no conversion needed
        frequency_score: rec.frequency_score.toString() // Convert number to string for numeric column
      })))
      .returning()
      .execute();

    // Convert numeric fields back to numbers and handle JSONB properly
    return result.map(rec => ({
      ...rec,
      frequency_score: parseFloat(rec.frequency_score), // Convert string back to number
      related_keywords: rec.related_keywords as string[] // Type assertion for JSONB field
    }));
  } catch (error) {
    console.error('Bulk recommendations creation failed:', error);
    throw error;
  }
};
