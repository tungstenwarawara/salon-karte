-- counseling_sheets にDELETEポリシーを追加（SELECT/INSERT/UPDATEは既存）
CREATE POLICY "salon_owner_delete" ON counseling_sheets
  FOR DELETE USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );
