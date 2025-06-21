
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { priorityEnum } from '../schema';

// Input schema for updating a recommendation
export const updateRecommendationInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  related_keywords: z.array(z.string()).optional(),
  frequency_score: z.number().optional()
});

export type UpdateRecommendationInput = z.infer<typeof updateRecommendationInputSchema>;

export const updateRecommendation = async (input: UpdateRecommendationInput) => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    
    if (input.related_keywords !== undefined) {
      updateData.related_keywords = input.related_keywords;
    }
    
    if (input.frequency_score !== undefined) {
      updateData.frequency_score = input.frequency_score.toString();
    }

    // Update the recommendation
    const result = await db.update(recommendationsTable)
      .set(updateData)
      .where(eq(recommendationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Recommendation not found');
    }

    // Convert numeric fields back to numbers before returning
    const recommendation = result[0];
    return {
      ...recommendation,
      frequency_score: parseFloat(recommendation.frequency_score),
      related_keywords: recommendation.related_keywords as string[]
    };
  } catch (error) {
    console.error('Recommendation update failed:', error);
    throw error;
  }
};
