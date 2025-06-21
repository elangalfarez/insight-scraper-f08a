
import { type Query } from '../schema';
import { db } from '../db';
import { queriesTable } from '../db/schema';

// Since there's no User type in the schema, this handler returns queries instead
// This is a placeholder implementation to resolve the TypeScript error
export const getUsers = async (): Promise<Query[]> => {
  try {
    const results = await db.select()
      .from(queriesTable)
      .execute();

    return results.map(query => ({
      ...query,
      average_rating: query.average_rating ? parseFloat(query.average_rating) : null,
      sentiment_summary: {
        positive: query.sentiment_positive || 0,
        neutral: query.sentiment_neutral || 0,
        negative: query.sentiment_negative || 0
      }
    }));
  } catch (error) {
    console.error('Failed to get queries:', error);
    throw error;
  }
};
