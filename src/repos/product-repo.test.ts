import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import productDataUtils from "../utils/product-data-utils";
import productsJson from "../../products.json";
import productsWithCurrenciesJson from "../../products-currencies.json";
import productRepo from "./product-repo";
import { JsonProductsList } from "../types";

describe("product-repo", () => {
  const addProducts = () => {
    return [
      productRepo.insertProduct(
        "00000000-0000-0000-0000-000000000000",
        "Product 1",
        "Description",
        "[hash]"
      ),
      productRepo.insertProduct(
        "00000000-0000-0000-0000-000000000001",
        "Product 2",
        "Prescription",
        "[hash]"
      ),
      productRepo.insertProduct(
        "00000000-0000-0000-0000-000000000002",
        "Product 3",
        "Mmmmmm",
        "[hash]"
      ),
    ];
  };

  const addCategories = () => {
    productRepo.insertCategory(
      "00000000-0000-0000-0000-10000000000",
      "Fallout",
      undefined
    );
    productRepo.insertCategory(
      "00000000-0000-0000-0000-20000000000",
      "Sonic",
      "00000000-0000-0000-0000-10000000000"
    );
    productRepo.insertCategory(
      "00000000-0000-0000-0000-30000000000",
      "Duke Nukem 3D",
      "00000000-0000-0000-0000-10000000000"
    );
    productRepo.insertCategory(
      "00000000-0000-0000-0000-40000000000",
      "Bike Baron",
      "00000000-0000-0000-0000-20000000000"
    );
    productRepo.insertCategory(
      "00000000-0000-0000-0000-50000000000",
      "Quake", // I know very little about games 😅
      "00000000-0000-0000-0000-20000000000"
    );
  };

  const deleteTables = () => {
    productRepo.connection.database.exec("DROP TABLE IF EXISTS product");
    productRepo.connection.database.exec("DROP TABLE IF EXISTS category");
  };

  beforeEach(() => {
    deleteTables();
    productRepo.connection.migrate();
  });

  it("ad hoc migratation works", () => {
    assert.strictEqual(productRepo.getAllProducts().length, 0);
  });

  it("inserts products", () => {
    addProducts();

    const products = productRepo.getAllProducts();
    assert.strictEqual(products.length, 3);
  });

  it("adds categories", () => {
    addProducts();

    const products = productRepo.getAllProducts();
    assert.strictEqual(products.length, 3);

    const categories = productRepo.getAllCategories();
    assert.strictEqual(categories.length, 1);
    assert.strictEqual(categories[0].name, "Root");
  });

  it("Adds new categories under the root category", () => {
    addCategories();

    const categories = productRepo.getAllCategories();
    assert.strictEqual(categories.length, 6);
    assert.strictEqual(categories[1].name, "Fallout");
    assert.strictEqual(categories[1].parent_id, 1);

    // Check categories hiearchy, root should have one child, and categories 2 and 3 two children.
    assert.deepEqual(
      categories.map((category) => {
        return { id: category.id, parent_id: category.parent_id };
      }),
      [
        { id: 1, parent_id: null },
        { id: 2, parent_id: 1 },
        { id: 3, parent_id: 2 },
        { id: 4, parent_id: 2 },
        { id: 5, parent_id: 3 },
        { id: 6, parent_id: 3 },
      ]
    );
  });

  it("stores variations", () => {
    const productIds = addProducts();
    const products = productsJson as unknown as JsonProductsList;
    let variations = productDataUtils.parseVariations(
      products.products[0].variations
    );

    const result = productRepo.insertVariations(productIds[0], variations);

    assert.strictEqual(result.length, 3);
  });

  it("variations have currencies", () => {
    const productIds = addProducts();
    const products = productsWithCurrenciesJson as unknown as JsonProductsList;
    let variations = productDataUtils.parseVariations(
      products.products[0].variations
    );

    const result = productRepo.insertVariations(productIds[0], variations);

    assert.strictEqual(result.length, 3);

    const variant = productRepo.getVariant(productIds[0]);

    assert.deepEqual(variant[0], {
      id: 1,
      product_id: 1,
      type: "size",
      value: "S",
      price: 25,
      currency: "EUR",
    });
  });
});
