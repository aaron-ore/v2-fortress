export const generateInventoryCsvTemplate = (): string => {
  const headers = [
    "name",
    "description",
    "sku",
    "category",
    "quantity",
    "reorderLevel",
    "committedStock",
    "incomingStock",
    "unitCost",
    "retailPrice",
    "location",
    "imageUrl",
    "vendorId",
    "barcodeUrl",
  ];

  const exampleRow = [
    "Example Product A",
    "Description for Product A",
    "SKU-001",
    "Electronics",
    "100",
    "20",
    "5",
    "10",
    "50.00",
    "75.00",
    "Main Warehouse",
    "http://example.com/imageA.jpg",
    "vendor-uuid-123",
    "SKU-001", // Barcode value, not the SVG itself
  ];

  const csvContent = [
    headers.join(","),
    exampleRow.join(","),
  ].join("\n");

  return csvContent;
};