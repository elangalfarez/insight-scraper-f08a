
import { db } from '../db';
import { recommendationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteRecommendation = async (id: string): Promise<void> => {
  try {
    await db.delete(recommendationsTable)
      .where(eq(recommendationsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Delete recommendation failed:', error);
    throw error;
  }
};
