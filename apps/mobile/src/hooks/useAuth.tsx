import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { trpc } from "@/lib/trpc";
import { setAuthToken } from "@/lib/authToken";

const SECURE_STORE_KEY = "mobileSessionToken";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

type AuthStatus = "loading" | "signedIn" | "signedOut";

type AuthContextValue = {
  status: AuthStatus;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  handleUnauthorized: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const utils = trpc.useUtils();
  const signInMutation = trpc.auth.signInWithGoogle.useMutation();
  const signOutMutation = trpc.auth.signOut.useMutation();

  const clearLocalSession = async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    setAuthToken(null);
    setStatus("signedOut");
  };

  useEffect(() => {
    // 開機時從 SecureStore 水合一次記憶體鏡像。這裡樂觀認定「有存 token 就是已登入」，
    // 不主動預檢 token 是否已過期——之後任何 protectedProcedure 呼叫 401 時，
    // 呼叫端自己捕捉並清除即可，這個 MVP 不做額外的預檢請求。
    SecureStore.getItemAsync(SECURE_STORE_KEY)
      .then((token) => {
        setAuthToken(token);
        setStatus(token ? "signedIn" : "signedOut");
      })
      .catch(() => {
        setAuthToken(null);
        setStatus("signedOut");
      });
  }, []);

  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") return;
    if (response.type !== "success" || !response.data.idToken) {
      throw new Error("Google 登入沒有回傳 idToken");
    }

    const { token } = await signInMutation.mutateAsync({ idToken: response.data.idToken });
    await SecureStore.setItemAsync(SECURE_STORE_KEY, token);
    setAuthToken(token);
    setStatus("signedIn");
    await utils.user.getProfile.invalidate();
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // provider 端登出失敗也要繼續清本機 session，不能因此卡在已登入狀態。
    }
    try {
      // 呼叫時本機 token 還沒清除，Authorization header 還帶得出去，讓伺服器
      // 撤銷這次的 MobileSession 紀錄；請求失敗（例如已經離線）不影響本機清除。
      await signOutMutation.mutateAsync();
    } catch {
      // 伺服器端撤銷失敗不該卡住本機登出，裝置上的 token 一律清除。
    } finally {
      await clearLocalSession();
      await utils.user.getProfile.invalidate();
    }
  };

  // 給 protectedProcedure 回 401 時呼叫：伺服器已判定 token 失效，不用也不該
  // 再對 Google 發登出請求，只需清本機 session 讓畫面回到未登入狀態。
  const handleUnauthorized = async () => {
    await clearLocalSession();
    await utils.user.getProfile.invalidate();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ status, signInWithGoogle, signOut, handleUnauthorized }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
