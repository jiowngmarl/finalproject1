<template>
  <div class="equipment-inquiry-page">
    <h1 class="va-h3 mb-6">설비 조회</h1>

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
          <VaSelect
            v-model="searchParams.category"
            label="설비분류"
            :options="categoryOptions"
            text-by="label"
            value-by="value"
            clearable
            placeholder="전체"
            @update:model-value="onSearchInput"
          />
          <VaSelect
            v-model="searchParams.status"
            label="설비상태"
            :options="statusOptions"
            text-by="label"
            value-by="value"
            clearable
            placeholder="전체"
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

    <!-- 설비 목록 -->
    <VaCard>
      <VaCardContent>
        <div class="flex justify-between items-center mb-4">
          <h2 class="va-h5">설비 목록 (총 {{ totalCount }}개)</h2>
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
          :items="displayedEquipments"
          :columns="columns"
          :loading="loading"
          hoverable
          sticky-header
          clickable
          @row:click="navigateToDetail"
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
          <template #cell(location)="{ rowData }">
            <span class="text-sm">{{ getLocationText(rowData) }}</span>
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
          <template #cell(inspection_status)="{ rowData }">
            <span class="text-sm text-secondary">
              {{
                rowData.inspection_status
                  ? formatDateTime(rowData.inspection_status)
                  : "점검 이력 없음"
              }}
            </span>
          </template>
          <template #cell(inspection_type_name)="{ rowData }">
            <VaChip
              v-if="rowData.inspection_type_name"
              :color="
                rowData.inspection_type_code
                  ? getInspectionTypeColor(rowData.inspection_type_code)
                  : 'secondary'
              "
              size="small"
              flat
            >
              {{ rowData.inspection_type_name }}
            </VaChip>
            <span v-else class="text-sm text-secondary">-</span>
          </template>
        </VaDataTable>

        <div
          v-if="displayedEquipments.length === 0 && !loading"
          class="text-center py-8 text-secondary"
        >
          조회된 설비가 없습니다.
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import * as XLSX from "xlsx";

// 타입 정의
interface Equipment {
  eq_id: string;
  eq_name: string;
  eq_group_code: string;
  eq_group_name?: string;
  eq_run_code: string;
  eq_run_name?: string;
  factory_name?: string;
  floor_name?: string;
  room_name?: string;
  inspection_status?: string;
  inspection_type_code?: string;
  inspection_type_name?: string;
  eq_manufacturer?: string;
  eq_model?: string;
  eq_manufacture_date?: string | null;
  eq_registration_date?: string | null;
}

interface SearchParams {
  equipmentCode: string;
  equipmentName: string;
  category: string;
  status: string;
}

interface CodeOption {
  label: string;
  value: string;
}

interface ApiResponse<T = any> {
  isSuccessed: boolean;
  data: T;
  totalCount?: number;
}

interface TableRowClickEvent {
  item: Equipment;
}

// Router
const router = useRouter();

// 상태
const loading = ref<boolean>(false);
const loadMoreLoading = ref<boolean>(false);
const exportLoading = ref<boolean>(false);
const equipments = ref<Equipment[]>([]);
const displayedEquipments = ref<Equipment[]>([]);
const currentDisplayCount = ref<number>(30);
const totalCount = ref<number>(0);

// 검색 파라미터
const searchParams = ref<SearchParams>({
  equipmentCode: "",
  equipmentName: "",
  category: "",
  status: "",
});

// 공통코드 옵션
const categoryOptions = ref<CodeOption[]>([]);
const statusOptions = ref<CodeOption[]>([]);

// 검색 디바운스용
let searchTimeout: any | null = null;

// 테이블 컬럼 정의 (청소상태를 점검유형으로 변경)
const columns = [
  { key: "eq_id", label: "설비 번호", sortable: true },
  { key: "eq_name", label: "설비명", sortable: true },
  { key: "eq_group_name", label: "분류", sortable: true },
  { key: "location", label: "위치", sortable: true },
  { key: "eq_run_name", label: "설비상태", sortable: true },
  { key: "inspection_status", label: "점검상태(일시)" },
  { key: "inspection_type_name", label: "점검유형" },
];

// 검색 조건이 있는지 확인하는 computed
const hasSearchCondition = computed(() => {
  return !!(
    searchParams.value.equipmentCode ||
    searchParams.value.equipmentName ||
    searchParams.value.category ||
    searchParams.value.status
  );
});

// 필터링된 설비 목록
const filteredEquipments = computed(() => {
  return equipments.value.filter((eq) => {
    if (
      searchParams.value.equipmentCode &&
      !eq.eq_id
        .toString()
        .toLowerCase()
        .includes(searchParams.value.equipmentCode.toLowerCase())
    )
      return false;

    if (
      searchParams.value.equipmentName &&
      !eq.eq_name
        .toLowerCase()
        .includes(searchParams.value.equipmentName.toLowerCase())
    )
      return false;

    if (
      searchParams.value.category &&
      eq.eq_group_code !== searchParams.value.category
    )
      return false;

    if (
      searchParams.value.status &&
      eq.eq_run_code !== searchParams.value.status
    )
      return false;

    return true;
  });
});

// 더보기 버튼 표시 여부
const hasMore = computed(() => {
  return currentDisplayCount.value < filteredEquipments.value.length;
});

// 표시할 설비 목록 업데이트 함수 (watch보다 먼저 정의)
const updateDisplayedEquipments = (): void => {
  displayedEquipments.value = filteredEquipments.value.slice(
    0,
    currentDisplayCount.value,
  );
};

// 필터링된 설비 목록 변경 시 표시 목록 업데이트 (함수 정의 후에 watch 설정)
watch(filteredEquipments, (newFiltered) => {
  totalCount.value = newFiltered.length;
  updateDisplayedEquipments();
});

// 설비 목록 불러오기 (새로운 API 엔드포인트 사용)
const loadEquipments = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await axios.get("/equipments/inquiry"); // *** 새로운 API 사용 ***
    const data: ApiResponse<Equipment[]> = response.data;
    if (data.isSuccessed) {
      equipments.value = data.data;
      // 초기 로딩 후 한 번 실행
      updateDisplayedEquipments();
    }
  } catch (err: any) {
    console.error("설비 목록 불러오기 실패:", err);
    alert("설비 목록을 불러올 수 없습니다.");
  } finally {
    loading.value = false;
  }
};

// 공통코드 불러오기
const loadCommonCodes = async (): Promise<void> => {
  try {
    const response = await axios.get("/common-codes?groups=0E,0S");
    const data: Record<string, CodeOption[]> = response.data;
    categoryOptions.value = data["0E"] || [];
    statusOptions.value = data["0S"] || [];
  } catch (err: any) {
    console.error("공통코드 불러오기 실패:", err);
  }
};

// 검색 입력 시 디바운스 처리
const onSearchInput = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    // 검색 조건이 있으면 전체 결과를 보여주고, 없으면 30개만
    if (hasSearchCondition.value) {
      currentDisplayCount.value = Math.max(
        filteredEquipments.value.length,
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
    loadMoreLoading.value = false;
  }, 300);
};

// 검색 초기화
const resetSearch = (): void => {
  searchParams.value = {
    equipmentCode: "",
    equipmentName: "",
    category: "",
    status: "",
  };
  currentDisplayCount.value = 30;
};

// 상세 페이지로 이동
const navigateToDetail = (row: TableRowClickEvent): void => {
  router.push(`/equipments/${row.item.eq_id}`);
};

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

// 위치 텍스트 생성
const getLocationText = (equipment: Equipment): string => {
  const parts: string[] = [];
  if (equipment.factory_name) parts.push(equipment.factory_name);
  if (equipment.floor_name) parts.push(equipment.floor_name);
  if (equipment.room_name) parts.push(equipment.room_name);
  return parts.join(" > ") || "-";
};

// 날짜 시간 포맷팅 함수 (간단하게 수정)
const formatDateTime = (dateTimeValue: any): string => {
  if (!dateTimeValue || dateTimeValue === "") return "-";

  try {
    // DB에서 'YYYY-MM-DD HH:mm' 형태로 오는 경우 처리
    if (typeof dateTimeValue === "string") {
      // 'YYYY-MM-DD HH:mm' 형태를 'YYYY.MM.DD HH:mm'으로 변환
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateTimeValue)) {
        return dateTimeValue.replace("-", ".").replace("-", ".");
      }
      // 'YYYY-MM-DD' 형태는 그대로 변환
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeValue)) {
        return dateTimeValue.replace(/-/g, ".");
      }
    }

    // 그 외의 경우는 Date 객체로 변환해서 처리
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

// 날짜 포맷팅 함수 (엑셀용)
const formatDate = (dateValue: any): string => {
  // null, undefined, 빈 문자열 체크
  if (!dateValue || dateValue === "") return "-";

  // DB에서 YYYY-MM-DD 형태로 오므로 YYYY.MM.DD로 변환
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue.replace(/-/g, ".");
  }

  return dateValue || "-";
};

// 엑셀 내보내기 함수
const exportToExcel = async (): Promise<void> => {
  if (filteredEquipments.value.length === 0) {
    alert("내보낼 데이터가 없습니다.");
    return;
  }

  exportLoading.value = true;

  try {
    const excelData = filteredEquipments.value.map((eq) => {
      return {
        "설비 번호": eq.eq_id,
        설비명: eq.eq_name,
        분류: eq.eq_group_name || eq.eq_group_code,
        위치: getLocationText(eq),
        설비상태: eq.eq_run_name || eq.eq_run_code,
        "점검상태(일시)": eq.inspection_status
          ? formatDateTime(eq.inspection_status)
          : "점검 이력 없음",
        점검유형: eq.inspection_type_name || "-",
        제조사: eq.eq_manufacturer || "-",
        모델명: eq.eq_model || "-",
        제조일자: formatDate(eq.eq_manufacture_date),
        등록일자: formatDate(eq.eq_registration_date),
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "설비 목록");

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `설비목록_${today}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (err: any) {
    console.error("엑셀 내보내기 실패:", err);
    alert("엑셀 파일 생성에 실패했습니다.");
  } finally {
    exportLoading.value = false;
  }
};

onMounted(() => {
  loadEquipments();
  loadCommonCodes();
});
</script>

<style scoped>
.equipment-inquiry-page {
  padding: 1.5rem;
}

:deep(.va-data-table__table-tr--clickable) {
  cursor: pointer;
}

:deep(.va-data-table__table-tr--clickable:hover) {
  background-color: var(--va-background-secondary);
}
</style>
