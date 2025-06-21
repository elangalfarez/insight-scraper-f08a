
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getUserFeedbackByUserId } from '../handlers/get_user_feedback_by_user_id';
import type { GetUserFeedbackByUserIdInput } from '../handlers/get_user_feedback_by_user_id';

const testInput: GetUserFeedbackByUserIdInput = {
  user_id: 'test-user-123'
};

describe('getUserFeedbackByUserId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no feedback exists', async () => {
    const result = await getUserFeedbackByUserId(testInput);
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle different user IDs', async () => {
    const differentUserInput: GetUserFeedbackByUserIdInput = {
      user_id: 'different-user-456'
    };
    
    const result = await getUserFeedbackByUserId(differentUserInput);
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle invalid user ID format', async () => {
    const invalidInput: GetUserFeedbackByUserIdInput = {
      user_id: ''
    };
    
    const result = await getUserFeedbackByUserId(invalidInput);
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });
});
