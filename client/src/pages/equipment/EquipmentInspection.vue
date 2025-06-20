<template>
  <div class="equipment-inspection-page">
    <h1 class="va-h3 mb-6">설비 점검</h1>

    <!-- 검색 영역 -->
    <VaCard class="mb-6">
      <VaCardContent>
        <h2 class="va-h5 mb-4">검색 조건</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <VaInput
            v-model="searchParams.equipmentCode"
            label="설비번호"
            placeholder="설비번호를 입력하세요"
            clearable
            @input="filterEquipments"
          >
            <template #appendInner>
              <VaIcon name="search" color="secondary" />
            </template>
          </VaInput>
          <VaInput
            v-model="searchParams.equipmentName"
            label="설비명"
            placeholder="설비명을 입력하세요"
            clearable
            @input="filterEquipments"
          >
            <template #appendInner>
              <VaIcon name="search" color="secondary" />
            </template>
          </VaInput>
          <VaSelect
            v-model="searchParams.category"
            label="설비분류"
            :options="categoryOptions"
            text-by="label"
            value-by="value"
            clearable
            placeholder="전체"
            @update:model-value="filterEquipments"
          />
          <VaSelect
            v-model="searchParams.status"
            label="설비상태"
            :options="statusOptions"
            text-by="label"
            value-by="value"
            clearable
            placeholder="전체"
            @update:model-value="filterEquipments"
          />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <VaButton color="secondary" @click="resetSearch">
            <div class="flex items-center">
              <VaIcon name="refresh" size="16px" class="mr-1" />
              <span>초기화</span>
            </div>
          </VaButton>
        </div>
      </VaCardContent>
    </VaCard>

    <!-- 설비 목록 -->
    <VaCard>
      <VaCardContent>
        <div class="flex justify-between items-center mb-4">
          <h2 class="va-h5">설비 목록</h2>
        </div>

        <VaDataTable
          :items="filteredEquipments"
          :columns="columns"
          hoverable
          clickable
          sticky-header
          @row:click="openModal"
        >
          <template #cell(eq_id)="{ rowData }">
            <span class="font-semibold text-primary cursor-pointer">{{
              rowData.eq_id
            }}</span>
          </template>
          <template #cell(eq_name)="{ rowData }">
            <span class="font-medium">{{ rowData.eq_name }}</span>
          </template>
          <template #cell(eq_group_name)="{ rowData }">
            <VaChip
              :color="getCategoryColor(rowData.eq_group_code)"
              size="small"
              flat
            >
              {{ rowData.eq_group_name || rowData.eq_group_code }}
            </VaChip>
          </template>
          <template #cell(eq_run_name)="{ rowData }">
            <VaChip
              :color="getStatusColor(rowData.eq_run_code)"
              size="small"
              flat
            >
              {{ rowData.eq_run_name || rowData.eq_run_code }}
            </VaChip>
          </template>
        </VaDataTable>

        <div
          v-if="filteredEquipments.length === 0"
          class="text-center py-8 text-secondary"
        >
          조회된 설비가 없습니다.
        </div>
      </VaCardContent>
    </VaCard>

    <!-- 점검 모달 -->
    <VaModal
      v-model="showModal"
      size="large"
      :close-button="false"
      hide-default-actions
    >
      <template #header>
        <h2 class="va-h5">
          설비 점검 -
          <span class="text-primary">{{
            selectedEquipment?.eq_name || "설비명 없음"
          }}</span>
        </h2>
      </template>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <VaSelect
          v-model="inspectionData.operator_id"
          label="작업자"
          :options="employeeOptions"
          text-by="label"
          value-by="value"
        />
        <VaInput
          :model-value="selectedEquipment?.eq_name"
          label="설비명"
          readonly
        />
        <VaInput
          :model-value="inspectionStatusLabel"
          label="점검 상태"
          readonly
        />
        <VaSelect
          v-model="inspectionData.inspection_type_code"
          label="점검 유형"
          :options="inspectionTypeOptions"
          text-by="text"
          value-by="value"
        />
      </div>

      <div class="mb-4">
        <VaButton
          color="info"
          class="mr-2"
          :disabled="inspectionStarted"
          @click="startInspection"
        >
          <div class="flex items-center">
            <VaIcon name="play_arrow" size="16px" class="mr-1" />
            <span>점검 시작</span>
          </div>
        </VaButton>
        <VaButton
          color="success"
          :disabled="!inspectionStarted"
          @click="endInspection"
        >
          <div class="flex items-center">
            <VaIcon name="stop" size="16px" class="mr-1" />
            <span>점검 종료</span>
          </div>
        </VaButton>

        <!-- 점검 시간 표시 -->
        <div class="text-sm text-gray-600 mt-2">
          <div v-if="inspectionStartTime">
            시작 시각: {{ inspectionStartTime }}
          </div>
          <div v-if="inspectionEndTime">종료 시각: {{ inspectionEndTime }}</div>
        </div>
      </div>

      <div v-if="inspectionParts.length > 0">
        <h3 class="va-h6 mb-4 text-primary">점검 항목</h3>
        <div class="space-y-3">
          <div
            v-for="(part, index) in inspectionParts"
            :key="index"
            class="border rounded p-3"
            :class="{ 'bg-gray-50': part.checked }"
          >
            <div class="grid grid-cols-5 gap-4 items-center">
              <!-- 체크박스 -->
              <div class="flex items-center">
                <VaCheckbox
                  v-model="part.checked"
                  :label="'선택'"
                  :disabled="!inspectionStarted"
                  color="primary"
                  @update:model-value="updateInspectionStorage"
                />
              </div>

              <!-- 점검 항목명 -->
              <div
                class="font-medium"
                :class="{ 'text-primary': part.checked }"
              >
                {{ part.name }}
              </div>

              <!-- 판정 결과 라디오 버튼 -->
              <div>
                <VaRadio
                  v-model="part.result"
                  option="j1"
                  label="적합"
                  class="mr-2"
                  :disabled="!inspectionStarted || !part.checked"
                  color="success"
                  @update:model-value="updateInspectionStorage"
                />
                <VaRadio
                  v-model="part.result"
                  option="j2"
                  label="부적합"
                  :disabled="!inspectionStarted || !part.checked"
                  color="danger"
                  @update:model-value="updateInspectionStorage"
                />
              </div>

              <!-- 비고 -->
              <div>
                <VaInput
                  v-model="part.remark"
                  placeholder="비고"
                  :disabled="!inspectionStarted || !part.checked"
                  :color="part.remark ? 'info' : undefined"
                  @update:model-value="updateInspectionStorage"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="selectedEquipment"
        class="text-center py-4 text-secondary"
      >
        설비를 선택하면 점검 항목이 표시됩니다.
      </div>

      <!-- 모달 닫기 버튼 -->
      <div class="flex justify-end mt-6">
        <VaButton color="secondary" @click="showModal = false"> 닫기 </VaButton>
      </div>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import {
  loadInspectionStorage,
  saveInspectionStorage,
  clearInspectionStorage,
} from "../../utils/inspectionStorage";
import { useAuthStore } from "@/stores/authStore";

const inspectionStartTime = ref<string | null>(null);
const inspectionEndTime = ref<string | null>(null);

const authStore = useAuthStore();

const statusProgressOptions = ref([
  { value: "p1", label: "대기 중" },
  { value: "p2", label: "진행 중" },
]);

const searchParams = ref({
  equipmentCode: "",
  equipmentName: "",
  category: "",
  status: "",
});

const equipments = ref<any[]>([]);
const filteredEquipments = ref<any[]>([]);
const showModal = ref(false);
const selectedEquipment = ref<any>(null);
const inspectionStarted = ref(false);
const inspectionParts = ref<any[]>([]);
const inspectionData = ref({
  operator_id: "",
  inspection_type_code: "",
});

const employeeOptions = ref<any[]>([]);
const categoryOptions = ref<any[]>([]);
const statusOptions = ref<any[]>([]);
const inspectionTypeOptions = ref([
  { value: "n1", text: "공정 전" },
  { value: "n2", text: "공정 후" },
  { value: "n3", text: "정기" },
  { value: "n4", text: "비상" },
]);

const inspectionStatusLabel = computed(() => {
  const code = selectedEquipment.value?.work_status_code;

  // 상태 코드가 없거나 알 수 없는 경우도 "점검 대기 중"으로 통일
  const match = statusProgressOptions.value.find((opt) => opt.value === code);
  return `점검 ${match?.label || "대기 중"}`;
});

const columns = [
  { key: "eq_id", label: "설비번호", sortable: true },
  { key: "eq_name", label: "설비명", sortable: true },
  { key: "eq_group_name", label: "설비분류", sortable: true },
  { key: "eq_run_name", label: "상태", sortable: true },
];

// 카테고리 색상
const getCategoryColor = (code: string): string => {
  const colors: Record<string, string> = {
    e1: "primary",
    e2: "success",
    e3: "warning",
  };
  return colors[code] || "secondary";
};

// 상태 색상
const getStatusColor = (code: string): string => {
  const colors: Record<string, string> = {
    s1: "success",
    s2: "info",
    s3: "danger",
  };
  return colors[code] || "secondary";
};

// 점검 데이터 자동 저장
const updateInspectionStorage = () => {
  if (selectedEquipment.value?.eq_id && inspectionStarted.value) {
    saveInspectionStorage(selectedEquipment.value.eq_id, {
      parts: inspectionParts.value,
      inspectionData: inspectionData.value,
    });
  }
};

const filterEquipments = () => {
  filteredEquipments.value = equipments.value.filter((e) => {
    // 설비번호 필터링
    if (
      searchParams.value.equipmentCode &&
      !e.eq_id.toString().includes(searchParams.value.equipmentCode)
    ) {
      return false;
    }

    // 설비명 필터링
    if (
      searchParams.value.equipmentName &&
      !e.eq_name.includes(searchParams.value.equipmentName)
    ) {
      return false;
    }

    // 설비분류 필터링
    if (
      searchParams.value.category &&
      e.eq_group_code !== searchParams.value.category
    ) {
      return false;
    }

    // 설비상태 필터링
    if (
      searchParams.value.status &&
      e.eq_run_code !== searchParams.value.status
    ) {
      return false;
    }

    return true;
  });
};

const fetchEquipments = async () => {
  try {
    const res = await axios.get("/equipment-inspection/equipments");
    if (res.data.isSuccessed) {
      equipments.value = res.data.data;
      filterEquipments();
    }
  } catch (err) {
    console.error("설비 목록 조회 실패:", err);
  }
};

const fetchEmployees = async () => {
  try {
    const res = await axios.get("/equipment-inspection/employee");
    employeeOptions.value = res.data.map((e: any) => ({
      value: e.employee_id,
      label: e.employee_id,
    }));
  } catch (err) {
    console.error("사원 목록 조회 실패:", err);
  }
};

const fetchCommonCodes = async () => {
  try {
    const response = await axios.get("/common-codes?groups=0E,0S");
    const data = response.data;
    categoryOptions.value = data["0E"] || [];
    statusOptions.value = data["0S"] || [];
  } catch (err) {
    console.error("공통코드 불러오기 실패:", err);
  }
};

const fetchInspectionParts = async (eq_type_code: string, eq_name: string) => {
  try {
    const res = await axios.get(`/equipment-inspection/parts/${eq_type_code}`, {
      params: { eq_name },
    });

    inspectionParts.value = res.data.map((row: any) => ({
      part_id: row.inspect_part_id,
      name: row.inspect_part_name,
      checked: false,
      result: "",
      remark: "",
      checker_id: "",
    }));
  } catch (error: any) {
    console.error("점검 항목 조회 실패:", error);
  }
};

const openModal = async ({ item }: any) => {
  // 설비팀만 점검 가능하도록 제한
  if (authStore.user?.department_code !== "04") {
    alert("설비팀만 점검을 시작할 수 있습니다.");
    return;
  }

  console.log("=== 모달 열기 시작 ===");
  console.log("선택된 설비 전체 정보:", item);
  console.log("설비 ID:", item.eq_id);
  console.log("설비명:", item.eq_name);
  console.log("설비 그룹 코드:", item.eq_group_code);
  console.log("설비 유형 코드:", item.eq_type_code);

  selectedEquipment.value = item;
  showModal.value = true;

  // 초기화 - 명확하게 false로 설정
  inspectionStarted.value = false;
  inspectionData.value = { operator_id: "", inspection_type_code: "" };

  console.log("초기화 후 inspectionStarted:", inspectionStarted.value);

  // eq_type_code가 있는지 확인
  if (!item.eq_type_code) {
    console.error("❌ eq_type_code가 없습니다!");
    inspectionParts.value = [];
    return;
  }

  console.log("점검 항목 조회 시작 - eq_type_code:", item.eq_type_code);
  await fetchInspectionParts(item.eq_type_code, item.eq_name);

  // 저장된 점검 데이터 확인
  const storageKey = `equipment_inspection_${item.eq_id}`;
  console.log("로컬스토리지 키:", storageKey);

  const saved = loadInspectionStorage(item.eq_id);
  console.log("로컬스토리지에서 불러온 데이터:", saved);

  if (saved) {
    console.log("저장된 데이터가 있어서 상태 복원 중...");
    // 점검 항목은 새로 가져온 것을 유지하고, 기존 선택 상태만 복원
    const newPartsWithOldState = inspectionParts.value.map((newPart) => {
      const oldPart = saved.parts.find((p) => p.part_id === newPart.part_id);
      return oldPart ? { ...newPart, ...oldPart } : newPart;
    });
    inspectionParts.value = newPartsWithOldState;
    inspectionData.value = saved.inspectionData;
    inspectionStarted.value = true;
    console.log("복원 후 inspectionStarted:", inspectionStarted.value);
    console.log("복원된 점검 항목들:", inspectionParts.value);
  } else {
    console.log("저장된 데이터가 없음 - 새로운 점검");
    console.log("최종 inspectionStarted:", inspectionStarted.value);
  }

  console.log("=== 모달 열기 완료 ===");
};

const resetSearch = () => {
  searchParams.value = {
    equipmentCode: "",
    equipmentName: "",
    category: "",
    status: "",
  };
  filterEquipments();
};

const startInspection = async () => {
  try {
    const requestData = {
      eq_id: selectedEquipment.value.eq_id,
      operator_id: inspectionData.value.operator_id,
      inspection_type_code: inspectionData.value.inspection_type_code,
    };

    console.log("점검 시작 요청 데이터:", requestData);

    // 필수 데이터 검증
    if (!requestData.eq_id) {
      alert("설비 정보가 없습니다.");
      return;
    }
    if (!requestData.operator_id) {
      alert("작업자를 선택해주세요.");
      return;
    }
    if (!requestData.inspection_type_code) {
      alert("점검 유형을 선택해주세요.");
      return;
    }

    inspectionStarted.value = true;

    inspectionStartTime.value = new Date().toLocaleString();

    //점검 시작 알림
    alert("점검이 시작되었습니다!");

    // 로컬 스토리지에 저장
    saveInspectionStorage(selectedEquipment.value.eq_id, {
      parts: inspectionParts.value,
      inspectionData: inspectionData.value,
    });

    // 서버에 점검 시작 요청
    const response = await axios.post(
      "/equipment-inspection/start",
      requestData,
    );
    console.log("점검 시작 응답:", response.data);

    selectedEquipment.value.work_status_code = "p2";

    fetchEquipments();
  } catch (error: any) {
    console.error("점검 시작 실패:", error);
    console.error("에러 응답:", error.response?.data);
    inspectionStarted.value = false;
    alert(
      `점검 시작 실패: ${error.response?.data?.message || "알 수 없는 오류"}`,
    );
  }
};

const endInspection = async () => {
  try {
    console.log("=== 점검 종료 요청 시작 ===");
    console.log("설비 ID:", selectedEquipment.value?.eq_id);
    console.log("점검 항목 수:", inspectionParts.value.length);

    // 입력 데이터 검증
    if (!selectedEquipment.value?.eq_id) {
      alert("설비 정보가 없습니다.");
      return;
    }

    if (
      !Array.isArray(inspectionParts.value) ||
      inspectionParts.value.length === 0
    ) {
      alert("점검 항목이 없습니다.");
      return;
    }

    // 점검 항목 데이터 정리 (undefined 값들 제거)
    const cleanedParts = inspectionParts.value
      .map((part) => ({
        part_id: part.part_id || null,
        name: part.name || "",
        checked: Boolean(part.checked),
        result: part.result || "",
        remark: part.remark || "",
        checker_id: inspectionData.value.operator_id || "",
      }))
      .filter((part) => part.part_id !== null); // part_id가 null인 항목 제거

    console.log("정리된 점검 항목들:", cleanedParts);

    const requestData = {
      eq_id: selectedEquipment.value.eq_id,
      parts: cleanedParts,
    };

    console.log("점검 종료 요청 데이터:", requestData);

    const response = await axios.post("/equipment-inspection/end", requestData);
    console.log("점검 종료 응답:", response.data);

    if (response.data.isSuccessed) {
      // 성공 처리
      clearInspectionStorage(selectedEquipment.value.eq_id);
      inspectionStarted.value = false;
      showModal.value = false;

      inspectionEndTime.value = new Date().toLocaleString();

      await fetchEquipments();
      alert("점검이 완료되었습니다.");
    } else {
      throw new Error(response.data.message || "점검 종료 실패");
    }
  } catch (error: any) {
    console.error("점검 종료 실패:", error);
    console.error("에러 응답 데이터:", error.response?.data);
    console.error("에러 상태 코드:", error.response?.status);

    let errorMessage = "점검 종료에 실패했습니다.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(errorMessage);
  }
};

onMounted(() => {
  fetchEquipments();
  fetchEmployees();
  fetchCommonCodes();
});
</script>

<style scoped>
.equipment-inspection-page {
  padding: 1.5rem;
}

:deep(.va-data-table__table-tr--clickable) {
  cursor: pointer;
}

:deep(.va-data-table__table-tr--clickable:hover) {
  background-color: var(--va-background-secondary);
}

.bg-gray-50 {
  background-color: #f9fafb;
}

:deep(.text-primary) {
  color: var(--va-primary);
}

:deep(.text-secondary) {
  color: var(--va-secondary);
}
</style>
