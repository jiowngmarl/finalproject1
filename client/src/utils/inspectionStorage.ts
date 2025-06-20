// utils/inspectionStorage.ts

interface InspectionPart {
  part_id: number;
  name: string;
  checked: boolean;
  result: string;
  remark: string;
  checker_id: string;
}

interface InspectionData {
  operator_id: string;
  inspection_type_code: string;
}

interface StoredInspectionData {
  parts: InspectionPart[];
  inspectionData: InspectionData;
}

const STORAGE_KEY_PREFIX = "equipment_inspection_";

export function loadInspectionStorage(
  equipmentId: number,
): StoredInspectionData | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${equipmentId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error("점검 데이터 로드 실패:", error);
    return null;
  }
}

export function saveInspectionStorage(
  equipmentId: number,
  data: StoredInspectionData,
): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${equipmentId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("점검 데이터 저장 실패:", error);
  }
}

export function clearInspectionStorage(equipmentId: number): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${equipmentId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("점검 데이터 삭제 실패:", error);
  }
}

export function clearAllInspectionStorage(): void {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(STORAGE_KEY_PREFIX),
    );
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("모든 점검 데이터 삭제 실패:", error);
  }
}
