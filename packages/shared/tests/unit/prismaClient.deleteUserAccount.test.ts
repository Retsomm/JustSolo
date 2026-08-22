import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUserDeleteMany = vi.fn();
const mockTx = {
  soloSeatReport: {
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  restaurant: {
    update: vi.fn(),
  },
  favorite: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  mobileSession: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  user: {
    deleteMany: mockUserDeleteMany,
  },
  $executeRaw: vi.fn(),
};

const mockTransaction = vi.fn(
  (callback: (tx: typeof mockTx) => Promise<void>) => callback(mockTx),
);

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}));

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: class {
    $transaction = mockTransaction;
  },
}));

const { deleteUserAccountTransaction } = await import("@/server/clients/prismaClient");

describe("deleteUserAccountTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation((callback) => callback(mockTx));
    mockUserDeleteMany.mockResolvedValue({ count: 1 });
  });

  const computeStatus = () => ({ status: "UNKNOWN" as const, confidence: 0 });

  it("用 deleteMany（而非 delete）刪除 User row", async () => {
    await deleteUserAccountTransaction({ userId: "u1", computeStatus });

    expect(mockUserDeleteMany).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("重複對同一個 userId 呼叫不會拋錯（User row 已不存在時 deleteMany 回傳 count 0）", async () => {
    await deleteUserAccountTransaction({ userId: "u1", computeStatus });

    mockUserDeleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      deleteUserAccountTransaction({ userId: "u1", computeStatus }),
    ).resolves.toBeUndefined();
  });
});
