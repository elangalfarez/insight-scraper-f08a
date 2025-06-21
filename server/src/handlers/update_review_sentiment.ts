
import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type UpdateReviewSentimentInput, type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const updateReviewSentiment = async (input: UpdateReviewSentimentInput): Promise<Review> => {
  try {
    // Update the review sentiment
    const result = await db.update(reviewsTable)
      .set({
        sentiment: input.sentiment
      })
      .where(eq(reviewsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Review not found');
    }

    // Return the updated review (no numeric conversions needed for this table)
    return result[0];
  } catch (error) {
    console.error('Review sentiment update failed:', error);
    throw error;
  }
};
