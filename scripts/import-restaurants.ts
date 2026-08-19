import "dotenv/config";
import { importCityRestaurants } from "@/server/services/restaurantImportService";

const CITY = "台中市";

const main = async () => {
  const count = await importCityRestaurants(CITY, (area, importedInArea) => {
    console.log(`  ${area}：+${importedInArea} 筆`);
  });
  console.log(`${CITY}：總共匯入 ${count} 筆（分類直接採用 Google Places 的實際類型）`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
