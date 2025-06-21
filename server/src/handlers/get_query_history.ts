
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type QueryHistoryItem } from '../schema';
import { desc } from 'drizzle-orm';

export const getQueryHistory = async (): Promise<QueryHistoryItem[]> => {
  try {
    const results = await db.select({
      id: queriesTable.id,
      input: queriesTable.input,
      query_type: queriesTable.query_type,
      platform: queriesTable.platform,
      status: queriesTable.status,
      total_products_found: queriesTable.total_products_found,
      total_reviews_scraped: queriesTable.total_reviews_scraped,
      created_at: queriesTable.created_at
    })
    .from(queriesTable)
    .orderBy(desc(queriesTable.created_at))
    .execute();

    return results;
  } catch (error) {
    console.error('Query history retrieval failed:', error);
    throw error;
  }
};
