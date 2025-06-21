
import { db } from '../db';
import { uuid, text, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Define user table inline - will be created dynamically
const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define schemas inline
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

type User = z.infer<typeof userSchema>;
type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Create the table if it doesn't exist
const ensureUserTable = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
  } catch (error) {
    console.error('Failed to create users table:', error);
    throw error;
  }
};

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Ensure table exists first
    await ensureUserTable();
    
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
