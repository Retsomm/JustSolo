import { findUserProfileById, updateUserProfile } from "../clients/prismaClient";

export const updateUserName = (userId: string, name: string) =>
  updateUserProfile(userId, { name });

export const updateUserAvatar = (userId: string, image: string) =>
  updateUserProfile(userId, { image });

export const getUserProfile = (userId: string) => findUserProfileById(userId);
