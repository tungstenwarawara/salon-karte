import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import { buildRegistrationConfirmationEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const { email, password, agreedTermsAt, termsVersion, refCode } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードは必須です" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    // Supabase 側の Password requirements (Lowercase / Uppercase / digits) と一致させる
    // クライアント検証を通り抜けた場合の最終ガード。サーバー側で日本語エラーを返す。
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          error:
            "パスワードは英小文字・英大文字・数字をそれぞれ1文字以上含めてください",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Admin API で確認リンクを生成（メール送信はしない）
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          data: {
            agreed_terms_at: agreedTermsAt,
            terms_version: termsVersion,
          },
        },
      });

    if (linkError) {
      console.error("サインアップリンク生成エラー:", linkError);

      // 重複メール検出: Supabase は code "email_exists" or message に "already registered" / "exists" を返す
      const errorCode = (linkError as { code?: string }).code;
      const isDuplicate =
        errorCode === "email_exists" ||
        linkError.message?.toLowerCase().includes("already registered") ||
        linkError.message?.toLowerCase().includes("already exists") ||
        linkError.message?.toLowerCase().includes("user already") ||
        linkError.message?.toLowerCase().includes("email exists");

      if (isDuplicate) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています。ログインページからお試しください" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `登録に失敗しました: ${linkError.message}` },
        { status: 400 }
      );
    }

    // 確認URLを組み立て（Supabase が返す hashed_token を使う）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_APP_URL が未設定です");
      return NextResponse.json(
        { error: "サーバー設定エラーが発生しました" },
        { status: 500 }
      );
    }

    const confirmUrl = new URL("/auth/callback", baseUrl);
    confirmUrl.searchParams.set(
      "token_hash",
      linkData.properties.hashed_token
    );
    confirmUrl.searchParams.set("type", "signup");
    // 紹介コードがあれば callback 後のリダイレクト先に含める
    if (refCode) {
      confirmUrl.searchParams.set(
        "next",
        `/setup?ref=${encodeURIComponent(refCode)}`
      );
    }

    // Resend でブランド付き確認メールを送信
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = buildRegistrationConfirmationEmail({
        confirmUrl: confirmUrl.toString(),
      });

      const { error: emailError } = await resend.emails.send({
        from: getFromAddress(),
        to: email,
        subject,
        html,
      });

      if (emailError) {
        console.error("確認メール送信エラー:", emailError);
        // メール送信失敗してもユーザー作成は成功しているため、エラーにはしない
        // ただし再送できるようにフラグを返す
        return NextResponse.json({
          success: true,
          emailSent: false,
          message:
            "アカウントは作成されましたが、確認メールの送信に失敗しました。再送をお試しください。",
        });
      }
    } else {
      console.warn("RESEND_API_KEY 未設定のため確認メールをスキップしました");
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: "アカウントは作成されましたが、メール設定が未構成のため確認メールを送信できませんでした。",
      });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (err) {
    console.error("サインアップ処理エラー:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
