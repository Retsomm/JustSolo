import {
  deleteUserAccountTransaction,
  findUserProfileById,
  updateUserProfile,
} from "../clients/prismaClient";
import { computeSoloSeatStatus } from "../../pure/soloSeatStatus";

export const updateUserName = (userId: string, name: string) =>
  updateUserProfile(userId, { name });

export const updateUserAvatar = (userId: string, image: string) =>
  updateUserProfile(userId, { image });

export const getUserProfile = (userId: string) => findUserProfileById(userId);

export const deleteUserAccount = (userId: string): Promise<void> =>
  deleteUserAccountTransaction({ userId, computeStatus: computeSoloSeatStatus });
