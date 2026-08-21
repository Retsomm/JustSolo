import { Pressable, StyleSheet } from "react-native";

import { HeartIcon } from "@/components/icons/Icons";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteStatus } from "@/hooks/useFavoriteStatus";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { trpc } from "@/lib/trpc";

type FavoriteButtonProps = {
  restaurantId: string;
  size?: number;
};

export const FavoriteButton = ({ restaurantId, size = 18 }: FavoriteButtonProps) => {
  const theme = useOrganicTheme();
  const utils = trpc.useUtils();
  const { status, signInWithGoogle } = useAuth();
  // 401 時的登出處理集中在 trpc.ts 的 fetch 攔截器＋useAuth 的 unauthorizedHandler
  // 註冊機制，這裡不用（也不該）再各自判斷 error.data.code，避免同一個 401
  // 被畫面上好幾顆 FavoriteButton 各自重複觸發，見已知的坑第 26 條。
  const { data: isFavorited } = useFavoriteStatus(restaurantId);
  const toggleFavorite = useToggleFavorite();

  const disabled =
    status === "loading" ||
    toggleFavorite.isPending ||
    (status === "signedIn" && isFavorited === undefined);
  const filled = status === "signedIn" && isFavorited === true;

  const handlePress = () => {
    if (status === "signedOut") {
      signInWithGoogle();
      return;
    }
    if (status !== "signedIn" || isFavorited === undefined) return;

    toggleFavorite.mutate(
      { restaurantId, isFavorited: !isFavorited },
      {
        onSuccess: () => {
          utils.favorite.isFavorited.invalidate({ restaurantId });
          utils.favorite.list.invalidate();
        },
      },
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        filled ? "取消收藏" : status === "signedOut" ? "登入後即可收藏" : "加入收藏"
      }
      accessibilityState={{ disabled, selected: filled }}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.button,
        { borderColor: filled ? theme.accent : theme.border },
        disabled && styles.disabled,
      ]}
    >
      <HeartIcon color={theme.accent} size={size} filled={filled} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
