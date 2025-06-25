<template>
  <div class="equipment-history-page">
    <h1 class="va-h3 mb-6">설비 이력 조회</h1>

    <!-- 검색 영역 -->
    <VaCard class="mb-6">
      <VaCardContent>
        <h2 class="va-h5 mb-4">검색 조건</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <VaInput
            v-model="searchParams.inspectionLogId"
            label="점검 이력 코드"
            placeholder="점검 이력 코드를 입력하세요"
            clearable
            @input="onSearchInput"
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
            @input="onSearchInput"
          >
            <template #appendInner>
              <VaIcon name="search" color="secondary" />
            </template>
          </VaInput>
          <VaInput
            v-model="searchParams.operatorId"
            label="작업자 사원번호"
            placeholder="사원번호를 입력하세요"
            clearable
            @input="onSearchInput"
          >
            <template #appendInner>
              <VaIcon name="search" color="secondary" />
            </template>
          </VaInput>
          <VaDateInput
            v-model="searchParams.dateRange"
            label="기간"
            mode="range"
            placeholder="기간을 선택하세요"
            clearable
            @update:model-value="onSearchInput"
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

    <!-- 이력 목록 -->
    <VaCard>
      <VaCardContent>
        <div class="flex justify-between items-center mb-4">
          <h2 class="va-h5">설비 이력 목록 (총 {{ totalCount }}개)</h2>
          <div class="flex gap-2">
            <VaButton
              color="info"
              @click="loadMore"
              :loading="loadMoreLoading"
              :disabled="!hasMore"
              v-if="hasMore"
            >
              <div class="flex items-center">
                <VaIcon name="expand_more" size="16px" class="mr-1" />
                <span>더보기</span>
              </div>
            </VaButton>
            <VaButton
              color="success"
              @click="exportToExcel"
              :loading="exportLoading"
            >
              <div class="flex items-center">
                <VaIcon name="file_download" size="16px" class="mr-1" />
                <span>엑셀 다운로드</span>
              </div>
            </VaButton>
          </div>
        </div>

        <VaDataTable
          :items="displayedHistories"
          :columns="columns"
          :loading="loading"
          hoverable
          sticky-header
        >
          <template #cell(inspection_log_id)="{ rowData }">
            <span class="font-semibold">{{ rowData.inspection_log_id }}</span>
          </template>
          <template #cell(eq_name)="{ rowData }">
            <span class="font-medium">{{ rowData.eq_name || "-" }}</span>
          </template>
          <template #cell(operator_name)="{ rowData }">
            <span>{{ rowData.operator_name || rowData.operator_id }}</span>
          </template>
          <template #cell(inspection_type_name)="{ rowData }">
            <VaChip
              :color="getInspectionTypeColor(rowData.inspection_type_code)"
              size="small"
              flat
            >
              {{ rowData.inspection_type_name || rowData.inspection_type_code }}
            </VaChip>
          </template>
          <template #cell(status_name)="{ rowData }">
            <VaChip
              :color="getStatusColor(rowData.status_code)"
              size="small"
              flat
            >
              {{ rowData.status_name || rowData.status_code }}
            </VaChip>
          </template>
          <template #cell(start_time)="{ rowData }">
            <span class="text-sm">{{
              formatDateTime(rowData.start_time)
            }}</span>
          </template>
          <template #cell(end_time)="{ rowData }">
            <span class="text-sm">{{ formatDateTime(rowData.end_time) }}</span>
          </template>
          <template #cell(result_name)="{ rowData }">
            <VaChip
              :color="getResultColor(rowData.result_code)"
              size="small"
              flat
            >
              {{ rowData.result_name || rowData.result_code }}
            </VaChip>
          </template>
          <template #cell(inspection_remark)="{ rowData }">
            <span class="text-sm">{{ rowData.inspection_remark || "-" }}</span>
          </template>
          <template #cell(confirmer_name)="{ rowData }">
            <span>{{
              rowData.confirmer_name || rowData.confirmer_id || "-"
            }}</span>
          </template>
        </VaDataTable>

        <div
          v-if="displayedHistories.length === 0 && !loading"
          class="text-center py-8 text-secondary"
        >
          조회된 설비 이력이 없습니다.
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import * as XLSX from "xlsx";

// 타입 정의
interface EquipmentHistory {
  inspection_log_id: number;
  eq_id: string;
  eq_name?: string;
  operator_id: string;
  operator_name?: string;
  inspection_type_code: string;
  inspection_type_name?: string;
  status_code: string;
  status_name?: string;
  start_time: string;
  end_time: string;
  result_code: string;
  result_name?: string;
  inspection_remark?: string;
  confirmer_id?: string;
  confirmer_name?: string;
}

interface SearchParams {
  inspectionLogId: string;
  equipmentName: string;
  operatorId: string;
  dateRange: Date[] | null;
}

interface ApiResponse<T = any> {
  isSuccessed: boolean;
  data: T;
  totalCount?: number;
}

// 상태
const loading = ref<boolean>(false);
const loadMoreLoading = ref<boolean>(false);
const exportLoading = ref<boolean>(false);
const histories = ref<EquipmentHistory[]>([]);
const displayedHistories = ref<EquipmentHistory[]>([]);
const currentDisplayCount = ref<number>(30);
const totalCount = ref<number>(0);

// 검색 파라미터
const searchParams = ref<SearchParams>({
  inspectionLogId: "",
  equipmentName: "",
  operatorId: "",
  dateRange: null,
});

// 검색 디바운스용
let searchTimeout: any | null = null;

// 테이블 컬럼 정의
const columns = [
  { key: "inspection_log_id", label: "점검 이력 코드", sortable: true },
  { key: "eq_name", label: "설비명", sortable: true },
  { key: "operator_name", label: "작업자", sortable: true },
  { key: "inspection_type_name", label: "점검 유형", sortable: true },
  { key: "status_name", label: "점검 진행 상황", sortable: true },
  { key: "start_time", label: "시작 시간", sortable: true },
  { key: "end_time", label: "종료 시간", sortable: true },
  { key: "result_name", label: "판정 결과", sortable: true },
  { key: "inspection_remark", label: "비고" },
  { key: "confirmer_name", label: "확인자" },
];

// 검색 조건이 있는지 확인하는 computed
const hasSearchCondition = computed(() => {
  return !!(
    searchParams.value.inspectionLogId ||
    searchParams.value.equipmentName ||
    searchParams.value.operatorId ||
    searchParams.value.dateRange
  );
});

// 필터링된 이력 목록
const filteredHistories = computed(() => {
  return histories.value.filter((history) => {
    if (
      searchParams.value.inspectionLogId &&
      !history.inspection_log_id
        .toString()
        .includes(searchParams.value.inspectionLogId)
    )
      return false;

    if (
      searchParams.value.equipmentName &&
      history.eq_name &&
      !history.eq_name
        .toLowerCase()
        .includes(searchParams.value.equipmentName.toLowerCase())
    )
      return false;

    if (
      searchParams.value.operatorId &&
      !history.operator_id
        .toLowerCase()
        .includes(searchParams.value.operatorId.toLowerCase())
    )
      return false;

    if (
      searchParams.value.dateRange &&
      searchParams.value.dateRange.length === 2
    ) {
      const startDate = new Date(searchParams.value.dateRange[0]);
      const endDate = new Date(searchParams.value.dateRange[1]);
      const historyDate = new Date(history.start_time);

      if (historyDate < startDate || historyDate > endDate) return false;
    }

    return true;
  });
});

// 더보기 버튼 표시 여부
const hasMore = computed(() => {
  return currentDisplayCount.value < filteredHistories.value.length;
});

// 표시할 이력 목록 업데이트 함수
const updateDisplayedHistories = (): void => {
  displayedHistories.value = filteredHistories.value.slice(
    0,
    currentDisplayCount.value,
  );
};

// 필터링된 이력 목록 변경 시 표시 목록 업데이트
watch(filteredHistories, (newFiltered) => {
  totalCount.value = newFiltered.length;
  updateDisplayedHistories();
});

// 설비 이력 목록 불러오기
const loadHistories = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await axios.get("/equipment-history");
    const data: ApiResponse<EquipmentHistory[]> = response.data;
    if (data.isSuccessed) {
      histories.value = data.data;
      totalCount.value = data.totalCount || data.data.length;
      updateDisplayedHistories();
    }
  } catch (err: any) {
    console.error("설비 이력 목록 불러오기 실패:", err);
    alert("설비 이력 목록을 불러올 수 없습니다.");
  } finally {
    loading.value = false;
  }
};

// 검색 입력 시 디바운스 처리
const onSearchInput = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    if (hasSearchCondition.value) {
      currentDisplayCount.value = Math.max(
        filteredHistories.value.length,
        999999,
      );
    } else {
      currentDisplayCount.value = 30;
    }
  }, 300);
};

// 더보기
const loadMore = (): void => {
  loadMoreLoading.value = true;

  setTimeout(() => {
    currentDisplayCount.value += 30;
    updateDisplayedHistories();
    loadMoreLoading.value = false;
  }, 300);
};

// 검색 초기화
const resetSearch = (): void => {
  searchParams.value = {
    inspectionLogId: "",
    equipmentName: "",
    operatorId: "",
    dateRange: null,
  };
  currentDisplayCount.value = 30;
};

// 점검 유형 색상
const getInspectionTypeColor = (code: string): string => {
  const colors: Record<string, string> = {
    n1: "info", // 공정 전
    n2: "success", // 공정 후
    n3: "primary", // 정기
    n4: "danger", // 비상
  };
  return colors[code] || "secondary";
};

// 상태 색상
const getStatusColor = (code: string): string => {
  const colors: Record<string, string> = {
    p1: "info", // 대기 중
    p2: "warning", // 진행 중
    p3: "success", // 완료
  };
  return colors[code] || "secondary";
};

// 결과 색상
const getResultColor = (code: string): string => {
  const colors: Record<string, string> = {
    j1: "success", // 적합
    j2: "danger", // 부적합
  };
  return colors[code] || "secondary";
};

// 날짜 시간 포맷팅 함수
const formatDateTime = (dateTimeValue: any): string => {
  if (!dateTimeValue || dateTimeValue === "") return "-";

  try {
    if (typeof dateTimeValue === "string") {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateTimeValue)) {
        return dateTimeValue.replace("-", ".").replace("-", ".");
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeValue)) {
        return dateTimeValue.replace(/-/g, ".");
      }
    }

    const date = new Date(dateTimeValue);
    if (isNaN(date.getTime())) return "-";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error("날짜 포맷팅 오류:", error, "Input:", dateTimeValue);
    return "-";
  }
};

// 엑셀 내보내기 함수
const exportToExcel = async (): Promise<void> => {
  if (filteredHistories.value.length === 0) {
    alert("내보낼 데이터가 없습니다.");
    return;
  }

  exportLoading.value = true;

  try {
    const excelData = filteredHistories.value.map((history) => {
      return {
        "점검 이력 코드": history.inspection_log_id,
        "설비 ID": history.eq_id,
        설비명: history.eq_name || "-",
        "작업자 ID": history.operator_id,
        작업자명: history.operator_name || "-",
        "점검 유형":
          history.inspection_type_name || history.inspection_type_code,
        "점검 진행 상황": history.status_name || history.status_code,
        "시작 시간": formatDateTime(history.start_time),
        "종료 시간": formatDateTime(history.end_time),
        "판정 결과": history.result_name || history.result_code,
        비고: history.inspection_remark || "-",
        "확인자 ID": history.confirmer_id || "-",
        확인자명: history.confirmer_name || "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "설비 이력");

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `설비이력_${today}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (err: any) {
    console.error("엑셀 내보내기 실패:", err);
    alert("엑셀 파일 생성에 실패했습니다.");
  } finally {
    exportLoading.value = false;
  }
};

onMounted(() => {
  loadHistories();
});
</script>

<style scoped>
.equipment-history-page {
  padding: 1.5rem;
}

:deep(.va-data-table__table-tr) {
  cursor: default;
}
</style>
