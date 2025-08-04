/*
  Warnings:

  - You are about to drop the column `product_category_attributes` on the `ProductCategory` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductCategory" (
    "product_category_id" TEXT NOT NULL PRIMARY KEY,
    "product_category_name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductCategory" ("createdAt", "product_category_id", "product_category_name", "updatedAt") SELECT "createdAt", "product_category_id", "product_category_name", "updatedAt" FROM "ProductCategory";
DROP TABLE "ProductCategory";
ALTER TABLE "new_ProductCategory" RENAME TO "ProductCategory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
