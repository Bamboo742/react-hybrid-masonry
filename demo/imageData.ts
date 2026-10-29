// 演示用的图片数据：图片来自 Picsum Photos（免费图片服务）。
//
// 怎么让图片尽量不一样：
// 1. Picsum 目前一共有 993 张图片，picsumPool.ts 里内置了它们的 id 和作者。按 id 取图，
//    并用一个和池子大小互质的步长打乱顺序，前 993 张互不相同；用 seed 哈希取图的话，
//    几十张之后就会撞车。
// 2. 池子用完之后（无限滚动、一次加载 1 万条）只能复用图片。复用时换一个裁剪比例
//    （Picsum 会按请求的宽高裁剪），同一张图换了比例看起来也会不一样。
// 3. 比例（竖图、横图、方图）按序号做确定性的伪随机，相邻的卡片形状不会一样。

import { AUTHORS, POOL } from "./picsumPool";

export interface ImageData {
  id: number;
  width: number;
  height: number;
  url: string;
  title: string;
  author: string;
  [key: string]: any;
}

// 预定义的图片比例，让布局更加真实。请求图片时宽度固定为 640，高度按比例算
const aspectRatios: [number, number][] = [
  [2, 3], // 竖图
  [3, 2], // 横图
  [1, 1], // 方图
  [4, 3], // 横图
  [3, 4], // 竖图
  [7, 5], // 横图
  [5, 7], // 竖图
  [16, 9], // 宽图
  [9, 16], // 长竖图
  [5, 4], // 横图
];

const REQUEST_WIDTH = 640;

// 与池子大小（993 = 3 × 331）互质，用来打乱取图顺序
const STRIDE = 7919;

// 确定性的伪随机：同一个序号永远得到同一个值
const hash = (n: number) => Math.imul(n + 1, 2654435761) >>> 0;

/**
 * 生成模拟图片数据
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 图片数据数组
 */
export function generateImageData(page: number, pageSize: number): ImageData[] {
  const data: ImageData[] = [];
  const startIndex = (page - 1) * pageSize;

  for (let i = 0; i < pageSize; i++) {
    const id = startIndex + i;
    const [photoId, authorIndex] = POOL[(id * STRIDE) % POOL.length];
    const [rw, rh] = aspectRatios[hash(id) % aspectRatios.length];
    const width = REQUEST_WIDTH;
    const height = Math.round((REQUEST_WIDTH * rh) / rw);

    data.push({
      id,
      width,
      height,
      // 用 id 取图，并按请求的宽高裁剪
      url: `https://picsum.photos/id/${photoId}/${width}/${height}`,
      title: `Photo #${id + 1}`,
      author: AUTHORS[authorIndex],
    });
  }

  return data;
}

/**
 * 模拟异步加载图片数据
 * @param page 页码
 * @param pageSize 每页数量
 * @param total 数据总量；不传表示无限，永远还有下一页
 * @returns Promise 包含数据和是否有更多数据
 */
export async function loadImageData(
  page: number,
  pageSize: number,
  total?: number
): Promise<{ data: ImageData[]; hasMore: boolean }> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const data = generateImageData(page, pageSize);
  const hasMore = total === undefined ? true : page * pageSize < total;

  return { data, hasMore };
}
