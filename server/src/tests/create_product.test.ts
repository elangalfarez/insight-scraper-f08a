
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, queriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

describe('createProduct', () => {
  let testQueryId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite query record
    const queryResult = await db.insert(queriesTable)
      .values({
        input: 'test product search',
        query_type: 'keyword',
        platform: 'shopee',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })
      .returning()
      .execute();
    
    testQueryId = queryResult[0].id;
  });

  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const testInput: CreateProductInput = {
      query_id: testQueryId,
      name: 'Test Product',
      url: 'https://shopee.com/test-product',
      platform: 'shopee',
      image_url: 'https://example.com/image.jpg',
      price: 19.99,
      average_rating: 4.5,
      total_reviews: 100
    };

    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.url).toEqual('https://shopee.com/test-product');
    expect(result.platform).toEqual('shopee');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toBe('number');
    expect(result.average_rating).toEqual(4.5);
    expect(typeof result.average_rating).toBe('number');
    expect(result.total_reviews).toEqual(100);
    expect(result.query_id).toEqual(testQueryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields', async () => {
    const testInput: CreateProductInput = {
      query_id: testQueryId,
      name: 'Minimal Product',
      url: 'https://shopee.com/minimal-product',
      platform: 'tiktok_shop'
    };

    const result = await createProduct(testInput);

    expect(result.name).toEqual('Minimal Product');
    expect(result.url).toEqual('https://shopee.com/minimal-product');
    expect(result.platform).toEqual('tiktok_shop');
    expect(result.image_url).toBeNull();
    expect(result.price).toBeNull();
    expect(result.average_rating).toBeNull();
    expect(result.total_reviews).toEqual(0);
    expect(result.query_id).toEqual(testQueryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const testInput: CreateProductInput = {
      query_id: testQueryId,
      name: 'Database Test Product',
      url: 'https://tokopedia.com/test-product',
      platform: 'tokopedia',
      price: 25.50,
      average_rating: 3.8,
      total_reviews: 50
    };

    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Test Product');
    expect(products[0].url).toEqual('https://tokopedia.com/test-product');
    expect(products[0].platform).toEqual('tokopedia');
    expect(parseFloat(products[0].price!)).toEqual(25.50);
    expect(parseFloat(products[0].average_rating!)).toEqual(3.8);
    expect(products[0].total_reviews).toEqual(50);
    expect(products[0].query_id).toEqual(testQueryId);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle products with zero values', async () => {
    const testInput: CreateProductInput = {
      query_id: testQueryId,
      name: 'Zero Values Product',
      url: 'https://shopee.com/zero-product',
      platform: 'shopee',
      price: 0,
      average_rating: 0,
      total_reviews: 0
    };

    const result = await createProduct(testInput);

    expect(result.price).toEqual(0);
    expect(typeof result.price).toBe('number');
    expect(result.average_rating).toEqual(0);
    expect(typeof result.average_rating).toBe('number');
    expect(result.total_reviews).toEqual(0);
  });

  it('should fail when query_id does not exist', async () => {
    const nonExistentQueryId = '00000000-0000-0000-0000-000000000000';
    const testInput: CreateProductInput = {
      query_id: nonExistentQueryId,
      name: 'Invalid Query Product',
      url: 'https://shopee.com/invalid-product',
      platform: 'shopee'
    };

    await expect(createProduct(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
