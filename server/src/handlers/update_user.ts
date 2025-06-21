
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface UpdateProductInput {
  id: string;
  name?: string;
  url?: string;
  image_url?: string | null;
  price?: number | null;
  average_rating?: number | null;
  total_reviews?: number;
}

export interface Product {
  id: string;
  query_id: string;
  name: string;
  url: string;
  platform: 'shopee' | 'tiktok_shop' | 'tokopedia';
  image_url: string | null;
  price: number | null;
  average_rating: number | null;
  total_reviews: number;
  created_at: Date;
  updated_at: Date;
}

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }
    if (input.price !== undefined) {
      updateData.price = input.price !== null ? input.price.toString() : null;
    }
    if (input.average_rating !== undefined) {
      updateData.average_rating = input.average_rating !== null ? input.average_rating.toString() : null;
    }
    if (input.total_reviews !== undefined) {
      updateData.total_reviews = input.total_reviews;
    }

    // Update product record
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Product not found');
    }

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      average_rating: product.average_rating ? parseFloat(product.average_rating) : null
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
