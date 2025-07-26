-- CreateTable
CREATE TABLE "User" (
    "employee_id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee" ("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "employee_id" TEXT NOT NULL PRIMARY KEY,
    "employee_name" TEXT,
    "employee_mobile" TEXT NOT NULL,
    "employee_email" TEXT NOT NULL,
    "employee_position" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("company_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "company_id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "company_email" TEXT NOT NULL,
    "company_phone" TEXT NOT NULL,
    "company_address" TEXT NOT NULL,
    "company_country" TEXT NOT NULL,
    "company_type" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "product_id" TEXT NOT NULL PRIMARY KEY,
    "product_name" TEXT NOT NULL,
    "product_ref_number" INTEGER NOT NULL,
    "product_description" TEXT,
    "product_attributes" JSONB,
    "product_category_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "ProductCategory" ("product_category_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "product_category_id" TEXT NOT NULL PRIMARY KEY,
    "product_category_name" TEXT NOT NULL,
    "product_category_attributes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quotation_Request" (
    "quotation_request_id" TEXT NOT NULL PRIMARY KEY,
    "quotation_request_ref" TEXT NOT NULL,
    "quotation_request_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quotation_request_vessel" TEXT,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    CONSTRAINT "Quotation_Request_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("company_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_Request_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee" ("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quotation_Request_Line_Item" (
    "quotation_request_line_item_id" TEXT NOT NULL PRIMARY KEY,
    "quotation_request_line_item_quantity" INTEGER NOT NULL,
    "quotation_request_line_item_values" JSONB,
    "quotation_request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    CONSTRAINT "Quotation_Request_Line_Item_quotation_request_id_fkey" FOREIGN KEY ("quotation_request_id") REFERENCES "Quotation_Request" ("quotation_request_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_Request_Line_Item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("product_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier_Quotation" (
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
    CONSTRAINT "Supplier_Quotation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("company_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Supplier_Quotation_quotation_request_line_item_id_fkey" FOREIGN KEY ("quotation_request_line_item_id") REFERENCES "Quotation_Request_Line_Item" ("quotation_request_line_item_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
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
    CONSTRAINT "Order_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Quotation_Request" ("quotation_request_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order_Line_Item" (
    "order_line_item_id" TEXT NOT NULL PRIMARY KEY,
    "order_line_item_quantity" INTEGER NOT NULL,
    "order_line_item_price" REAL NOT NULL,
    "order_line_item_values" JSONB,
    "supplier_quotation_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "supplier_invoice_id" TEXT,
    CONSTRAINT "Order_Line_Item_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "Supplier_Quotation" ("supplier_quotation_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_Line_Item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_Line_Item_supplier_invoice_id_fkey" FOREIGN KEY ("supplier_invoice_id") REFERENCES "Supplier_Invoice" ("supplier_invoice_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier_Invoice" (
    "supplier_invoice_id" TEXT NOT NULL PRIMARY KEY,
    "supplir_invoice_number" TEXT NOT NULL,
    "supplier_invoice_shipping_costs" REAL NOT NULL,
    "supplier_invoice_other_costs" REAL NOT NULL,
    "supplier_invoice_certificate_price" REAL NOT NULL,
    "supplier_invoice_date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Client_Invoice" (
    "client_invoice_id" TEXT NOT NULL PRIMARY KEY,
    "client_invoice_number" TEXT NOT NULL,
    "client_invoice_shipping_costs" REAL NOT NULL,
    "client_invoice_other_costs" REAL NOT NULL,
    "client_invoice_certificate_price" REAL NOT NULL,
    "client_invoice_date" DATETIME NOT NULL,
    CONSTRAINT "Client_Invoice_client_invoice_id_fkey" FOREIGN KEY ("client_invoice_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commercial_Invoice" (
    "commercial_invoice_id" TEXT NOT NULL PRIMARY KEY,
    "commercial_invoice_number" TEXT NOT NULL,
    "commercial_invoice_costs" REAL NOT NULL,
    "commercial_invoice_date" DATETIME NOT NULL,
    CONSTRAINT "Commercial_Invoice_commercial_invoice_id_fkey" FOREIGN KEY ("commercial_invoice_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employee_email_key" ON "Employee"("employee_email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_company_email_key" ON "Company"("company_email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_Line_Item_supplier_quotation_id_key" ON "Order_Line_Item"("supplier_quotation_id");
