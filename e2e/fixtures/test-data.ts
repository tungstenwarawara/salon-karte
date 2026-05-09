/**
 * テストデータの固定値定義
 *
 * seed-test-data.ts で投入されるデータの参照用。
 * テストコード内でハードコードせず、ここから参照する。
 */

export const TEST_SALON = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "テストサロン花",
  bookingSlug: "test-salon-hana",
};

export const STAFF = {
  ownerId: "00000000-0000-0000-0000-000000000101",
  ownerName: "テストオーナー",
  memberId: "00000000-0000-0000-0000-000000000102",
};

/** シードで作成される顧客（25名） */
export const CUSTOMERS = {
  yamada: { name: "山田花子", lastName: "山田", firstName: "花子", kana: "ヤマダ" },
  sato: { name: "佐藤美咲", lastName: "佐藤", firstName: "美咲" },
  tanaka: { name: "田中麻衣", lastName: "田中", firstName: "麻衣" },
  suzuki: { name: "鈴木由美", lastName: "鈴木", firstName: "由美" },
  takahashi: { name: "高橋さくら", lastName: "高橋", firstName: "さくら" },
  /** 卒業済み顧客 */
  ito: { name: "伊藤千尋", lastName: "伊藤", firstName: "千尋", graduated: true },
  total: 25,
};

/** シードで作成されるメニュー（6件、うち1件非アクティブ） */
export const MENUS = {
  facialBasic: { name: "フェイシャルベーシック", price: 8000, duration: 60 },
  facialPremium: { name: "フェイシャルプレミアム", price: 12000, duration: 90 },
  bodyRelax: { name: "ボディリラクゼーション", price: 7000, duration: 60 },
  decollete: { name: "デコルテケア", price: 4000, duration: 30 },
  headSpa: { name: "ヘッドスパ", price: 5000, duration: 40 },
  inactive: { name: "旧フェイシャル（終了）", price: 6000, duration: 60 },
  activeCount: 5,
};

/** シードで作成される商品（5件） */
export const PRODUCTS = {
  lotion: { name: "モイスチャーローション", price: 4500 },
  cream: { name: "リッチクリーム", price: 6800 },
  cleansing: { name: "クレンジングオイル", price: 3200 },
  uv: { name: "UVプロテクトミルク", price: 2800 },
  bodyOil: { name: "ボディオイル", price: 5500 },
  total: 5,
};

/** シードで作成される回数券（4件） */
export const TICKETS = {
  active: { name: "フェイシャルベーシック5回", total: 5, used: 3 },
  unused: { name: "ボディリラクゼーション10回", total: 10, used: 0 },
  completed: { name: "フェイシャルプレミアム5回", total: 5, used: 5 },
  expired: { name: "ヘッドスパ3回", total: 3, used: 1 },
};

/** カウンセリングシート — シードと完全一致させる
 *  ※ 公開URL（/c/[token]）は token 列の値を使う。id 列とは別物。 */
export const COUNSELING = {
  /** sheet の id（DB上の主キー） */
  pendingId: "00000000-0000-0000-0000-000000008001",
  submittedId: "00000000-0000-0000-0000-000000008002",
  /** 公開URLに使うトークン（/c/[token] のセグメント） */
  pendingToken: "aaaaaaaa-0000-0000-0000-000000000001",
  submittedToken: "aaaaaaaa-0000-0000-0000-000000000002",
};

/** データ件数（検証用） */
export const DATA_COUNTS = {
  customers: 25,
  records: 30,
  appointments: 15,
  products: 5,
  tickets: 4,
  purchases: 10,
  menus: 6,
  counseling: 3,
};
