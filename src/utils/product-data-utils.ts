import {
  JsonProduct,
  JsonProductsList,
  JsonVariantCurrency,
  JsonVariantPrice,
  JsonVariantType,
  Variant,
} from "../types.ts";
import productApi from "./product-api.ts";
const { createHmac } = await import("node:crypto");

const HASH_SECRET = "E4E56C5B-63DE-4E29-B2BE-15CBB3A38393";

/**
 * Parse the string into a JSON object.
 *
 * @returns Promise<JsonProductsList>
 */
const getProductData = async (): Promise<JsonProductsList> => {
  const result = await productApi.getProductJson();
  return JSON.parse(result);
};

/**
 * Hash the incoming product JSON.
 *
 * @returns Promise<string>
 */
const getProductHash = async (product: JsonProduct): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hmac = createHmac("sha256", HASH_SECRET);
    let hash = "";
    hmac.on("readable", () => {
      const data = hmac.read();

      if (data) {
        hash = data.toString("hex");
      }
    });
    hmac.write(JSON.stringify(product));
    hmac.end(() => {
      return resolve(hash);
    });
  });
};

/**
 * Parse the variations into a structured model.
 *
 * @param variants Record<JsonVariantType | JsonVariantPrice | JsonVariantCurrency, string>[]
 * @returns Variant[]
 */
const parseVariations = (
  variants: Record<
    JsonVariantType | JsonVariantPrice | JsonVariantCurrency,
    string
  >[]
): Variant[] => {
  return variants.map((variant) => {
    const { price, currency, ...variantField } = variant;
    const label = Object.keys(variantField)[0];

    return {
      ...(label && { type: label }),
      ...(label && { value: variantField[label] }),
      ...(currency && { currency }),
      price: parseFloat(price), // Should this be an integer?
    };
  });
};

export default { getProductData, getProductHash, parseVariations };
