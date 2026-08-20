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
  }));
};

export const findRestaurantById = async (
  id: string,
): Promise<RestaurantDetail | null> => {
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

export const upsertSoloSeatReport = async (input: {
  restaurantId: string;
  userId: string;
  reportType: SoloSeatStatus;
  note: string | null;
}): Promise<void> => {
  await getPrisma().soloSeatReport.upsert({
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
};

export const listSoloSeatReportTypes = async (
  restaurantId: string,
): Promise<SoloSeatStatus[]> => {
  const reports = await getPrisma().soloSeatReport.findMany({
    where: { restaurantId },
    select: { reportType: true },
  });
  return reports.map((r) => r.reportType);
};

export const updateRestaurantSoloSeatStatus = async (
  restaurantId: string,
  status: SoloSeatStatus,
  confidence: number,
): Promise<void> => {
  await getPrisma().restaurant.update({
    where: { id: restaurantId },
    data: { soloSeatStatus: status, soloSeatConfidence: confidence },
  });
};
