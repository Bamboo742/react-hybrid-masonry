import React, { useState } from "react";
import { ImageIcon } from "./Icons";

interface PhotoCardProps {
  // 库传进来的是原始数据加上 x/y/width/height，url、title、author 是演示数据自己的字段
  item: {
    x: number;
    y: number;
    width: number;
    height: number;
    [key: string]: any;
  };
  // 瀑布流用较大的圆角，等高布局行更密，圆角小一点
  variant: "waterfall" | "equal";
}

// 三个演示共用的卡片：尺寸和位置由库计算好传进来，其余全部走 CSS 类。
export default function PhotoCard({ item, variant }: PhotoCardProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <figure
      data-card
      className={`card card-${variant} is-${status}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
      }}
    >
      {status === "error" ? (
        <div className="card-fallback">
          <ImageIcon />
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
      <figcaption className="card-caption">
        <span className="card-title">{item.title}</span>
        <span className="card-author">{item.author}</span>
      </figcaption>
    </figure>
  );
}
