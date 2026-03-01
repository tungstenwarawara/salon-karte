/** OGP画像 自動生成 (1200x630px) */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Salon Karte — カルテも予約もLINEも。月額2,980円で、ぜんぶ。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FAF8F5 0%, #F0ECE8 100%)",
          fontFamily: '"Hiragino Sans", "Noto Sans JP", sans-serif',
        }}
      >
        {/* アクセントライン */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #C4956A, #D4AD8A)",
          }}
        />

        {/* ロゴテキスト */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#C4956A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            SK
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#3D3D3D" }}>
            Salon Karte
          </span>
        </div>

        {/* メインコピー */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#3D3D3D",
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: 800,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>カルテも予約もLINEも。</span>
          <span>
            <span style={{ color: "#C4956A" }}>月額2,980円</span>で、ぜんぶ。
          </span>
        </div>

        {/* サブコピー */}
        <div
          style={{
            fontSize: 24,
            color: "#6B6B6B",
            marginTop: 24,
          }}
        >
          個人サロンのための、やさしいサロン管理アプリ
        </div>
      </div>
    ),
    { ...size },
  );
}
