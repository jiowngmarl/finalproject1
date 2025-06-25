<template>
  <div class="va-pa-4">
    <!-- 🔍 검색 필터 -->
    <div class="search-grid va-mb-4">
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
      <va-input v-model.number="selectedItem.final_qty" label="최종 수량" />

      <div class="button-group va-mt-2">
        <va-button color="info" @click="openProductPopup"
          >작업지시 검색</va-button
        >
        <va-button color="primary" @click="searchItems">조회</va-button>
        <va-button color="secondary" @click="resetFilters">초기화</va-button>
      </div>
    </div>

    <!-- 📋 실적 테이블 -->
    <va-data-table :items="workList" :columns="columns" track-by="result_id">
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

    <!-- 🔍 제품 검색 팝업 -->
    <ProductSearchModal
      v-model:visible="isProductPopupOpen"
      @apply="applyProduct"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import ProductSearchModal from "../modals/ProductSearchModal.vue";

// ✅ 모달 상태
const isProductPopupOpen = ref(false);
const openProductPopup = () => {
  isProductPopupOpen.value = true;
};

// ✅ 필터 데이터
const filters = ref({
  workOrder: "",
  productName: "",
  productSpec: "",
  resultId: "",
  workDate: "",
});

// ✅ 최종 수량
const selectedItem = ref({
  final_qty: 0,
});

// ✅ 작업 실적 리스트
const workList = ref<any[]>([]);

// ✅ 테이블 컬럼
const columns = [
  { key: "result_id", label: "실적ID" },
  { key: "process_code", label: "공정코드" },
  { key: "process_name", label: "공정명" },
  { key: "work_start_time", label: "시작시간" },
  { key: "work_end_time", label: "종료시간" },
  { key: "duration", label: "소요시간(분)" },
];

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

const applyProduct = (selected: any) => {
  filters.value.workOrder =
    selected.work_order_no || selected.workOrderNo || "";
  filters.value.productName =
    selected.product_name || selected.productName || "";
  filters.value.productSpec =
    selected.product_stand || selected.productSpec || "";
  filters.value.resultId = selected.result_id || selected.resultId || "";
  isProductPopupOpen.value = false;
};

// ✅ 실적 조회
const searchItems = async () => {
  try {
    if (!filters.value.workOrder || !filters.value.productSpec) {
      alert("작업지시서 번호 또는 제품규격이 누락되었습니다.");
      return;
    }

    const res = await axios.get(
      `/prodResult/${filters.value.workOrder}/${filters.value.productSpec}`,
    );
    const mapped = res.data.map((item: any) => ({ ...item, selected: false }));
    workList.value = mapped;
  } catch (err) {
    alert("실적 조회 실패");
    console.error(err);
  }
};

// ✅ 필터 초기화
const resetFilters = () => {
  filters.value = {
    workOrder: "",
    productName: "",
    productSpec: "",
    resultId: "",
    workDate: "",
  };
  selectedItem.value.final_qty = 0;
  workList.value = [];
};
</script>

<style scoped>
.search-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.button-group {
  grid-column: span 3;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
