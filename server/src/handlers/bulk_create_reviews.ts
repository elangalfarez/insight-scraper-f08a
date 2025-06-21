
import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type BulkCreateReviewsInput, type Review } from '../schema';

export const bulkCreateReviews = async (input: BulkCreateReviewsInput): Promise<Review[]> => {
  try {
    // Handle empty reviews array
    if (input.reviews.length === 0) {
      return [];
    }

    // Insert all reviews at once
    const result = await db.insert(reviewsTable)
      .values(input.reviews.map(review => ({
        product_id: review.product_id,
        review_text: review.review_text,
        rating: review.rating,
        review_date: review.review_date,
        sentiment: review.sentiment ?? null
      })))
      .returning()
      .execute();

    // Return reviews (no numeric conversions needed - all fields are text/integer/timestamp)
    return result;
  } catch (error) {
    console.error('Bulk review creation failed:', error);
    throw error;
  }
};
