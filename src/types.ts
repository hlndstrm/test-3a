import { UUID } from "crypto";

/**
 * Types for the JSON data that the API returns.
 */
type JsonCategory = {
  id: UUID;
  name: string;
};

type JsonVariantType = "size" | "paper size" | "color";
type JsonVariantPrice = "price";
type JsonVariantCurrency = "currency";

type JsonProduct = {
  id: UUID;
  name: string;
  description: string;
  categories: JsonCategory[];
  variations: Record<
    JsonVariantType | JsonVariantPrice | JsonVariantCurrency,
    string
  >[];
};

type JsonProductsList = {
  products: JsonProduct[];
  results: number;
};

/**
 * Internal types for the database.
 */
type Product = {
  id?: Number;
  external_id?: UUID;
  name: string;
  description: string;
  hash: string;
};

type Category = {
  id: Number;
  parent_id?: Number;
  external_id?: UUID;
  name: string;
};

type Variant = {
  id?: Number;
  type?: string;
  value?: string;
  price: number;
  currency?: string;
};

export type {
  JsonCategory,
  JsonProduct,
  JsonProductsList,
  JsonVariantType,
  JsonVariantPrice,
  JsonVariantCurrency,
  Category,
  Product,
  Variant,
};
