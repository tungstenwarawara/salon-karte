type StaffOption = { id: string; name: string };

type StaffMenuSelectorProps = {
  staffList: StaffOption[];
  selectedStaffIds: string[];
  onChange: (staffIds: string[]) => void;
};

/** メニュー編集時の担当スタッフ選択（チェックボックス） */
export function StaffMenuSelector({ staffList, selectedStaffIds, onChange }: StaffMenuSelectorProps) {
  if (staffList.length <= 1) return null;

  const toggleStaff = (staffId: string) => {
    if (selectedStaffIds.includes(staffId)) {
      onChange(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      onChange([...selectedStaffIds, staffId]);
    }
  };

  const allSelected = staffList.length === selectedStaffIds.length;

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">担当スタッフ</label>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : staffList.map((s) => s.id))}
          className="text-xs text-accent hover:underline"
        >
          {allSelected ? "すべて解除" : "すべて選択"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          {staffList.map((staff) => (
            <label
              key={staff.id}
              className="flex items-center gap-2 bg-background rounded-xl px-3 py-2.5 cursor-pointer min-h-[44px]"
            >
              <input
                type="checkbox"
                checked={selectedStaffIds.includes(staff.id)}
                onChange={() => toggleStaff(staff.id)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm">{staff.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-text-light">
          未選択の場合は全スタッフが対応可能として扱います
        </p>
      </div>
    </div>
  );
}
