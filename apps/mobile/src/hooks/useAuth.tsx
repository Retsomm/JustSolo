import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { trpc } from "@/lib/trpc";
import { getAuthToken, setAuthToken } from "@/lib/authToken";
import { setUnauthorizedHandler } from "@/lib/unauthorizedHandler";

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
  const signOutMutation = trpc.auth.signOut.useMutation();

  const clearLocalSession = async () => {
    // 這個函式可能被好幾個同時掛載的 protectedProcedure 查詢各自獨立觸發
    // （例如清單上好幾顆 FavoriteButton 各自的 401 handler），呼叫之間有
    // SecureStore 非同步 I/O 的空檔。如果在等待期間使用者已經完成一次新的登入
    // （token 換成新的），下面 finally 不能把剛登入成功的新 session 也清掉——
    // 所以要先記住呼叫當下的 token，清除前再比對一次是否還是同一個。
    const tokenAtCallTime = getAuthToken();
    try {
      // 先確認 SecureStore 現在存的還是這裡要清的那個（舊）token，不要無條件用
      // key 刪除——如果清除期間新登入已經把新 token 寫進去，直接刪 key 會連新
      // token 一起從本機儲存砍掉（記憶體鏡像不受影響，但下次冷啟動水合時會讀到
      // 空值，變成「明明剛登入成功卻在重開 App 後被登出」）。
      const currentlyStored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (currentlyStored === tokenAtCallTime) {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
      }
    } catch {
      // 本機儲存操作失敗也要繼續清記憶體鏡像，不能因此卡在已登入狀態。
    } finally {
      if (getAuthToken() === tokenAtCallTime) {
        setAuthToken(null);
        setStatus("signedOut");
      }
    }
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

  useEffect(() => {
    // trpc.ts 的 fetch 攔截器已經先判斷過「這次 401 是不是還在反映目前使用中的
    // session」，只有真的相關時才會呼叫到這裡；元件層不需要（也不該）自己另外
    // 判斷每個查詢各自的 error，那樣容易在多個元件同時觀察到同一個 401 時各自
    // 重複觸發，見已知的坑第 26 條。
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
