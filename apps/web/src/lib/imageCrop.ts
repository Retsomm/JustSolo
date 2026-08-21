export type CropArea = { x: number; y: number; width: number; height: number };

const OUTPUT_SIZE = 320;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// 把使用者選好的裁切區域畫到固定 320x320 的畫布上，輸出成 JPEG data URL——
// 固定輸出尺寸/品質是為了讓存進 DB（User.image 是 TEXT 欄位，見 prismaClient.ts）
// 的大頭貼資料量可控，不會因為使用者上傳的原始圖片解析度不同而差很多。
export const cropImageToDataUrl = async (
  imageSrc: string,
  area: CropArea,
): Promise<string> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立畫布");

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return canvas.toDataURL("image/jpeg", 0.85);
};
