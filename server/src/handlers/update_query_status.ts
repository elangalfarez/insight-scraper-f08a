
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type UpdateQueryStatusInput, type Query } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQueryStatus = async (input: UpdateQueryStatusInput): Promise<Query> => {
  try {
    // Build update values with numeric field conversions
    const updateValues: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Add optional numeric fields with proper string conversion
    if (input.total_products_found !== undefined) {
      updateValues.total_products_found = input.total_products_found;
    }
    if (input.total_reviews_scraped !== undefined) {
      updateValues.total_reviews_scraped = input.total_reviews_scraped;
    }
    if (input.average_rating !== undefined) {
      updateValues.average_rating = input.average_rating.toString();
    }
    if (input.sentiment_positive !== undefined) {
      updateValues.sentiment_positive = input.sentiment_positive;
    }
    if (input.sentiment_neutral !== undefined) {
      updateValues.sentiment_neutral = input.sentiment_neutral;
    }
    if (input.sentiment_negative !== undefined) {
      updateValues.sentiment_negative = input.sentiment_negative;
    }

    // Update the query record
    const result = await db.update(queriesTable)
      .set(updateValues)
      .where(eq(queriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Query with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers for response
    const query = result[0];
    return {
      ...query,
      average_rating: query.average_rating ? parseFloat(query.average_rating) : null,
      sentiment_summary: {
        positive: query.sentiment_positive || 0,
        neutral: query.sentiment_neutral || 0,
        negative: query.sentiment_negative || 0
      }
    };
  } catch (error) {
    console.error('Query status update failed:', error);
    throw error;
  }
};
