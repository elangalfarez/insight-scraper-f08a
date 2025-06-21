
import { db } from '../db';
import { queriesTable, productsTable, reviewsTable, keywordsTable, recommendationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Query, type Product, type Review, type Keyword, type Recommendation } from '../schema';

export interface QueryDetails {
  query: Query;
  products: Product[];
  reviews: Review[];
  keywords: Keyword[];
  recommendations: Recommendation[];
}

export interface GetQueryDetailsInput {
  id: string;
}

export const getQueryDetails = async (input: GetQueryDetailsInput): Promise<QueryDetails> => {
  try {
    // Get the query
    const queryResults = await db.select()
      .from(queriesTable)
      .where(eq(queriesTable.id, input.id))
      .execute();

    if (queryResults.length === 0) {
      throw new Error('Query not found');
    }

    const queryData = queryResults[0];

    // Convert query data to match schema
    const query: Query = {
      ...queryData,
      average_rating: queryData.average_rating ? parseFloat(queryData.average_rating) : null,
      sentiment_summary: {
        positive: queryData.sentiment_positive || 0,
        neutral: queryData.sentiment_neutral || 0,
        negative: queryData.sentiment_negative || 0
      }
    };

    // Get products for this query
    const productResults = await db.select()
      .from(productsTable)
      .where(eq(productsTable.query_id, input.id))
      .execute();

    const products: Product[] = productResults.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      average_rating: product.average_rating ? parseFloat(product.average_rating) : null
    }));

    // Get all reviews for products in this query
    const productIds = products.map(p => p.id);
    let reviews: Review[] = [];

    if (productIds.length > 0) {
      const reviewResults = await db.select()
        .from(reviewsTable)
        .where(eq(reviewsTable.product_id, productIds[0])) // Start with first product
        .execute();

      // If there are multiple products, we need to get reviews for all of them
      if (productIds.length > 1) {
        for (let i = 1; i < productIds.length; i++) {
          const additionalReviews = await db.select()
            .from(reviewsTable)
            .where(eq(reviewsTable.product_id, productIds[i]))
            .execute();
          reviewResults.push(...additionalReviews);
        }
      }

      reviews = reviewResults.map(review => ({
        ...review,
        created_at: review.created_at,
        review_date: review.review_date
      }));
    }

    // Get keywords for this query
    const keywordResults = await db.select()
      .from(keywordsTable)
      .where(eq(keywordsTable.query_id, input.id))
      .execute();

    const keywords: Keyword[] = keywordResults.map(keyword => ({
      ...keyword
    }));

    // Get recommendations for this query
    const recommendationResults = await db.select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.query_id, input.id))
      .execute();

    const recommendations: Recommendation[] = recommendationResults.map(rec => ({
      ...rec,
      frequency_score: parseFloat(rec.frequency_score),
      related_keywords: Array.isArray(rec.related_keywords) ? rec.related_keywords : []
    }));

    return {
      query,
      products,
      reviews,
      keywords,
      recommendations
    };
  } catch (error) {
    console.error('Get query details failed:', error);
    throw error;
  }
};
