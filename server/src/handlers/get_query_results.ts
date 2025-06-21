
import { db } from '../db';
import { productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Product, type Review, type Keyword, type Recommendation } from '../schema';

export interface QueryResults {
  products: Product[];
  reviews: Review[];
  keywords: Keyword[];
  recommendations: Recommendation[];
}

export const getQueryResults = async (queryId: string): Promise<QueryResults> => {
  try {
    // Get all products for the query
    const productsResult = await db.select()
      .from(productsTable)
      .where(eq(productsTable.query_id, queryId))
      .execute();

    const products: Product[] = productsResult.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      average_rating: product.average_rating ? parseFloat(product.average_rating) : null
    }));

    // Get all product IDs for this query to fetch reviews
    const productIds = products.map(p => p.id);

    // Get all reviews for the products (empty array if no products)
    let reviews: Review[] = [];
    if (productIds.length > 0) {
      const reviewsResult = await db.select()
        .from(reviewsTable)
        .where(eq(reviewsTable.product_id, productIds[0])) // Start with first product
        .execute();

      // Get reviews for all products if we have multiple
      if (productIds.length > 1) {
        for (let i = 1; i < productIds.length; i++) {
          const additionalReviews = await db.select()
            .from(reviewsTable)
            .where(eq(reviewsTable.product_id, productIds[i]))
            .execute();
          reviewsResult.push(...additionalReviews);
        }
      }

      reviews = reviewsResult;
    }

    // Get all keywords for the query
    const keywordsResult = await db.select()
      .from(keywordsTable)
      .where(eq(keywordsTable.query_id, queryId))
      .execute();

    const keywords: Keyword[] = keywordsResult;

    // Get all recommendations for the query
    const recommendationsResult = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.query_id, queryId))
      .execute();

    const recommendations: Recommendation[] = recommendationsResult.map(rec => ({
      ...rec,
      related_keywords: rec.related_keywords as string[],
      frequency_score: parseFloat(rec.frequency_score)
    }));

    return {
      products,
      reviews,
      keywords,
      recommendations
    };
  } catch (error) {
    console.error('Failed to get query results:', error);
    throw error;
  }
};
