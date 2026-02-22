import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 認証済みルート: ブラウザバック/フォワードキャッシュ（bfcache）を有効にしつつ
        // プロキシキャッシュは無効化。no-store だと bfcache も無効になりページ遷移が遅くなる。
        source: "/(dashboard|customers|appointments|records|settings)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, private, must-revalidate",
          },
        ],
      },
      {
        // 全ページに適用
        source: "/(.*)",
        headers: [
          {
            // クリックジャッキング防止: 他サイトのiframeに埋め込まれることを防ぐ
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // MIMEスニッフィング防止: ブラウザがContent-Typeを推測しない
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // リファラー情報の制限: 外部サイトにURLのパス情報を送らない
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // HTTPS強制: ブラウザにHTTPSのみの通信を強制（1年間）
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            // 権限ポリシー: カメラ・マイク・位置情報等の使用を自サイトのみに制限
            // camera は施術写真の撮影に必要なので self で許可
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            // CSP: スクリプト・スタイル・画像等の読み込み元を制限
            // XSS攻撃で外部スクリプトを注入されることを防ぐ
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js は inline script / eval を使うため unsafe-inline, unsafe-eval が必要
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // 画像: 自サイト + Supabase Storage (署名付きURL) + blob (プレビュー)
              "img-src 'self' blob: data: https://*.supabase.co https://*.line-scdn.net",
              // フォント: 自サイトのみ
              "font-src 'self'",
              // API接続先: 自サイト + Supabase
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              // フレーム埋め込み禁止
              "frame-ancestors 'none'",
              // フォーム送信先: 自サイトのみ
              "form-action 'self'",
              // base URI: 自サイトのみ
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
