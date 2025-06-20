<template>
  <div class="va-pa-4">
    <!-- 검색 필터 -->
    <div class="search-grid">
      <va-input
        v-model="filters.workOrder"
        label="작업지시서 번호"
        placeholder="작업지시서 번호 입력"
        readonly
      />
      <va-input
        v-model="filters.productName"
        label="제품명"
        placeholder="제품명 입력"
        readonly
      />
      <va-input
        v-model="filters.productSpec"
        label="제품규격"
        placeholder="제품 규격 입력"
        readonly
      />
      <va-input
        v-model="filters.resultId"
        label="작업실적 ID"
        placeholder="작업 실적 ID 입력"
        readonly
      />
      <va-date-input
        v-model="filters.workDate"
        label="작업일자"
        :manual-input="false"
        :clearable="true"
      />

      <div class="button-group">
        <va-button color="info" @click="openProductPopup">
          작업지시 검색
        </va-button>
        <va-button color="primary" @click="searchItems"> 조회 </va-button>
        <va-button color="secondary" @click="resetFilters"> 초기화 </va-button>
      </div>
    </div>

    <!-- 리스트 테이블 -->
    <va-data-table :items="workList" :columns="columns" track-by="result_id">
      <template #cell(select)="{ row }">
        <va-checkbox
          :model-value="row.rowData.selected"
          @update:model-value="(val) => handleCheck(row.rowData, val)"
        />
      </template>
      <template #cell(work_start_time)="{ row }">
        {{ formatTime(row.rowData.work_start_time) }}
      </template>
      <template #cell(work_end_time)="{ row }">
        {{ formatTime(row.rowData.work_end_time) }}
      </template>
      <template #cell(duration)="{ row }">
        {{
          calculateDuration(
            row.rowData.work_start_time,
            row.rowData.work_end_time,
          )
        }}
      </template>
    </va-data-table>

    <!-- 탭 버튼 -->
    <div class="va-mt-6 tab-toggle">
      <va-button-toggle
        v-model="activeTab"
        :options="[
          { label: '작업실적 입력', value: 'input' },
          { label: '자재 내역', value: 'material' },
        ]"
        color="primary"
        toggle-color="primary"
      />
    </div>

    <!-- v-model.number="selectedItem.pass_qty"-->
    <!-- 작업실적 입력 -->
    <div v-if="activeTab === 'input'" class="input-layout">
      <div class="input-grid">
        <va-input
          v-model="selectedItem.process_code"
          label="공정코드"
          readonly
        />
        <va-input v-model="selectedItem.manager_id" label="작업자명" />
        <va-input v-model="selectedItem.product_name" label="제품명" readonly />
        <va-input
          v-model="selectedItem.product_stand"
          label="제품규격"
          readonly
        />
        <div class="flex items-center gap-1">
          <va-input
            v-model="selectedItem.eq_name"
            label="설비명"
            readonly
            class="flex-1"
          />
          <va-button
            icon="search"
            color="primary"
            class="h-[38px] mt-[20px]"
            @click="openEquipmentPopup(selectedItem.eq_type_code)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </va-button>
        </div>
        <va-input v-model="selectedItem.code_label" label="가동상태" readonly />
        <va-input
          :model-value="formatTime(selectedItem.work_start_time)"
          label="시작시간"
          readonly
        />
        <va-input
          :model-value="formatTime(selectedItem.work_end_time)"
          label="종료시간"
          readonly
        />
        <va-input v-model.number="selectedItem.pass_qty" label="생산수량" />
        <va-select
          v-model="selectedItem.end_reason_code"
          :options="endReasonOptions"
          track-by="value"
          value-by="value"
          text-by="label"
          label="작업 종료 사유"
          placeholder="종료 사유 선택"
        />
        <va-input
          v-model="selectedItem.product_qual_qty"
          label="합격 수량"
          readonly
        />
        <va-input
          v-model="selectedItem.process_defective_qty"
          label="불량품 수량"
          readonly
        />
      </div>
      <div class="side-buttons">
        <!-- 작업시작 -->
        <va-button
          color="primary"
          @click="isPackagingProcess ? notifyPackagingAlert() : startWork()"
        >
          작업시작
        </va-button>

        <!-- 작업종료 -->
        <va-button
          color="danger"
          @click="isPackagingProcess ? notifyPackagingAlert() : endWork()"
        >
          작업종료
        </va-button>
      </div>
    </div>

    <!-- 자재 내역 -->
    <div v-else-if="activeTab === 'material'">
      <div v-if="materialMessage" class="va-text-danger va-mb-2">
        {{ materialMessage }}
      </div>

      <va-data-table
        v-else
        :items="materialList"
        :columns="[
          { key: 'material_code', label: '자재코드' },
          { key: 'material_name', label: '자재명' },
          { key: 'outbound_qty', label: '출고량' },
        ]"
        track-by="material_code"
      />
      <div class="va-mb-3">
        <va-button color="primary" @click="fetchMaterialList">
          🔍 자재 내역 검색
        </va-button>
      </div>
    </div>

    <!-- 🔍 제품 검색 팝업 -->
    <ProductSearchModal
      v-model:visible="isProductPopupOpen"
      @apply="applyProduct"
    />

    <!-- 🔍 설비 검색 팝업 -->
    <EquipmentSearchModal
      v-model="isEquipmentPopupOpen"
      :equipment-list="equipmentList"
      @apply="applyEquipment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ProductSearchModal from "../modals/ProductSearchModal.vue";
import EquipmentSearchModal from "../modals/EquipmentSearchModal.vue";

interface WorkItem {
  result_id: string;
  result_detail: number;
  product_name: string;
  product_stand: string;
  process_code: string;
  process_name?: string;
  work_start_date: string;
  work_start_time: string;
  work_end_time: string | null;
  work_order_qty: number;
  pass_qty: number | null;
  result_code_label: string;
  detail_code_label: string;
  manager_id: string;
  product_qual_qty: string;
  eq_id: string;
  eq_name: string;
  code_label: string;
  selected?: boolean;
  result_remark?: string;
  eq_type_code: string;
  end_reason_code?: string | { value: string; label: string };
  process_defective_qty: string;
}

const emptyItem = (): WorkItem => ({
  result_id: "",
  result_detail: 0,
  product_name: "",
  product_stand: "",
  process_code: "",
  process_name: "",
  eq_id: "",
  eq_name: "",
  code_label: "",
  work_start_date: "",
  work_start_time: "",
  work_end_time: "",
  work_order_qty: 0,
  pass_qty: 0,
  product_qual_qty: "",
  result_code_label: "",
  detail_code_label: "",
  manager_id: "",
  eq_type_code: "",
  selected: false,
  result_remark: "",
  end_reason_code: "",
  process_defective_qty: "",
});

const allResultList = ref<WorkItem[]>([]);
const workList = ref<WorkItem[]>([]);
const selectedItem = ref<WorkItem>(emptyItem());
const activeTab = ref<"input" | "material">("input");
const materialList = ref<any[]>([]); // 자재 데이터
const materialMessage = ref(""); // 안내 메시지

const columns = [
  { key: "select", label: "선택", width: 40 },
  { key: "result_id", label: "실적ID" },
  { key: "product_name", label: "제품명" },
  { key: "product_stand", label: "제품규격" },
  { key: "process_code", label: "공정코드" },
  { key: "process_name", label: "공정명" },
  { key: "work_start_time", label: "시작시간" },
  { key: "work_end_time", label: "종료시간" },
  { key: "process_time", label: "예상시간(분)" },
  { key: "duration", label: "소요시간(분)" },
  { key: "work_order_qty", label: "요청수량" },
  { key: "pass_qty", label: "재작수량" },
  { key: "detail_code_label", label: "진행상태" },
  { key: "manager_id", label: "작업자" },
];

const filters = ref({
  workOrder: "",
  workDate: "",
  resultId: "",
  productName: "",
  productSpec: "",
  worker: "",
});

type EndReasonRaw = {
  code_label?: string;
  code_value?: string;
  label?: string;
  value?: string;
};

const endReasonList = ref<{ code_value: string; code_label: string }[]>([]);

const fetchEndReasons = async () => {
  try {
    const res = await axios.get("/endEq");
    const rawList: EndReasonRaw[] = res.data;
    endReasonList.value = rawList.map((item) => ({
      code_label: item.code_label ?? item.label ?? "",
      code_value: item.code_value ?? item.value ?? "",
    }));
    console.log("✅ endReasonList:", endReasonList.value);
    console.log("✅ endReasonOptions:", endReasonOptions.value); // 💡 이 시점에는 값 있음
  } catch (err) {
    console.error("작업종료 사유 코드 불러오기 실패", err);
  }
};

console.log("✅ endReasonList:", endReasonList.value);

const endReasonOptions = computed(() =>
  endReasonList.value.map((item) => ({
    value: String(item.code_value ?? ""),
    label: String(item.code_label ?? ""),
  })),
);

const fetchMaterialList = async () => {
  if (!selectedItem.value.result_id || !selectedItem.value.process_code) {
    materialMessage.value = "⚠️ 공정을 선택해주세요.";
    materialList.value = [];
    return;
  }

  try {
    const res = await axios.get(
      `/materialOutbound/${selectedItem.value.process_code}`,
    );
    if (res.data.length === 0) {
      materialMessage.value = "🔍 출고된 자재 내역이 없습니다.";
      materialList.value = [];
    } else {
      materialList.value = res.data;
      materialMessage.value = "";
    }
  } catch (err) {
    materialMessage.value = "❌ 자재 내역 조회 실패";
    materialList.value = [];
    console.error(err);
  }
};

const isPackagingProcess = computed(() => {
  return selectedItem.value.process_name === "포장";
});

const notifyPackagingAlert = () => {
  alert(
    "📦 포장 공정은 포장 팀에서 처리합니다.\n작업을 시작/종료할 수 없습니다.",
  );
};

const startWork = async () => {
  const status = selectedItem.value.code_label;

  const selectedSeq =
    Number(selectedItem.value.process_code.match(/\d+$/)?.[0]) || 0;

  const unfinishedPrev = workList.value.find((item) => {
    const currentSeq = Number(item.process_code.match(/\d+$/)?.[0]) || 0;
    return (
      item.result_id === selectedItem.value.result_id &&
      currentSeq < selectedSeq &&
      (item.product_qual_qty === null ||
        item.product_qual_qty === "" ||
        item.process_defective_qty === null ||
        item.process_defective_qty === "")
    );
  });

  if (unfinishedPrev) {
    alert(
      `⚠️ ${unfinishedPrev.process_name} 공정의 품질검사가 완료되지 않았습니다.\n완료 후 작업을 시작해주세요.`,
    );
    return;
  }

  // ✅ 설비 상태 검사
  if (status === "가동 중") {
    alert(
      "⚠️ 현재 설비는 가동중입니다.\n가동이 종료되고 점검 및 청소가 완료된 후 사용하십시오.",
    );
    return;
  }

  if (status === "정지") {
    alert(
      "⚠️ 현재 설비는 정지 상태입니다.\n점검 및 청소가 모두 완료되기를 기다려주세요.",
    );
    return;
  }

  // ✅ 작업 시작 처리
  const now = new Date();
  selectedItem.value.work_start_time = now.toISOString();
  selectedItem.value.work_start_date = now.toISOString().split("T")[0];

  try {
    // ✅ 서버에 설비 상태 업데이트 요청
    if (selectedSeq === 1) {
      await axios.put(`/workResultStatus/${selectedItem.value.result_id}`);
    }
    await axios.put(`/prodResult/${selectedItem.value.result_detail}`, {
      pass_qty: selectedItem.value.pass_qty ?? 0,
      manager_id: selectedItem.value.manager_id ?? "",
      eq_id: selectedItem.value.eq_id ?? "",
    });

    await axios.put(`/eqStatus/${selectedItem.value.eq_id}`);

    alert("✅ 작업이 시작되었습니다.");
    fetchResultList();
  } catch (err) {
    alert("❌ 설비 상태 업데이트에 실패했습니다.");
    console.error(err);
  }
};

const endWork = async () => {
  if (!selectedItem.value.result_detail) {
    alert("⚠️ 작업 실적이 선택되지 않았습니다.");
    return;
  }

  const reasonCode =
    typeof selectedItem.value.end_reason_code === "string"
      ? selectedItem.value.end_reason_code
      : (selectedItem.value.end_reason_code as { value: string })?.value ?? "";

  if (reasonCode.trim() === "") {
    alert("⚠️ 종료 사유(비고)를 작성해주세요.");
    return;
  }

  const now = new Date();
  const endTime = now.toISOString();
  selectedItem.value.work_end_time = endTime;

  try {
    // ✅ 실적 상세 업데이트
    await axios.put(`/prodResultStop/${selectedItem.value.result_detail}`, {
      pass_qty: selectedItem.value.pass_qty,
      result_remark: selectedItem.value.end_reason_code,
    });

    // ✅ 설비 상태 업데이트
    await axios.put(`/eqStop/${selectedItem.value.eq_id}`, {
      stop_reason: selectedItem.value.end_reason_code,
    });
    alert("✅ 작업이 종료되었습니다.");
    selectedItem.value = emptyItem();
    fetchResultList();
  } catch (err) {
    console.error(err);
    alert("❌ 작업 종료 처리 중 오류가 발생했습니다.");
  }
};

const formatTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateDuration = (start: string, end: string | null): string => {
  if (!start || !end) return "-";
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  return `${diffMin}분`;
};

const handleCheck = (item: WorkItem, val: boolean) => {
  workList.value.forEach((i) => (i.selected = false));
  item.selected = val;
  if (val) selectedItem.value = { ...item };
};

const fetchResultList = async () => {
  try {
    if (!filters.value.workOrder) {
      alert("작업지시서 번호를 입력하세요.");
      return;
    }

    const res = await axios.get(
      `/prodResult/${filters.value.workOrder}/${filters.value.productSpec}`,
    );
    const mapped: WorkItem[] = res.data.map((item: WorkItem) => ({
      ...item,
      selected: false,
    }));

    if (mapped.length === 0) {
      alert("자재를 출고하세요.!");
      selectedItem.value = Object.assign(emptyItem(), {
        product_name: filters.value.productName,
        product_stand: filters.value.productSpec,
        result_id: filters.value.resultId,
        manager_id: filters.value.worker,
      });
      return;
    }

    // 🔥 이 부분이 빠져 있으면 화면에 안 나옴
    allResultList.value = mapped;
    workList.value = mapped; // ✅ 이게 반드시 있어야 함
  } catch (err) {
    alert("조회 실패: 존재하지 않는 작업지시서일 수 있습니다.");
  }
};

const searchItems = async () => {
  await fetchResultList();
};

const resetFilters = () => {
  filters.value = {
    workOrder: "",
    workDate: "",
    resultId: "",
    productName: "",
    productSpec: "",
    worker: "",
  };
  workList.value = [];
  allResultList.value = [];
};

// 🔍 제품 검색 팝업
const isProductPopupOpen = ref(false);
const openProductPopup = () => {
  isProductPopupOpen.value = true;
};
const applyProduct = (product: any) => {
  filters.value.productName = product.product_name;
  filters.value.productSpec = product.product_stand;
  filters.value.workOrder = product.work_order_no;
  filters.value.resultId = product.result_id;
  selectedItem.value.result_id = product.result_id;
  isProductPopupOpen.value = false;
};

const isEquipmentPopupOpen = ref(false);
const equipmentList = ref<any[]>([]); // 자식에게 줄 데이터
const openEquipmentPopup = async (eqTypeCode: string) => {
  try {
    console.log(eqTypeCode);
    const res = await axios.get(`/equipment/${eqTypeCode}`);
    equipmentList.value = res.data; // 받아온 데이터 저장
    console.log(res.data);
    isEquipmentPopupOpen.value = true;
  } catch (err) {
    alert("설비 데이터를 불러오지 못했습니다.");
  }
};

const applyEquipment = (equipment: any) => {
  selectedItem.value.eq_id = equipment.eq_id;
  selectedItem.value.eq_name = equipment.eq_name;
  selectedItem.value.code_label = equipment.code_label;
  isEquipmentPopupOpen.value = false;
};

onMounted(() => {
  fetchEndReasons();
});
</script>

<style scoped>
.search-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  align-items: end;
  margin-bottom: 1.5rem;
}
.button-group {
  display: flex;
  gap: 0.5rem;
  grid-column: span 3;
  justify-content: flex-start;
  padding-top: 0.5rem;
}
.input-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}
.input-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.side-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
