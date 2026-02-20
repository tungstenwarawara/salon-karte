type Props = {
  treatmentTotal: number;
  purchaseTotal: number;
  courseTicketTotal: number;
};

export function SalesSummary({ treatmentTotal, purchaseTotal, courseTicketTotal }: Props) {
  const grandTotal = treatmentTotal + purchaseTotal + courseTicketTotal;
  if (grandTotal <= 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-sm text-text-light">売上サマリー</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-light">施術合計</span>
          <span>{treatmentTotal.toLocaleString()}円</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-light">物販合計</span>
          <span>{purchaseTotal.toLocaleString()}円</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-light">回数券合計</span>
          <span>{courseTicketTotal.toLocaleString()}円</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
          <span>総合計</span>
          <span className="text-accent">{grandTotal.toLocaleString()}円</span>
        </div>
      </div>
    </div>
  );
}
