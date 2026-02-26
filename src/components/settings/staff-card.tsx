"use client";

import { useState } from "react";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  is_active: boolean;
};

type Props = {
  staff: StaffMember;
  isCurrentUser: boolean;
  onUpdate: (id: string, name: string, role: "owner" | "manager" | "staff") => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "オーナー",
  manager: "マネージャー",
  staff: "スタッフ",
};

export function StaffCard({ staff, isCurrentUser, onUpdate, onToggleActive }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(staff.name);
  const [editRole, setEditRole] = useState(staff.role);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

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
    setConfirmDeactivate(false);
  };

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
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as typeof editRole)}
            disabled={staff.role === "owner"}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
          >
            <option value="owner">オーナー</option>
            <option value="manager">マネージャー</option>
            <option value="staff">スタッフ</option>
          </select>
          {staff.role === "owner" && (
            <p className="text-xs text-text-light mt-1">オーナー権限は変更できません</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !editName.trim()}
            className="flex-1 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            onClick={() => { setEditing(false); setEditName(staff.name); setEditRole(staff.role); }}
            className="flex-1 bg-surface border border-border text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  if (confirmDeactivate) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
        <p className="text-sm font-medium">
          {staff.name} を無効化しますか？
        </p>
        <p className="text-xs text-text-light">
          無効化するとログインできなくなります。後から再有効化できます。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            disabled={saving}
            className="flex-1 bg-error text-white text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {saving ? "処理中..." : "無効化する"}
          </button>
          <button
            onClick={() => setConfirmDeactivate(false)}
            className="flex-1 bg-surface border border-border text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

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
              <span className="shrink-0 text-xs bg-error/10 text-error rounded-full px-2 py-0.5">
                無効
              </span>
            )}
            {isCurrentUser && (
              <span className="shrink-0 text-xs bg-border rounded-full px-2 py-0.5">
                自分
              </span>
            )}
          </div>
          <p className="text-sm text-text-light mt-0.5 truncate">{staff.email}</p>
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]"
          >
            編集
          </button>
          {!isCurrentUser && staff.role !== "owner" && (
            staff.is_active ? (
              <button
                onClick={() => setConfirmDeactivate(true)}
                className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]"
              >
                無効化
              </button>
            ) : (
              <button
                onClick={handleToggle}
                disabled={saving}
                className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]"
              >
                {saving ? "処理中..." : "再有効化"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
