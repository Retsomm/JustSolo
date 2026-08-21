import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const OUTPUT_SIZE = 320;

// 比照網頁版 src/lib/imageCrop.ts：固定輸出 320x320、JPEG 品質 0.85，讓存進
// User.image（TEXT 欄位）的大頭貼資料量可控。網頁版用 react-easy-crop 手刻
// 拖曳/縮放的裁切彈窗（RN 沒有對應的成熟套件可以照搬），這裡改用
// expo-image-picker 的 allowsEditing + aspect:[1,1]（系統原生的裁切 UI，
// 一樣能拖曳/縮放調整位置後再確認），選完的結果再用 expo-image-manipulator
// 縮放輸出成跟網頁版同規格的 320x320 JPEG data URL。
export const processPickedImageToDataUrl = async (uri: string): Promise<string> => {
  const image = await ImageManipulator.manipulate(uri)
    .resize({ width: OUTPUT_SIZE, height: OUTPUT_SIZE })
    .renderAsync();

  const result = await image.saveAsync({
    base64: true,
    compress: 0.85,
    format: SaveFormat.JPEG,
  });

  if (!result.base64) throw new Error("圖片處理失敗");
  return `data:image/jpeg;base64,${result.base64}`;
};
