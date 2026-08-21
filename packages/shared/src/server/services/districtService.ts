import { listDistricts } from "../clients/prismaClient";

const CITY = "台中市";

// 純粹轉呼叫 Client 層，沒有額外業務邏輯，故不另立單元測試。
export const getAllDistricts = () => listDistricts(CITY);
