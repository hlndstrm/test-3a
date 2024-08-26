import assert from "node:assert";
import { describe, it, mock } from "node:test";
import productsWithCurrenciesJson from "../../products-currencies.json";
import productsJson from "../../products.json";
import getProductJson from "./product-api";
import productDataUtils from "./product-data-utils";
import { JsonProductsList } from "../types";

describe("product-data-utils", () => {
  it("parses product json", async () => {
    mock.method(getProductJson, "getProductJson", async () =>
      JSON.stringify(productsJson)
    );

    const result = await productDataUtils.getProductData();
    assert.strictEqual(result.products.length, 3);
  });

  it("parses variants to a structured model", () => {
    const products = productsWithCurrenciesJson as unknown as JsonProductsList;

    let variants = productDataUtils.parseVariations(
      products.products[0].variations
    );
    assert.strictEqual(variants.length, 3);
    assert.deepEqual(variants[0], {
      type: "size",
      value: "S",
      price: 25,
      currency: "NKR",
    });
    assert.deepEqual(variants[1], {
      type: "size",
      value: "M",
      price: 25,
      currency: "USD",
    });
    assert.deepEqual(variants[2], {
      type: "size",
      value: "L",
      price: 25,
      currency: "GBP",
    });

    variants = productDataUtils.parseVariations(
      products.products[1].variations
    );
    assert.strictEqual(variants.length, 1);
    assert.deepEqual(variants[0], { currency: "HKD", price: 14.9 });

    variants = productDataUtils.parseVariations(
      products.products[2].variations
    );
    assert.strictEqual(variants.length, 2);
    assert.deepEqual(variants[0], {
      type: "paper size",
      value: "A1",
      price: 19.9,
      currency: "AUD",
    });
    assert.deepEqual(variants[1], {
      type: "paper size",
      value: "A2",
      price: 16.9,
      currency: "PHP",
    });
  });

  it("hashes product data", async () => {
    const products = productsJson as unknown as JsonProductsList;
    const hash = await productDataUtils.getProductHash(products.products[0]);
    assert.strictEqual(
      hash,
      "4cbd60ba21541517b929f39bc234ae355afaa2bafb668d7cf802042c69af054b"
    );
  });
});
