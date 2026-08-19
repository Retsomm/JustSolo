import "dotenv/config";
import {
  TAICHUNG_IMPORT_CATEGORIES,
  importCategoryRestaurants,
} from "@/server/services/restaurantImportService";

const CITY = "台中市";

const main = async () => {
  for (const category of TAICHUNG_IMPORT_CATEGORIES) {
    const count = await importCategoryRestaurants(category, CITY);
    console.log(`${category}：匯入 ${count} 筆`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
