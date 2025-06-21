
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { cleanupExpiredQueries } from '../handlers/cleanup_expired_queries';

describe('cleanupExpiredQueries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete expired queries', async () => {
    // Create expired query (1 hour ago)
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() - 1);

    await db.insert(queriesTable)
      .values({
        input: 'expired query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: expiredDate
      })
      .execute();

    // Create non-expired query (1 hour from now)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    await db.insert(queriesTable)
      .values({
        input: 'active query',
        query_type: 'keyword',
        platform: 'tiktok_shop',
        expires_at: futureDate
      })
      .execute();

    // Run cleanup
    const result = await cleanupExpiredQueries();

    // Should delete 1 expired query
    expect(result.deletedCount).toEqual(1);

    // Verify only active query remains
    const remainingQueries = await db.select()
      .from(queriesTable)
      .execute();

    expect(remainingQueries).toHaveLength(1);
    expect(remainingQueries[0].input).toEqual('active query');
  });

  it('should return zero when no expired queries exist', async () => {
    // Create only non-expired query
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    await db.insert(queriesTable)
      .values({
        input: 'active query',
        query_type: 'url',
        expires_at: futureDate
      })
      .execute();

    // Run cleanup
    const result = await cleanupExpiredQueries();

    // Should delete nothing
    expect(result.deletedCount).toEqual(0);

    // Verify query still exists
    const queries = await db.select()
      .from(queriesTable)
      .execute();

    expect(queries).toHaveLength(1);
    expect(queries[0].input).toEqual('active query');
  });

  it('should handle empty database', async () => {
    // Run cleanup on empty database
    const result = await cleanupExpiredQueries();

    // Should delete nothing
    expect(result.deletedCount).toEqual(0);

    // Verify database is still empty
    const queries = await db.select()
      .from(queriesTable)
      .execute();

    expect(queries).toHaveLength(0);
  });

  it('should delete multiple expired queries', async () => {
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() - 2);

    // Create multiple expired queries
    const expiredQueries = [
      {
        input: 'expired query 1',
        query_type: 'keyword' as const,
        platform: 'shopee' as const,
        expires_at: expiredDate
      },
      {
        input: 'expired query 2',
        query_type: 'url' as const,
        expires_at: expiredDate
      },
      {
        input: 'expired query 3',
        query_type: 'keyword' as const,
        platform: 'tokopedia' as const,
        expires_at: expiredDate
      }
    ];

    for (const query of expiredQueries) {
      await db.insert(queriesTable)
        .values(query)
        .execute();
    }

    // Run cleanup
    const result = await cleanupExpiredQueries();

    // Should delete all 3 expired queries
    expect(result.deletedCount).toEqual(3);

    // Verify database is empty
    const queries = await db.select()
      .from(queriesTable)
      .execute();

    expect(queries).toHaveLength(0);
  });
});
