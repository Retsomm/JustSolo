import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  deleteUserAccountTransaction,
  findUserProfileById,
  updateUserProfile,
} from "@/server/clients/prismaClient";
import { computeSoloSeatStatus } from "@/pure/soloSeatStatus";
import {
  deleteUserAccount,
  getUserProfile,
  updateUserAvatar,
  updateUserName,
} from "@/server/services/userProfileService";

vi.mock("@/server/clients/prismaClient", () => ({
  updateUserProfile: vi.fn(),
  findUserProfileById: vi.fn(),
  deleteUserAccountTransaction: vi.fn(),
}));

const mockedUpdateUserProfile = vi.mocked(updateUserProfile);
const mockedFindUserProfileById = vi.mocked(findUserProfileById);
const mockedDeleteUserAccountTransaction = vi.mocked(deleteUserAccountTransaction);

describe("userProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateUserName 轉呼叫 Client 層，只帶 name 欄位", () => {
    updateUserName("u1", "小明");

    expect(mockedUpdateUserProfile).toHaveBeenCalledWith("u1", {
      name: "小明",
    });
  });

  it("updateUserAvatar 轉呼叫 Client 層，只帶 image 欄位", () => {
    updateUserAvatar("u1", "data:image/jpeg;base64,xyz");

    expect(mockedUpdateUserProfile).toHaveBeenCalledWith("u1", {
      image: "data:image/jpeg;base64,xyz",
    });
  });

  it("getUserProfile 轉呼叫 Client 層並回傳結果", async () => {
    mockedFindUserProfileById.mockResolvedValue({
      name: "小明",
      image: null,
    });

    await expect(getUserProfile("u1")).resolves.toEqual({
      name: "小明",
      image: null,
    });
    expect(mockedFindUserProfileById).toHaveBeenCalledWith("u1");
  });

  it("deleteUserAccount 轉呼叫 Client 層的 transaction 函式，且帶上真正的 computeStatus 純函式", async () => {
    mockedDeleteUserAccountTransaction.mockResolvedValue(undefined);

    await deleteUserAccount("u1");

    expect(mockedDeleteUserAccountTransaction).toHaveBeenCalledWith({
      userId: "u1",
      computeStatus: computeSoloSeatStatus,
    });
  });
});
