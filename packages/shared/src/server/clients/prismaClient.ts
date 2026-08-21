import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { resolvePageWindow } from "../../pure/pagination";
import type {
  RestaurantDetail,
  RestaurantSearchResult,
  SoloSeatStatus,
} from "../../types/restaurant";
import type { CategoryOption } from "../../types/category";

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

export const addFavorite = (userId: string, restaurantId: string) =>
  getPrisma().favorite.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    update: {},
    create: { userId, restaurantId },
  });

export const removeFavorite = (userId: string, restaurantId: string) =>
  getPrisma().favorite.deleteMany({ where: { userId, restaurantId } });

export const findFavoriteByUserAndRestaurant = async (
  userId: string,
  restaurantId: string,
): Promise<boolean> => {
  const favorite = await getPrisma().favorite.findUnique({
    where: { userId_restaurantId: { userId, restaurantId } },
    select: { id: true },
  });
  return favorite !== null;
};

export type PaginatedFavoriteRestaurants = {
  items: RestaurantSearchResult[];
  totalCount: number;
  page: number;
  totalPages: number;
};

// 分頁直接在 DB 層做（skip/take + count），不像 searchRestaurants 得先把整批
// 結果撈進記憶體才能切頁——那邊是因為要先依 Service 層算出的友善度分數排序，
// 這裡只依 createdAt 排序（DB 排得動），收藏筆數多時不需要每次都整批撈回來。
export const listFavoriteRestaurantsByUserId = async (
  userId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedFavoriteRestaurants> => {
  const totalCount = await getPrisma().favorite.count({ where: { userId } });
  const { page: safePage, totalPages, skip } = resolvePageWindow(
    totalCount,
    page,
    pageSize,
  );

  const favorites = await getPrisma().favorite.findMany({
    where: { userId },
    include: { restaurant: { include: { category: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take: pageSize,
  });

  return {
    items: favorites.map(({ restaurant: r }) => ({
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
    })),
    totalCount,
    page: safePage,
    totalPages,
  };
};

// 以 Google sub（googleId）為身分鍵 upsert，不再用 email——email 使用者可能在
// Google 端更改，不是穩定識別碼，用它連結帳號有被冒用未驗證信箱取得他人帳號的風險
// （見 googleIdTokenPayload.ts 的說明）。email 每次登入仍會同步更新（純粹顯示用途，
// 沒有唯一性/安全疑慮）；但 name/image 故意不在 update 覆寫：只在「第一次註冊」時
// 採用 Google 的值當預設，之後使用者在個人頁面自己改過的名稱/大頭貼，不該被下一次
// 登入時 Google 回傳的 profile 資料蓋掉——這兩個欄位之後只由 updateUserProfile
// （個人頁面）異動。
export const upsertUserByGoogleId = async (input: {
  googleId: string;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<{ id: string }> =>
  getPrisma().user.upsert({
    where: { googleId: input.googleId },
    update: { email: input.email },
    create: {
      googleId: input.googleId,
      email: input.email,
      name: input.name,
      image: input.image,
    },
    select: { id: true },
  });

// 手機版長效 session token 對應的伺服器端紀錄，讓 verifyMobileSessionToken 能在
// JWT 本身還沒過期時,也判斷這個 session 是否已被登出撤銷。
export const createMobileSession = (
  userId: string,
  expiresAt: Date,
): Promise<{ id: string }> =>
  getPrisma().mobileSession.create({
    data: { userId, expiresAt },
    select: { id: true },
  });

export const findActiveMobileSessionById = async (
  id: string,
): Promise<{ userId: string } | null> => {
  const session = await getPrisma().mobileSession.findUnique({
    where: { id },
    select: { userId: true, revokedAt: true, expiresAt: true },
  });

  if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
    return null;
  }

  return { userId: session.userId };
};

export const revokeMobileSessionById = async (id: string): Promise<void> => {
  await getPrisma().mobileSession.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
};

export const updateUserProfile = (
  userId: string,
  data: { name?: string; image?: string },
) =>
  getPrisma().user.update({
    where: { id: userId },
    data,
    select: { id: true },
  });

// 大頭貼是裁切後的 base64 data URL（見 imageCrop.ts），可能有數十 KB，
// 絕對不能塞進 next-auth 的 session JWT／cookie（cookie 太大會讓瀏覽器對這個
// origin 的「所有」請求都失敗，見 auth.ts 的說明）。現在的大頭貼只能透過這個
// 函式直接查 DB 拿最新值，不透過 session。
export const findUserProfileById = async (
  userId: string,
): Promise<{ name: string | null; image: string | null } | null> =>
  getPrisma().user.findUnique({
    where: { id: userId },
    select: { name: true, image: true },
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
