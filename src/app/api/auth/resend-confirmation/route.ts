import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import { buildRegistrationConfirmationEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ユーザーが存在し、未確認であることを確認
    // SECURITY DEFINER の RPC で auth.users を email でインデックス検索する
    // (旧実装の listUsers() 全件取得は perPage=1000 を超えると壊れるため廃止)
    const { data: lookupRows, error: lookupError } = await admin.rpc(
      "auth_user_lookup_by_email",
      { p_email: email }
    );

    if (lookupError) {
      console.error("auth_user_lookup_by_email エラー:", lookupError);
      return NextResponse.json(
        { error: "サーバーエラーが発生しました" },
        { status: 500 }
      );
    }

    const user = Array.isArray(lookupRows) ? lookupRows[0] : null;
    if (!user) {
      // セキュリティ: ユーザーの存在を漏らさない
      return NextResponse.json({ success: true });
    }

    if (user.email_confirmed_at) {
      // 既に確認済み
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    // 新しい確認リンクを生成
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password: "", // 既存ユーザーの場合はパスワード不要（リンク再生成のみ）
      });

    if (linkError) {
      console.error("確認リンク再生成エラー:", linkError);
      // "already registered" は正常ケース（既にユーザーがいるため）
      // magiclink タイプで再送を試行
      const { data: magicData, error: magicError } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

      if (magicError) {
        console.error("マジックリンク生成エラー:", magicError);
        return NextResponse.json(
          { error: "確認メールの再送に失敗しました" },
          { status: 500 }
        );
      }

      // magiclink の場合もメール確認として使える
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!baseUrl) {
        return NextResponse.json(
          { error: "サーバー設定エラーが発生しました" },
          { status: 500 }
        );
      }

      const confirmUrl = new URL("/auth/callback", baseUrl);
      confirmUrl.searchParams.set(
        "token_hash",
        magicData.properties.hashed_token
      );
      confirmUrl.searchParams.set("type", "magiclink");

      const resend = getResendClient();
      if (resend) {
        const { subject, html } = buildRegistrationConfirmationEmail({
          confirmUrl: confirmUrl.toString(),
        });

        await resend.emails.send({
          from: getFromAddress(),
          to: email,
          subject,
          html,
        });
      }

      return NextResponse.json({ success: true });
    }

    // 確認URLを組み立て
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
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

    // Resend で送信
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
        console.error("確認メール再送エラー:", emailError);
        return NextResponse.json(
          { error: "メールの送信に失敗しました" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("確認メール再送処理エラー:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
