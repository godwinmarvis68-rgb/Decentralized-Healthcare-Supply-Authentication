import { describe, it, expect, beforeEach } from "vitest";

interface Product {
  manufacturer: string;
  name: string;
  batchNumber: string;
  manufacturingDate: bigint;
  expiryDate: bigint;
  metadata: string;
  status: bigint;
  createdAt: bigint;
}

interface MockContract {
  admin: string;
  paused: boolean;
  totalProducts: bigint;
  products: Map<string, Product>;
  manufacturers: Map<string, boolean>;
  MAX_PRODUCTS: bigint;
  MAX_METADATA_LEN: bigint;
  STATUS_PENDING: bigint;
  STATUS_APPROVED: bigint;
  STATUS_RECALL: bigint;

  isAdmin(caller: string): boolean;
  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number };
  registerManufacturer(caller: string, manufacturer: string): { value: boolean } | { error: number };
  deregisterManufacturer(caller: string, manufacturer: string): { value: boolean } | { error: number };
  registerProduct(
    caller: string,
    productId: string,
    name: string,
    batchNumber: string,
    manufacturingDate: bigint,
    expiryDate: bigint,
    metadata: string
  ): { value: boolean } | { error: number };
  updateProductMetadata(caller: string, productId: string, metadata: string): { value: boolean } | { error: number };
  updateBatchStatus(caller: string, productId: string, status: bigint): { value: boolean } | { error: number };
  getProduct(productId: string): { value: Product } | { error: number };
}

const mockContract: MockContract = {
  admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  paused: false,
  totalProducts: 0n,
  products: new Map(),
  manufacturers: new Map(),
  MAX_PRODUCTS: 1000000n,
  MAX_METADATA_LEN: 1000n,
  STATUS_PENDING: 0n,
  STATUS_APPROVED: 1n,
  STATUS_RECALL: 2n,

  isAdmin(caller: string) {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  registerManufacturer(caller: string, manufacturer: string) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (manufacturer === "SP000000000000000000002Q6VF78") return { error: 107 };
    if (this.manufacturers.has(manufacturer)) return { error: 104 };
    this.manufacturers.set(manufacturer, true);
    return { value: true };
  },

  deregisterManufacturer(caller: string, manufacturer: string) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (!this.manufacturers.has(manufacturer)) return { error: 104 };
    this.manufacturers.delete(manufacturer);
    return { value: true };
  },

  registerProduct(caller: string, productId: string, name: string, batchNumber: string, manufacturingDate: bigint, expiryDate: bigint, metadata: string) {
    if (this.paused) return { error: 105 };
    if (!this.manufacturers.has(caller)) return { error: 104 };
    if (productId.length === 0) return { error: 101 };
    if (this.products.has(productId)) return { error: 102 };
    if (this.totalProducts >= this.MAX_PRODUCTS) return { error: 101 };
    if (metadata.length > this.MAX_METADATA_LEN) return { error: 108 };
    if (expiryDate <= manufacturingDate) return { error: 108 };
    this.products.set(productId, {
      manufacturer: caller,
      name,
      batchNumber,
      manufacturingDate,
      expiryDate,
      metadata,
      status: this.STATUS_PENDING,
      createdAt: BigInt(1000), // Mock block height
    });
    this.totalProducts += 1n;
    return { value: true };
  },

  updateProductMetadata(caller: string, productId: string, metadata: string) {
    if (this.paused) return { error: 105 };
    if (productId.length === 0) return { error: 101 };
    if (metadata.length > this.MAX_METADATA_LEN) return { error: 108 };
    const product = this.products.get(productId);
    if (!product) return { error: 103 };
    if (product.manufacturer !== caller) return { error: 100 };
    if (product.status !== this.STATUS_PENDING) return { error: 106 };
    this.products.set(productId, { ...product, metadata });
    return { value: true };
  },

  updateBatchStatus(caller: string, productId: string, status: bigint) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (productId.length === 0) return { error: 101 };
    const product = this.products.get(productId);
    if (!product) return { error: 103 };
    if (status !== this.STATUS_PENDING && status !== this.STATUS_APPROVED && status !== this.STATUS_RECALL) return { error: 106 };
    this.products.set(productId, { ...product, status });
    return { value: true };
  },

  getProduct(productId: string) {
    const product = this.products.get(productId);
    if (!product) return { error: 103 };
    return { value: product };
  },
};

describe("Supply Registry Contract", () => {
  beforeEach(() => {
    mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    mockContract.paused = false;
    mockContract.totalProducts = 0n;
    mockContract.products = new Map();
    mockContract.manufacturers = new Map();
  });

  it("should register a manufacturer when called by admin", () => {
    const result = mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    expect(result).toEqual({ value: true });
    expect(mockContract.manufacturers.get("ST2CY5...")).toBe(true);
  });

  it("should prevent non-admin from registering a manufacturer", () => {
    const result = mockContract.registerManufacturer("ST3NB...", "ST2CY5...");
    expect(result).toEqual({ error: 100 });
  });

  it("should prevent registering zero address as manufacturer", () => {
    const result = mockContract.registerManufacturer(mockContract.admin, "SP000000000000000000002Q6VF78");
    expect(result).toEqual({ error: 107 });
  });

  it("should deregister a manufacturer", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    const result = mockContract.deregisterManufacturer(mockContract.admin, "ST2CY5...");
    expect(result).toEqual({ value: true });
    expect(mockContract.manufacturers.has("ST2CY5...")).toBe(false);
  });

  it("should register a product", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    const result = mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets, store at room temp"
    );
    expect(result).toEqual({ value: true });
    expect(mockContract.products.has("product1")).toBe(true);
    expect(mockContract.totalProducts).toBe(1n);
  });

  it("should prevent product registration by non-manufacturer", () => {
    const result = mockContract.registerProduct(
      "ST3NB...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    expect(result).toEqual({ error: 104 });
  });

  it("should prevent product registration with invalid ID", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    const result = mockContract.registerProduct(
      "ST2CY5...",
      "",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    expect(result).toEqual({ error: 101 });
  });

  it("should prevent product registration with invalid metadata", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    const result = mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      1000n,
      "200mg tablets"
    );
    expect(result).toEqual({ error: 108 });
  });

  it("should update product metadata", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    const result = mockContract.updateProductMetadata("ST2CY5...", "product1", "Updated: 200mg tablets, store below 25C");
    expect(result).toEqual({ value: true });
    const product = mockContract.getProduct("product1");
    expect(product).toMatchObject({
      value: { metadata: "Updated: 200mg tablets, store below 25C" },
    });
  });

  it("should prevent metadata update when not pending", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    mockContract.updateBatchStatus(mockContract.admin, "product1", 1n);
    const result = mockContract.updateProductMetadata("ST2CY5...", "product1", "Updated metadata");
    expect(result).toEqual({ error: 106 });
  });

  it("should update batch status by admin", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    const result = mockContract.updateBatchStatus(mockContract.admin, "product1", 1n);
    expect(result).toEqual({ value: true });
    const product = mockContract.getProduct("product1");
    expect(product).toMatchObject({ value: { status: 1n } });
  });

  it("should prevent non-admin from updating batch status", () => {
    mockContract.registerManufacturer(mockContract.admin, "ST2CY5...");
    mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    const result = mockContract.updateBatchStatus("ST3NB...", "product1", 1n);
    expect(result).toEqual({ error: 100 });
  });

  it("should not allow operations when paused", () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.registerProduct(
      "ST2CY5...",
      "product1",
      "Ibuprofen",
      "BATCH123",
      1000n,
      2000n,
      "200mg tablets"
    );
    expect(result).toEqual({ error: 105 });
  });
});