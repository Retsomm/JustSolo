import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import type {
  RestaurantDetail,
  RestaurantSearchResult,
  SoloSeatStatus,
} from "@/types/restaurant";
import type { CategoryOption } from "@/types/category";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 需要顯式 driver adapter；用 getter 延後建立連線，
// 避免單元測試只是 import 到這個檔案（transitively）就要求 DATABASE_URL 存在。
const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

const getPrisma = (): PrismaClient => {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
};

export const findRestaurants = async (params: {
  category?: string;
  district?: string;
  keyword?: string;
  city: string;
}): Promise<RestaurantSearchResult[]> => {
  const restaurants = await getPrisma().restaurant.findMany({
    where: {
      city: params.city,
      ...(params.category ? { category: { name: params.category } } : {}),
      ...(params.district ? { district: params.district } : {}),
      ...(params.keyword
        ? { name: { contains: params.keyword, mode: "insensitive" } }
        : {}),
    },
    include: { category: true },
  });

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    categoryName: r.category.name,
    city: r.city,
    district: r.district,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    soloSeatStatus: r.soloSeatStatus,
    soloSeatType: r.soloSeatType,
    soloSeatConfidence: r.soloSeatConfidence,
  }));
};

// 回傳「原始」餐廳詳情，不含 soloFriendlinessScore/soloFriendlinessLabel——
// 那兩個欄位是業務邏輯，由 Service 層的 getRestaurantById 算出後補上，
// Client 層只負責 I/O。
export const findRestaurantById = async (
  id: string,
): Promise<Omit<
  RestaurantDetail,
  "soloFriendlinessScore" | "soloFriendlinessLabel"
> | null> => {
  const restaurant = await getPrisma().restaurant.findUnique({
    where: { id },
    include: { category: true, _count: { select: { reports: true } } },
  });

  if (!restaurant) return null;

  return {
    id: restaurant.id,
    name: restaurant.name,
    categoryName: restaurant.category.name,
    city: restaurant.city,
    district: restaurant.district,
    address: restaurant.address,
    lat: restaurant.lat,
    lng: restaurant.lng,
    soloSeatStatus: restaurant.soloSeatStatus,
    soloSeatType: restaurant.soloSeatType,
    soloSeatConfidence: restaurant.soloSeatConfidence,
    reportCount: restaurant._count.reports,
    phone: restaurant.phone,
  };
};

// 輕量查詢，只給 placeDetailsService 用來查 Google placeId，不動既有的
// findRestaurantById（避免動到已經測過、使用者確認過的既有詳情頁欄位）。
export const findRestaurantPlaceId = async (
  id: string,
): Promise<string | null> => {
  const restaurant = await getPrisma().restaurant.findUnique({
    where: { id },
    select: { placeId: true },
  });

  return restaurant?.placeId ?? null;
};

export const findOrCreateCategory = (name: string) =>
  getPrisma().category.upsert({
    where: { name },
    update: {},
    create: { name },
  });

export const listCategories = async (): Promise<CategoryOption[]> =>
  getPrisma().category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

export const listDistricts = async (city: string): Promise<string[]> => {
  const rows = await getPrisma().restaurant.findMany({
    where: { city, district: { not: null } },
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" },
  });

  return rows.map((r) => r.district).filter((d): d is string => d !== null);
};

export type RestaurantUpsertInput = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  district: string | null;
  city: string;
  categoryId: string;
};

export const upsertRestaurantByPlaceId = (data: RestaurantUpsertInput) =>
  getPrisma().restaurant.upsert({
    where: { placeId: data.placeId },
    update: {
      name: data.name,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      phone: data.phone,
      district: data.district,
      city: data.city,
      categoryId: data.categoryId,
    },
    create: {
      placeId: data.placeId,
      name: data.name,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      phone: data.phone,
      district: data.district,
      city: data.city,
      categoryId: data.categoryId,
    },
  });

export const upsertUserByEmail = async (input: {
  email: string;
  name: string | null;
  image: string | null;
}): Promise<{ id: string }> =>
  getPrisma().user.upsert({
    where: { email: input.email },
    update: { name: input.name, image: input.image },
    create: { email: input.email, name: input.name, image: input.image },
    select: { id: true },
  });

// 寫入回報、重算信心分數、寫回 Restaurant 三個步驟包在同一個 transaction 裡，
// 並用 `SELECT ... FOR UPDATE` 鎖住該餐廳的 Restaurant row，序列化同一間店的
// 並行回報，避免兩個使用者同時回報時，後寫入的 aggregate 蓋掉先寫入的結果。
export const submitSoloSeatReportTransaction = async (input: {
  restaurantId: string;
  userId: string;
  reportType: SoloSeatStatus;
  note: string | null;
  computeStatus: (
    reportTypes: SoloSeatStatus[],
  ) => { status: SoloSeatStatus; confidence: number };
}): Promise<void> => {
  await getPrisma().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Restaurant" WHERE id = ${input.restaurantId} FOR UPDATE`;

    await tx.soloSeatReport.upsert({
      where: {
        restaurantId_userId: {
          restaurantId: input.restaurantId,
          userId: input.userId,
        },
      },
      update: { reportType: input.reportType, note: input.note },
      create: {
        restaurantId: input.restaurantId,
        userId: input.userId,
        reportType: input.reportType,
        note: input.note,
      },
    });

    const reports = await tx.soloSeatReport.findMany({
      where: { restaurantId: input.restaurantId },
      select: { reportType: true },
    });

    const { status, confidence } = input.computeStatus(
      reports.map((r) => r.reportType),
    );

    await tx.restaurant.update({
      where: { id: input.restaurantId },
      data: { soloSeatStatus: status, soloSeatConfidence: confidence },
    });
  });
};
