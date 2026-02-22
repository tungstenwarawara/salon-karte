const LINE_API_BASE = "https://api.line.me/v2/bot";

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

type LinePushResponse = {
  sentMessages: { id: string }[];
};

// LINEプロフィール取得
export async function getLineProfile(
  accessToken: string,
  userId: string
): Promise<LineProfile> {
  const res = await fetch(`${LINE_API_BASE}/profile/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE profile取得失敗: ${res.status} ${body}`);
  }
  return res.json();
}

// フォロワーID一覧取得（ページネーション対応）
export async function getFollowerIds(
  accessToken: string
): Promise<string[]> {
  const allIds: string[] = [];
  let start: string | undefined;

  while (true) {
    const url = start
      ? `${LINE_API_BASE}/followers/ids?start=${start}&limit=300`
      : `${LINE_API_BASE}/followers/ids?limit=300`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`フォロワーID取得失敗: ${res.status} ${body}`);
    }
    const data = await res.json() as { userIds: string[]; next?: string };
    allIds.push(...data.userIds);
    if (!data.next) break;
    start = data.next;
  }

  return allIds;
}

// LINEプッシュメッセージ送信
export async function sendPushMessage(
  accessToken: string,
  to: string,
  messages: { type: string; text: string }[]
): Promise<LinePushResponse> {
  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE送信失敗: ${res.status} ${body}`);
  }
  return res.json();
}
