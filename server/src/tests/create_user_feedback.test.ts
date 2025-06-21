
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable } from '../db/schema';
import { createUserFeedback, type CreateUserFeedbackInput } from '../handlers/create_user_feedback';

describe('createUserFeedback', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create user feedback for existing query', async () => {
    // Create a test query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })
      .returning()
      .execute();

    const query = queryResult[0];

    const input: CreateUserFeedbackInput = {
      query_id: query.id,
      feedback: 'This analysis was very helpful'
    };

    const result = await createUserFeedback(input);

    expect(result.query_id).toEqual(query.id);
    expect(result.feedback).toEqual('This analysis was very helpful');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent query', async () => {
    const input: CreateUserFeedbackInput = {
      query_id: crypto.randomUUID(),
      feedback: 'Test feedback'
    };

    await expect(createUserFeedback(input)).rejects.toThrow('Query not found');
  });
});
