
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queriesTable, productsTable } from '../db/schema';
import { updateProduct, type UpdateProductInput } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let queryId: string;
  let productId: string;

  beforeEach(async () => {
    // Create a test query first
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test query',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 86400000) // 24 hours from now
      })
      .returning()
      .execute();
    
    queryId = queryResult[0].id;

    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        query_id: queryId,
        name: 'Original Product',
        url: 'https://example.com/original',
        platform: 'shopee',
        price: '99.99',
        average_rating: '4.5',
        total_reviews: 10
      })
      .returning()
      .execute();

    productId = productResult[0].id;
  });

  it('should update product name', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(input);

    expect(result.name).toEqual('Updated Product Name');
    expect(result.url).toEqual('https://example.com/original'); // Unchanged
    expect(result.price).toEqual(99.99);
    expect(result.average_rating).toEqual(4.5);
    expect(result.total_reviews).toEqual(10);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update product price and rating', async () => {
    const input: UpdateProductInput = {
      id: productId,
      price: 149.99,
      average_rating: 4.8,
      total_reviews: 25
    };

    const result = await updateProduct(input);

    expect(result.name).toEqual('Original Product'); // Unchanged
    expect(result.price).toEqual(149.99);
    expect(result.average_rating).toEqual(4.8);
    expect(result.total_reviews).toEqual(25);
    expect(typeof result.price).toBe('number');
    expect(typeof result.average_rating).toBe('number');
  });

  it('should handle null values for optional fields', async () => {
    const input: UpdateProductInput = {
      id: productId,
      image_url: null,
      price: null,
      average_rating: null
    };

    const result = await updateProduct(input);

    expect(result.image_url).toBeNull();
    expect(result.price).toBeNull();
    expect(result.average_rating).toBeNull();
    expect(result.name).toEqual('Original Product'); // Should remain unchanged
    expect(result.url).toEqual('https://example.com/original'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Database Test Product',
      url: 'https://example.com/updated'
    };

    await updateProduct(input);

    // Verify changes persisted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Test Product');
    expect(products[0].url).toEqual('https://example.com/updated');
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent product', async () => {
    const input: UpdateProductInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent UUID
      name: 'Should Fail'
    };

    await expect(updateProduct(input)).rejects.toThrow(/Product not found/i);
  });

  it('should update only provided fields', async () => {
    const input: UpdateProductInput = {
      id: productId,
      total_reviews: 50
    };

    const result = await updateProduct(input);

    // Only total_reviews should change
    expect(result.total_reviews).toEqual(50);
    expect(result.name).toEqual('Original Product');
    expect(result.url).toEqual('https://example.com/original');
    expect(result.price).toEqual(99.99);
    expect(result.average_rating).toEqual(4.5);
  });
});
