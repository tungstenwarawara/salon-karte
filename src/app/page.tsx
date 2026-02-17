import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-3">サロンカルテ</h1>
        <p className="text-text-light mb-8">
          エステサロン向け
          <br />
          シンプルなカルテ管理
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors text-center min-h-[48px] leading-[48px]"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-surface border border-border hover:border-accent text-text font-medium rounded-xl py-3 transition-colors text-center min-h-[48px] leading-[48px]"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}
