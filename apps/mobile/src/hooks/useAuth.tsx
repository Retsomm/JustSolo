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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const utils = trpc.useUtils();
  const signInMutation = trpc.auth.signInWithGoogle.useMutation();

  useEffect(() => {
    // 開機時從 SecureStore 水合一次記憶體鏡像。這裡樂觀認定「有存 token 就是已登入」，
    // 不主動預檢 token 是否已過期——之後任何 protectedProcedure 呼叫 401 時，
    // 呼叫端自己捕捉並清除即可，這個 MVP 不做額外的預檢請求。
    SecureStore.getItemAsync(SECURE_STORE_KEY).then((token) => {
      setAuthToken(token);
      setStatus(token ? "signedIn" : "signedOut");
    });
  }, []);

  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
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
    await GoogleSignin.signOut();
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    setAuthToken(null);
    setStatus("signedOut");
    await utils.user.getProfile.invalidate();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ status, signInWithGoogle, signOut }),
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
