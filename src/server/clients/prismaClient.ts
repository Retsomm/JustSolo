import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import type { RestaurantSearchResult } from "@/types/restaurant";

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
  city: string;
}): Promise<RestaurantSearchResult[]> => {
  const restaurants = await getPrisma().restaurant.findMany({
    where: {
      city: params.city,
      ...(params.category ? { category: { name: params.category } } : {}),
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
    soloSeatStatus: r.soloSeatStatus,
    soloSeatType: r.soloSeatType,
  }));
};

export const findOrCreateCategory = (name: string) =>
  getPrisma().category.upsert({
    where: { name },
    update: {},
    create: { name },
  });

export type RestaurantUpsertInput = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
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
      city: data.city,
      categoryId: data.categoryId,
    },
    create: {
      placeId: data.placeId,
      name: data.name,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      city: data.city,
      categoryId: data.categoryId,
    },
  });
