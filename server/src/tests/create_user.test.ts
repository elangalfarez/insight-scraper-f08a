
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { uuid, text, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Define user table inline to match handler
const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define input schema inline
const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

type CreateUserInput = z.infer<typeof createUserInputSchema>;

const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique email constraint', async () => {
    await createUser(testInput);

    await expect(createUser(testInput))
      .rejects.toThrow(/duplicate key value/i);
  });
});
