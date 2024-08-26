/**
 * Entry point for the app.
 */

import productDataUtils from "./utils/product-data-utils.ts";
import productRepo from "./repos/product-repo.ts";
import { JsonProduct } from "./types.ts";
import { UUID } from "node:crypto";

let productData;

/**
 * Fetch the product data from the API.
 */
try {
  productData = await productDataUtils.getProductData();
} catch (error) {
  console.error("Error fetching product data", error);
}

/**
 * Insert the product data into the database.
 *
 * There's a few steps, one for each database table.
 */
const insert = productData.products.map(async (product: JsonProduct) => {
  /**
   * First check if the product needs an update or can be skipped.
   */
  const hash = await productDataUtils.getProductHash(product);
  const previousProduct = productRepo.getProductWithExternalId(product.id);

  if (previousProduct && previousProduct.hash === hash) {
    // If the product isn't updated, skip it.
    return;
  }

  /**
   * Insert the basic product into the database.
   */
  const productId: Number = productRepo.insertProduct(
    product.id,
    product.name,
    product.description,
    hash
  );

  /**
   * Add categories to the product.
   *
   * Don't add a parent category for the top level category. The root
   * category will be added automatically.
   */
  let parentCategoryId: UUID | undefined = undefined;
  const categories = product.categories.map((category) => {
    const categoryId = productRepo.insertCategory(
      category.id,
      category.name,
      parentCategoryId === undefined ? undefined : parentCategoryId
    );
    parentCategoryId = category.id;

    productRepo.addToCategory(categoryId, productId);

    return categoryId;
  });

  /**
   * Last add all the variations to the product.
   */
  const parsedVariations = productDataUtils.parseVariations(product.variations);
  const variations = productRepo.insertVariations(productId, parsedVariations);

  return { id: productId, categories, name: product.name, variations };
});

/**
 * A simple print for debugging or testing.
 */
await Promise.all(insert);
console.log(`Inserted ${insert.length} products: `, insert);
