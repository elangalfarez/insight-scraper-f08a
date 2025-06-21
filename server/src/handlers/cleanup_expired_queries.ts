
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { lt } from 'drizzle-orm';

export const cleanupExpiredQueries = async (): Promise<{ deletedCount: number }> => {
  try {
    const now = new Date();
    
    // Delete expired queries (cascade will handle related records)
    const result = await db.delete(queriesTable)
      .where(lt(queriesTable.expires_at, now))
      .returning({ id: queriesTable.id })
      .execute();

    return {
      deletedCount: result.length
    };
  } catch (error) {
    console.error('Cleanup of expired queries failed:', error);
    throw error;
  }
};
