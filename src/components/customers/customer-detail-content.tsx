"use client";

import { useState } from "react";
import type { Database } from "@/types/database";
import type { CounselingTemplate } from "@/types/counseling-template";
import { CustomerDetailTabs } from "./customer-detail-tabs";
import { TreatmentHistory } from "./treatment-history";
import { CourseTicketSection } from "./course-ticket-section";
import { PurchaseHistory } from "./purchase-history";
import { CounselingSection } from "./counseling-section";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];
type CounselingSheet = Database["public"]["Tables"]["counseling_sheets"]["Row"];

type RecordWithMenus = TreatmentRecord & {
  treatment_record_menus: TreatmentRecordMenu[];
};

type Props = {
  customerId: string;
  salonId: string;
  customerName: string;
  records: RecordWithMenus[];
  hasPhotos: boolean;
  courseTickets: CourseTicket[];
  purchases: Purchase[];
  purchaseTotal: number;
  counselingSheets: CounselingSheet[];
  counselingTemplate: CounselingTemplate | null;
};

type TabKey = "treatment" | "tickets" | "purchases" | "counseling";

export function CustomerDetailContent({
  customerId,
  salonId,
  customerName,
  records,
  hasPhotos,
  courseTickets,
  purchases,
  purchaseTotal,
  counselingSheets,
  counselingTemplate,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("treatment");

  const activeTicketCount = courseTickets.filter((t) => t.status === "active").length;
  const submittedSheetCount = counselingSheets.filter((s) => s.status === "submitted").length;

  const tabs = [
    { key: "treatment", label: "施術", count: records.length },
    { key: "tickets", label: "回数券", count: activeTicketCount },
    { key: "purchases", label: "物販", count: purchases.length },
    { key: "counseling", label: "カウンセリング", count: submittedSheetCount },
  ];

  return (
    <div>
      <CustomerDetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabKey)}
      />

      <div className="mt-4">
        {/* hidden方式: タブ切替時にstateを保持（回数券操作中等） */}
        <div className={activeTab === "treatment" ? "" : "hidden"}>
          <TreatmentHistory
            customerId={customerId}
            salonId={salonId}
            customerName={customerName}
            records={records}
            hasPhotos={hasPhotos}
          />
        </div>
        <div className={activeTab === "tickets" ? "" : "hidden"}>
          <CourseTicketSection customerId={customerId} salonId={salonId} initialTickets={courseTickets} />
        </div>
        <div className={activeTab === "purchases" ? "" : "hidden"}>
          <PurchaseHistory
            customerId={customerId}
            purchases={purchases}
            purchaseTotal={purchaseTotal}
            salonId={salonId}
          />
        </div>
        <div className={activeTab === "counseling" ? "" : "hidden"}>
          <CounselingSection customerId={customerId} sheets={counselingSheets} counselingTemplate={counselingTemplate} />
        </div>
      </div>
    </div>
  );
}
