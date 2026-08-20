import { z } from "zod";

export const updateNameInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export type UpdateNameInput = z.infer<typeof updateNameInputSchema>;

// image 是裁切後輸出的 data URL 字串（JPEG，320x320），上限抓寬鬆的
// 2,000,000 字元（約 1.5MB 原始資料）當防呆，不是預期的正常大小。
export const updateAvatarInputSchema = z.object({
  image: z.string().min(1).max(2_000_000),
});

export type UpdateAvatarInput = z.infer<typeof updateAvatarInputSchema>;
