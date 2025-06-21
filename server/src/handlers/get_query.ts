
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { type QueryResult } from '../schema';
import { eq } from 'drizzle-orm';

export const getQuery = async (id: string): Promise<QueryResult> => {
  try {
    // Get the main query
    const queries = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, id))
      .execute();

    if (queries.length === 0) {
      throw new Error(`Query with id ${id} not found`);
    }

    const query = queries[0];

    // Get all related products
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.query_id, id))
      .execute();

    // Get all related reviews through products
    const productIds = products.map(p => p.id);
    let reviews: any[] = [];
    if (productIds.length > 0) {
      reviews = await db.select()
        .from(reviewsTable)
        .where(eq(reviewsTable.product_id, productIds[0]))
        .execute();
      
      // For multiple products, we need to get reviews for each
      if (productIds.length > 1) {
        for (let i = 1; i < productIds.length; i++) {
          const productReviews = await db.select()
            .from(reviewsTable)
            .where(eq(reviewsTable.product_id, productIds[i]))
            .execute();
          reviews = reviews.concat(productReviews);
        }
      }
    }

    // Get all related keywords
    const keywords = await db.select()
      .from(keywordsTable)
      .where(eq(keywordsTable.query_id, id))
      .execute();

    // Get all related recommendations
    const recommendations = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.query_id, id))
      .execute();

    // Convert numeric fields and format data
    const formattedQuery = {
      ...query,
      average_rating: query.average_rating ? parseFloat(query.average_rating) : null,
      sentiment_summary: query.sentiment_positive !== null && 
                        query.sentiment_neutral !== null && 
                        query.sentiment_negative !== null ? {
        positive: query.sentiment_positive,
        neutral: query.sentiment_neutral,
        negative: query.sentiment_negative
      } : null
    };

    const formattedProducts = products.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      average_rating: product.average_rating ? parseFloat(product.average_rating) : null
    }));

    const formattedRecommendations = recommendations.map(rec => ({
      ...rec,
      frequency_score: parseFloat(rec.frequency_score),
      related_keywords: Array.isArray(rec.related_keywords) ? 
        rec.related_keywords as string[] : []
    }));

    return {
      query: formattedQuery,
      products: formattedProducts,
      reviews: reviews,
      keywords: keywords,
      recommendations: formattedRecommendations
    };
  } catch (error) {
    console.error('Query retrieval failed:', error);
    throw error;
  }
};
