"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { BatchReceiveForm } from "@/components/inventory/batch-receive-form";

type Product = {
  id: string;
  name: string;
  category: string | null;
  base_cost_price: number;
};

export default function ReceivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetProductId = searchParams.get("product");
  const [products, setProducts] = useState<Product[]>([]);
  const [salonId, setSalonId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) return;
    setSalonId(salon.id);

    const { data } = await supabase
      .from("products")
      .select("id, name, category, base_cost_price")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("name")
      .returns<Product[]>();

    setProducts(data ?? []);
    setReady(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="仕入記録"
        breadcrumbs={[
          { label: "経営", href: "/sales" },
          { label: "在庫管理", href: "/sales/inventory" },
          { label: "仕入記録" },
        ]}
      />

      {ready && (
        <BatchReceiveForm
          salonId={salonId}
          products={products}
          presetProductId={presetProductId}
        />
      )}

      {ready && products.length === 0 && (
        <div className="text-center text-text-light text-sm py-4">
          商品が登録されていません。先に
          <a href="/sales/inventory/products" className="text-accent hover:underline">商品マスタ</a>
          から登録してください。
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push("/sales/inventory")}
        className="w-full bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
      >
        在庫管理に戻る
      </button>
    </div>
  );
}
