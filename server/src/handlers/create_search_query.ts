
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type CreateQueryInput, type Query } from '../schema';

export const createSearchQuery = async (input: CreateQueryInput): Promise<Query> => {
  try {
    // Insert query record
    const result = await db.insert(queriesTable)
      .values({
        input: input.input,
        query_type: input.query_type,
        platform: input.platform || null,
        expires_at: input.expires_at
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
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
    console.error('Query creation failed:', error);
    throw error;
  }
};
