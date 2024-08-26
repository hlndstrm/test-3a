import { UUID } from "crypto";
import { DatabaseSync, StatementResultingChanges } from "node:sqlite";
import { Category, Product, Variant } from "../types";

/**
 * A hardcoded UUID for the root category. There needs to be one for the queries, but it can be
 * anything unique.
 */
const ROOT_CATEGORY_UUID = "D14DAAB6-7FDB-40DC-A17F-29C6599E152B";

/**
 * Database client to handle sqlite connections and queries.
 */
const client = () => {
  let database: DatabaseSync;

  if (process.env.NODE_ENV === "test") {
    database = new DatabaseSync(":memory:");
  } else {
    database = new DatabaseSync("./db.sqlite");
  }

  // Database migrations
  // Root category needs a default UUID, so one is added.
  const migrate = (): void => {
    database.exec("DROP TABLE IF EXISTS product");
    database.exec("DROP TABLE IF EXISTS category");
    database.exec("DROP TABLE IF EXISTS category_product");
    database.exec("DROP TABLE IF EXISTS variant");
    database.exec(
      `CREATE TABLE IF NOT EXISTS category(
        id INTEGER PRIMARY KEY,
        external_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        parent_id INTEGER
      ) STRICT;
      INSERT OR IGNORE INTO category(id, external_id, name)
        VALUES(1, "${ROOT_CATEGORY_UUID}", "Root");
      CREATE TABLE IF NOT EXISTS category_product(
        category_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        PRIMARY KEY(category_id, product_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS product(
        id INTEGER PRIMARY KEY,
        external_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        hash TEXT
      ) STRICT;
      CREATE TABLE IF NOT EXISTS variant(
        id INTEGER PRIMARY KEY,
        product_id INTEGER NOT NULL,
        type TEXT,
        value TEXT,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'EUR'
        ) STRICT;`
    );
  };

  migrate();

  /**
   * Don't add primary keys on the queries and let SQLite handle them. Sqlite will add an autoincrement
   * ID for each row which will be used as and internal ID. These so they are easier to manage as integers,
   * remain private and we shouldn't run out of them.
   */
  const insertProductQuery = database.prepare(
    `INSERT INTO product (external_id, name, description, hash) VALUES (?, ?, ?, ?)
    ON CONFLICT(external_id)
    DO UPDATE SET name = EXCLUDED.name, hash = EXCLUDED.hash, description = EXCLUDED.description;`
  );

  const getAllProductsQuery = database.prepare(
    "SELECT * FROM product ORDER BY id"
  );

  const getProductQuery = database.prepare(
    "SELECT * FROM product WHERE external_id = ?"
  );

  const insertCategoryQuery = database.prepare(
    `INSERT INTO category (external_id, name) VALUES (?, ?)
    ON CONFLICT(external_id)
    DO UPDATE SET name = EXCLUDED.name;`
  );

  const updateParentCategoryQuery = database.prepare(
    `UPDATE category
    SET parent_id = internal_parent_id
    FROM (SELECT id AS internal_parent_id FROM category WHERE external_id = ?) 
    WHERE category.external_id = ?;`
  );

  const addToCategoryQuery = database.prepare(
    `INSERT INTO category_product (category_id, product_id) VALUES (?, ?)
    ON CONFLICT(category_id, product_id)
    DO NOTHING`
  );

  const getAllCategoriesQuery = database.prepare(
    "SELECT * FROM category ORDER BY id"
  );

  const insertVariant = database.prepare(
    `INSERT INTO variant (product_id, type, value, price)
      VALUES (?, ?, ?, ?)`
  );

  const getVariant = database.prepare(
    `SELECT * FROM variant WHERE product_id = ?`
  );

  return {
    database,
    migrate,
    getAllCategoriesQuery,
    insertCategoryQuery,
    getAllProductsQuery,
    insertProductQuery,
    updateParentCategoryQuery,
    addToCategoryQuery,
    insertVariant,
    getVariant,
    getProductQuery,
  };
};

/**
 * Create a connection with the client.
 */
const connection = client();

/**
 * Methods to interact with the database.
 *
 * Each method should return the primary key ID of the updated or inserted row.
 */
const insertProduct = (
  externalId: UUID,
  name: string,
  description: string,
  hash: string
): Number => {
  const result: StatementResultingChanges = connection.insertProductQuery.run(
    externalId,
    name,
    description,
    hash
  );
  return Number(result.lastInsertRowid);
};

const getAllProducts = () => connection.getAllProductsQuery.all();

const getAllCategories = (): Category[] => {
  return connection.getAllCategoriesQuery.all() as Category[];
};

const insertCategory = (
  categoryId: UUID,
  name: string,
  parentId: UUID | undefined
): Number => {
  // First add or update the category
  const insertResult: StatementResultingChanges =
    connection.insertCategoryQuery.run(categoryId, name);

  // Then update it's parent to the default or the provided parent
  let new_parent_id = ROOT_CATEGORY_UUID;
  if (parentId) {
    new_parent_id = parentId;
  }

  connection.updateParentCategoryQuery.run(new_parent_id, categoryId);

  return Number(insertResult.lastInsertRowid);
};

const addToCategory = (categoryId: Number, productId: Number) => {
  const insert: StatementResultingChanges = connection.addToCategoryQuery.run(
    categoryId as number,
    productId as number
  );
  return Number(insert.lastInsertRowid);
};

const insertVariations = (productId: Number, variations: Variant[]) => {
  const result: Number[] = [];
  variations.forEach((variation) => {
    const insert: StatementResultingChanges = connection.insertVariant.run(
      productId as number,
      variation.type || null,
      variation.value || null,
      variation.price
    );
    result.push(Number(insert.lastInsertRowid));
  });

  return result;
};

const getVariant = (productId: Number): Variant => {
  const result = connection.getVariant.all(productId as number);
  return result as unknown as Variant;
};

const getProductWithExternalId = (productId: UUID): Product => {
  const result = connection.getProductQuery.all(productId);
  return result[0] as unknown as Product;
};

export default {
  connection,
  insertProduct,
  insertCategory,
  getAllProducts,
  getAllCategories,
  addToCategory,
  insertVariations,
  getVariant,
  getProductWithExternalId,
};
