"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { StaffCard } from "@/components/settings/staff-card";
import { RoleSelector } from "@/components/settings/role-selector";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Toast, useToast } from "@/components/ui/toast";
import { inviteStaff, updateStaff, toggleStaffActive, resendInvite, deleteStaff } from "./actions";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  is_active: boolean;
  auth_user_id: string | null;
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentStaffRole, setCurrentStaffRole] = useState<string | null | "loading">("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  // 招待フォーム
  const [showForm, setShowForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [inviting, setInviting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadStaff = async () => {
    const { user, salonId, staff } = await getClientAuth();
    if (!user || !salonId) return;
    setCurrentUserId(user.id);
    setCurrentStaffRole(staff?.role ?? null);

    const supabase = createClient();
    const { data } = await supabase
      .from("staff")
      .select("id, name, email, role, is_active, auth_user_id")
      .eq("salon_id", salonId)
      .order("created_at")
      .returns<StaffMember[]>();

    if (data) setStaffList(data);
    setLoading(false);
  };

  useEffect(() => { loadStaff(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setInviting(true);

    const result = await inviteStaff(inviteName.trim(), inviteEmail.trim(), inviteRole);

    if (result.error) {
      setFormError(result.error);
      setInviting(false);
      return;
    }

    showToast(`${inviteName} さんに招待メールを送信しました`);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("staff");
    setShowForm(false);
    setInviting(false);
    loadStaff();
  };

  const handleUpdate = async (id: string, name: string, role: "manager" | "staff") => {
    const result = await updateStaff(id, name, role);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast("スタッフ情報を更新しました");
    loadStaff();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const result = await toggleStaffActive(id, isActive);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast(isActive ? "スタッフを再有効化しました" : "スタッフを無効化しました");
    loadStaff();
  };

  const handleResendInvite = async (id: string) => {
    const result = await resendInvite(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast("招待メールを再送しました");
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStaff(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast("スタッフを削除しました");
    loadStaff();
  };

  // loading中はfalse、ロード完了後にowner判定（nullはフォールバック: owner_idで認証されたユーザー）
  const isOwner = currentStaffRole !== "loading" && (currentStaffRole === "owner" || currentStaffRole === null);

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="スタッフ管理" breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "スタッフ管理" }]} />

      {error && <ErrorAlert message={error} />}

      {/* 招待ボタン（オーナーのみ） */}
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px]"
          >
            + スタッフを招待
          </button>
        </div>
      )}

      {/* 招待フォーム */}
      {showForm && (
        <form onSubmit={handleInvite} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">スタッフを招待</h3>
          {formError && <ErrorAlert message={formError} />}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              名前 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
              placeholder="例: 山田 花子"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              メールアドレス <span className="text-error">*</span>
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="例: hanako@example.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">権限</label>
            <RoleSelector value={inviteRole} onChange={setInviteRole} name="invite-role" />
            <p className="text-xs text-text-light mt-2">
              ※ スタッフ管理・設定変更はオーナーのみ行えます
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={inviting}
              className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {inviting ? "送信中..." : "招待メールを送信"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="flex-1 bg-surface border border-border font-medium rounded-xl py-3 transition-colors min-h-[48px]"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* スタッフ一覧 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">スタッフはまだ登録されていません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((s) => (
            <StaffCard
              key={s.id}
              staff={s}
              isCurrentUser={s.auth_user_id === currentUserId}
              isOwner={isOwner}
              onUpdate={handleUpdate}
              onToggleActive={handleToggleActive}
              onResendInvite={handleResendInvite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
