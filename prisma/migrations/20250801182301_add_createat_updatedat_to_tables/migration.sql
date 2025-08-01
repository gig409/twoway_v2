/*
  Warnings:

  - You are about to drop the column `quotation_request_line_item_values` on the `Quotation_Request_Line_Item` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Client_Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Commercial_Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order_Line_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Quotation_Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Quotation_Request_Line_Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Supplier_Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client_Invoice" (
    "client_invoice_id" TEXT NOT NULL PRIMARY KEY,
    "client_invoice_number" TEXT NOT NULL,
    "client_invoice_shipping_costs" REAL NOT NULL,
    "client_invoice_other_costs" REAL NOT NULL,
    "client_invoice_certificate_price" REAL NOT NULL,
    "client_invoice_date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_Invoice_client_invoice_id_fkey" FOREIGN KEY ("client_invoice_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client_Invoice" ("client_invoice_certificate_price", "client_invoice_date", "client_invoice_id", "client_invoice_number", "client_invoice_other_costs", "client_invoice_shipping_costs") SELECT "client_invoice_certificate_price", "client_invoice_date", "client_invoice_id", "client_invoice_number", "client_invoice_other_costs", "client_invoice_shipping_costs" FROM "Client_Invoice";
DROP TABLE "Client_Invoice";
ALTER TABLE "new_Client_Invoice" RENAME TO "Client_Invoice";
CREATE TABLE "new_Commercial_Invoice" (
    "commercial_invoice_id" TEXT NOT NULL PRIMARY KEY,
    "commercial_invoice_number" TEXT NOT NULL,
    "commercial_invoice_costs" REAL NOT NULL,
    "commercial_invoice_date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commercial_Invoice_commercial_invoice_id_fkey" FOREIGN KEY ("commercial_invoice_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commercial_Invoice" ("commercial_invoice_costs", "commercial_invoice_date", "commercial_invoice_id", "commercial_invoice_number") SELECT "commercial_invoice_costs", "commercial_invoice_date", "commercial_invoice_id", "commercial_invoice_number" FROM "Commercial_Invoice";
DROP TABLE "Commercial_Invoice";
ALTER TABLE "new_Commercial_Invoice" RENAME TO "Commercial_Invoice";
CREATE TABLE "new_Order" (
    "order_id" TEXT NOT NULL PRIMARY KEY,
    "order_client_ref" TEXT NOT NULL,
    "order_supplier_ref" TEXT,
    "order_address" TEXT NOT NULL,
    "order_country" TEXT NOT NULL,
    "order_status" INTEGER NOT NULL,
    "order_supplier_purchase_order_date" DATETIME NOT NULL,
    "order_client_purchase_order_date" DATETIME NOT NULL,
    "order_client_payment_status" INTEGER NOT NULL,
    "order_supplier_payment_status" INTEGER NOT NULL,
    "order_vessel" TEXT,
    "order_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Quotation_Request" ("quotation_request_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("order_address", "order_client_payment_status", "order_client_purchase_order_date", "order_client_ref", "order_country", "order_date", "order_id", "order_status", "order_supplier_payment_status", "order_supplier_purchase_order_date", "order_supplier_ref", "order_vessel") SELECT "order_address", "order_client_payment_status", "order_client_purchase_order_date", "order_client_ref", "order_country", "order_date", "order_id", "order_status", "order_supplier_payment_status", "order_supplier_purchase_order_date", "order_supplier_ref", "order_vessel" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_Order_Line_Item" (
    "order_line_item_id" TEXT NOT NULL PRIMARY KEY,
    "order_line_item_quantity" INTEGER NOT NULL,
    "order_line_item_price" REAL NOT NULL,
    "order_line_item_values" JSONB,
    "supplier_quotation_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "supplier_invoice_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_Line_Item_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "Supplier_Quotation" ("supplier_quotation_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_Line_Item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_Line_Item_supplier_invoice_id_fkey" FOREIGN KEY ("supplier_invoice_id") REFERENCES "Supplier_Invoice" ("supplier_invoice_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order_Line_Item" ("order_id", "order_line_item_id", "order_line_item_price", "order_line_item_quantity", "order_line_item_values", "supplier_invoice_id", "supplier_quotation_id") SELECT "order_id", "order_line_item_id", "order_line_item_price", "order_line_item_quantity", "order_line_item_values", "supplier_invoice_id", "supplier_quotation_id" FROM "Order_Line_Item";
DROP TABLE "Order_Line_Item";
ALTER TABLE "new_Order_Line_Item" RENAME TO "Order_Line_Item";
CREATE UNIQUE INDEX "Order_Line_Item_supplier_quotation_id_key" ON "Order_Line_Item"("supplier_quotation_id");
CREATE TABLE "new_Quotation_Request" (
    "quotation_request_id" TEXT NOT NULL PRIMARY KEY,
    "quotation_request_ref" TEXT NOT NULL,
    "quotation_request_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quotation_request_vessel" TEXT,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_Request_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("company_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_Request_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee" ("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quotation_Request" ("company_id", "employee_id", "quotation_request_date", "quotation_request_id", "quotation_request_ref", "quotation_request_vessel", "user_id") SELECT "company_id", "employee_id", "quotation_request_date", "quotation_request_id", "quotation_request_ref", "quotation_request_vessel", "user_id" FROM "Quotation_Request";
DROP TABLE "Quotation_Request";
ALTER TABLE "new_Quotation_Request" RENAME TO "Quotation_Request";
CREATE TABLE "new_Quotation_Request_Line_Item" (
    "quotation_request_line_item_id" TEXT NOT NULL PRIMARY KEY,
    "quotation_request_line_item_quantity" INTEGER NOT NULL,
    "quotation_request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_Request_Line_Item_quotation_request_id_fkey" FOREIGN KEY ("quotation_request_id") REFERENCES "Quotation_Request" ("quotation_request_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_Request_Line_Item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("product_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quotation_Request_Line_Item" ("product_id", "quotation_request_id", "quotation_request_line_item_id", "quotation_request_line_item_quantity") SELECT "product_id", "quotation_request_id", "quotation_request_line_item_id", "quotation_request_line_item_quantity" FROM "Quotation_Request_Line_Item";
DROP TABLE "Quotation_Request_Line_Item";
ALTER TABLE "new_Quotation_Request_Line_Item" RENAME TO "Quotation_Request_Line_Item";
CREATE TABLE "new_Supplier_Quotation" (
    "supplier_quotation_id" TEXT NOT NULL PRIMARY KEY,
    "supplier_quotation_supplier_date" DATETIME NOT NULL,
    "supplier_quotation_supplier_price" REAL NOT NULL,
    "supplier_quotation_lead_time" DATETIME NOT NULL,
    "supplier_quotation_client_date" DATETIME NOT NULL,
    "supplier_quotation_client_price" REAL NOT NULL,
    "supplier_quotation_accepted" BOOLEAN NOT NULL,
    "supplier_quotation_status" INTEGER NOT NULL,
    "company_id" TEXT NOT NULL,
    "quotation_request_line_item_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Supplier_Quotation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("company_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Supplier_Quotation_quotation_request_line_item_id_fkey" FOREIGN KEY ("quotation_request_line_item_id") REFERENCES "Quotation_Request_Line_Item" ("quotation_request_line_item_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Supplier_Quotation" ("company_id", "quotation_request_line_item_id", "supplier_quotation_accepted", "supplier_quotation_client_date", "supplier_quotation_client_price", "supplier_quotation_id", "supplier_quotation_lead_time", "supplier_quotation_status", "supplier_quotation_supplier_date", "supplier_quotation_supplier_price") SELECT "company_id", "quotation_request_line_item_id", "supplier_quotation_accepted", "supplier_quotation_client_date", "supplier_quotation_client_price", "supplier_quotation_id", "supplier_quotation_lead_time", "supplier_quotation_status", "supplier_quotation_supplier_date", "supplier_quotation_supplier_price" FROM "Supplier_Quotation";
DROP TABLE "Supplier_Quotation";
ALTER TABLE "new_Supplier_Quotation" RENAME TO "Supplier_Quotation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
