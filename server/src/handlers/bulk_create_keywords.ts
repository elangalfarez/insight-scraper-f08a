
import { db } from '../db';
import { keywordsTable } from '../db/schema';
import { type BulkCreateKeywordsInput, type Keyword } from '../schema';

export const bulkCreateKeywords = async (input: BulkCreateKeywordsInput): Promise<Keyword[]> => {
  try {
    // Handle empty array case
    if (input.keywords.length === 0) {
      return [];
    }

    // Insert all keywords
    const result = await db.insert(keywordsTable)
      .values(input.keywords)
      .returning()
      .execute();

    return result;
  } catch (error) {
    console.error('Bulk keywords creation failed:', error);
    throw error;
  }
};
