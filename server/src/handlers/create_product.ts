
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        query_id: input.query_id,
        name: input.name,
        url: input.url,
        platform: input.platform,
        image_url: input.image_url || null,
        price: input.price !== undefined ? input.price.toString() : null, // Convert number to string for numeric column
        average_rating: input.average_rating !== undefined ? input.average_rating.toString() : null, // Convert number to string for numeric column
        total_reviews: input.total_reviews || 0
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: product.price !== null ? parseFloat(product.price) : null, // Convert string back to number
      average_rating: product.average_rating !== null ? parseFloat(product.average_rating) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
