
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { type QueryResult } from '../schema';
import { eq } from 'drizzle-orm';

export const getQuery = async (id: string): Promise<QueryResult | null> => {
  try {
    // Get the main query
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, id))
      .execute();

    if (queries.length === 0) {
      return null;
    }

    const query = queries[0];

    // Get related products
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.query_id, id))
      .execute();

    // Get related reviews
    const reviews = await db.select()
      .from(reviewsTable)
      .innerJoin(productsTable, eq(reviewsTable.product_id, productsTable.id))
      .where(eq(productsTable.query_id, id))
      .execute();

    // Get related keywords
    const keywords = await db.select()
      .from(keywordsTable)
      .where(eq(keywordsTable.query_id, id))
      .execute();

    // Get related recommendations
    const recommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.query_id, id))
      .execute();

    // Convert numeric fields and format the response
    return {
      query: {
        ...query,
        average_rating: query.average_rating ? parseFloat(query.average_rating) : null,
        sentiment_summary: {
          positive: query.sentiment_positive || 0,
          neutral: query.sentiment_neutral || 0,
          negative: query.sentiment_negative || 0
        }
      },
      products: products.map(product => ({
        ...product,
        price: product.price ? parseFloat(product.price) : null,
        average_rating: product.average_rating ? parseFloat(product.average_rating) : null
      })),
      reviews: reviews.map(result => result.reviews),
      keywords: keywords,
      recommendations: recommendations.map(rec => ({
        ...rec,
        frequency_score: parseFloat(rec.frequency_score),
        related_keywords: rec.related_keywords as string[]
      }))
    };
  } catch (error) {
    console.error('Query retrieval failed:', error);
    throw error;
  }
};
