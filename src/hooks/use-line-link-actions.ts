import { useState } from "react";

type Actions = {
  savingId: string | null;
  testingId: string | null;
  syncing: boolean;
  error: string;
  handleLink: (linkId: string, customerId: string) => Promise<boolean>;
  handleUnlink: (linkId: string) => Promise<boolean>;
  handleTest: (lineUserId: string, linkId: string) => Promise<boolean>;
  handleSync: () => Promise<{ added: number; total: number } | null>;
  clearError: () => void;
};

/** LINE友だち管理のAPI操作をまとめたhook */
export function useLineLinkActions(): Actions {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const handleLink = async (linkId: string, customerId: string): Promise<boolean> => {
    setError("");
    setSavingId(linkId);
    try {
      const res = await fetch("/api/line/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId, customer_id: customerId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "紐付けに失敗しました"); return false; }
      return true;
    } catch {
      setError("通信エラーが発生しました"); return false;
    } finally {
      setSavingId(null);
    }
  };

  const handleUnlink = async (linkId: string): Promise<boolean> => {
    setError("");
    setSavingId(linkId);
    try {
      const res = await fetch("/api/line/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId, customer_id: null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "解除に失敗しました"); return false; }
      return true;
    } catch {
      setError("通信エラーが発生しました"); return false;
    } finally {
      setSavingId(null);
    }
  };

  const handleTest = async (lineUserId: string, linkId: string): Promise<boolean> => {
    setError("");
    setTestingId(linkId);
    try {
      const res = await fetch("/api/line/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_user_id: lineUserId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "テスト送信に失敗しました"); return false; }
      return true;
    } catch {
      setError("通信エラーが発生しました"); return false;
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (): Promise<{ added: number; total: number } | null> => {
    setError("");
    setSyncing(true);
    try {
      const res = await fetch("/api/line/sync-followers", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "同期に失敗しました"); return null; }
      return { added: data.added, total: data.total };
    } catch {
      setError("通信エラーが発生しました"); return null;
    } finally {
      setSyncing(false);
    }
  };

  return {
    savingId, testingId, syncing, error,
    handleLink, handleUnlink, handleTest, handleSync,
    clearError: () => setError(""),
  };
}
