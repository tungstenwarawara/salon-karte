"use client";

import { useState } from "react";
import { RoleSelector } from "@/components/settings/role-selector";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  is_active: boolean;
  auth_user_id: string | null;
};

type Props = {
  staff: StaffMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  onUpdate: (id: string, name: string, role: "manager" | "staff") => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onResendInvite: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "オーナー",
  manager: "マネージャー",
  staff: "スタッフ",
};

export function StaffCard({ staff, isCurrentUser, isOwner, onUpdate, onToggleActive, onResendInvite, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(staff.name);
  const [editRole, setEditRole] = useState<"manager" | "staff">(
    staff.role === "owner" ? "manager" : staff.role
  );
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "delete" | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(staff.id, editName, editRole);
    setSaving(false);
    setEditing(false);
  };

  const handleToggle = async () => {
    setSaving(true);
    await onToggleActive(staff.id, !staff.is_active);
    setSaving(false);
    setConfirmAction(null);
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete(staff.id);
    setSaving(false);
    setConfirmAction(null);
  };

  const handleResend = async () => {
    setSaving(true);
    await onResendInvite(staff.id);
    setSaving(false);
  };

  // 編集モード（オーナーのみ表示可能）
  if (editing) {
    return (
      <div className="bg-background rounded-xl p-3 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">名前</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">権限</label>
          {staff.role === "owner" ? (
            <div className="border border-border rounded-xl p-3 bg-surface opacity-60">
              <span className="font-medium text-sm">オーナー</span>
              <p className="text-xs text-text-light mt-1">全機能の利用・スタッフ管理・設定変更が行えます</p>
              <p className="text-xs text-text-light mt-1">※ オーナー権限は変更できません</p>
            </div>
          ) : (
            <RoleSelector value={editRole} onChange={(r) => setEditRole(r)} name={`role-${staff.id}`} />
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || !editName.trim()} className="flex-1 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-50 min-h-[44px]">
            {saving ? "保存中..." : "保存"}
          </button>
          <button onClick={() => { setEditing(false); setEditName(staff.name); setEditRole(staff.role === "owner" ? "manager" : staff.role); }} className="flex-1 bg-surface border border-border text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]">
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  // 確認パネル（無効化 or 削除）
  if (confirmAction) {
    const isDelete = confirmAction === "delete";
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
        <p className="text-sm font-medium">
          {staff.name} を{isDelete ? "削除" : "無効化"}しますか？
        </p>
        <p className="text-xs text-text-light">
          {isDelete
            ? "この操作は取り消せません。スタッフのアカウントとデータが完全に削除されます。"
            : "無効化するとログインできなくなります。後から再有効化できます。"}
        </p>
        <div className="flex gap-2">
          <button onClick={isDelete ? handleDelete : handleToggle} disabled={saving} className="flex-1 bg-error text-white text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-50 min-h-[44px]">
            {saving ? "処理中..." : isDelete ? "削除する" : "無効化する"}
          </button>
          <button onClick={() => setConfirmAction(null)} className="flex-1 bg-surface border border-border text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]">
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  // 通常表示
  const showActions = isOwner && !isCurrentUser && staff.role !== "owner";

  return (
    <div className={`bg-surface border border-border rounded-xl p-3 space-y-2 ${!staff.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{staff.name}</span>
            <span className="shrink-0 text-xs bg-accent/10 text-accent rounded-full px-2 py-0.5">
              {ROLE_LABELS[staff.role]}
            </span>
            {!staff.is_active && (
              <span className="shrink-0 text-xs bg-error/10 text-error rounded-full px-2 py-0.5">無効</span>
            )}
            {isCurrentUser && (
              <span className="shrink-0 text-xs bg-border rounded-full px-2 py-0.5">自分</span>
            )}
          </div>
          <p className="text-sm text-text-light mt-0.5 truncate">{staff.email}</p>
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          {isOwner && (
            <button onClick={() => setEditing(true)} className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]">
              編集
            </button>
          )}
          {showActions && (
            <>
              <button onClick={handleResend} disabled={saving} className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]">
                {saving ? "送信中..." : "再招待"}
              </button>
              {staff.is_active ? (
                <button onClick={() => setConfirmAction("deactivate")} className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]">
                  無効化
                </button>
              ) : (
                <button onClick={handleToggle} disabled={saving} className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]">
                  {saving ? "処理中..." : "再有効化"}
                </button>
              )}
              <button onClick={() => setConfirmAction("delete")} className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]">
                削除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
