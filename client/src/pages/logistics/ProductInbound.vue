<template>
  <div class="max-w-[1200px] h-[739px] mx-auto p-4 bg-gray-50 overflow-hidden">
    <!-- 상단 타이틀 -->
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-gray-800">제품 입고 관리</h1>
    </div>

    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      style="height: calc(100% - 60px)"
    >
      <!-- 탭 메뉴 -->
      <div class="flex border-b border-gray-200 mb-4">
        <button
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'waiting'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = 'waiting'"
        >
          입고 대기 목록
        </button>
        <button
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'completed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = 'completed'"
        >
          입고 완료 목록
        </button>
      </div>

      <!-- 입고 대기 탭 -->
      <div v-if="activeTab === 'waiting'" class="h-full">
        <!-- 검색 영역 -->
        <div class="grid grid-cols-5 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >작업실적ID</label
            >
            <input
              v-model="waitingSearch.result_id"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="작업실적ID 검색"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >제품명</label
            >
            <input
              v-model="waitingSearch.product_name"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="제품명 검색"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >제품코드</label
            >
            <input
              v-model="waitingSearch.product_code"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="제품코드 검색"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >요청일자</label
            >
            <input
              v-model="waitingSearch.request_date"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              class="px-4 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              @click="loadInboundWaitingList"
            >
              검색
            </button>
            <button
              class="px-4 py-1.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
              @click="resetWaitingSearch"
            >
              초기화
            </button>
          </div>
        </div>

        <!-- 상단 버튼 영역 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <button
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              @click="loadInboundWaitingList"
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
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              새로고침
            </button>

            <div class="text-sm text-gray-600">
              입고 대기:
              <span class="font-medium text-blue-600"
                >{{ inboundWaitingList.length }}건</span
              >
            </div>
          </div>

          <div class="flex gap-2">
            <button
              v-if="canManageLogistics"
              :disabled="!hasSelectedItems"
              class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="processSelectedItems"
            >
              입고 ({{ selectedItemsCount }}건)
            </button>
            <div
              v-else
              class="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded border border-orange-200"
            >
              조회 전용 (입고 권한 없음)
            </div>
          </div>
        </div>

        <!-- 입고 대기 목록 테이블 -->
        <div
          class="flex-1 overflow-auto border border-gray-200 rounded mb-4"
          style="height: calc(100% - 200px)"
        >
          <table class="w-full text-xs border-collapse bg-white">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  v-if="canManageLogistics"
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-12"
                >
                  <input
                    v-model="selectAll"
                    type="checkbox"
                    class="rounded"
                    @change="toggleSelectAll"
                  />
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-24"
                >
                  요청일자
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-24"
                >
                  제품코드
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-32"
                >
                  제품명
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-24"
                >
                  규격
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-16"
                >
                  단위
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  수량
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 로딩 상태 -->
              <tr v-if="isLoading">
                <td
                  :colspan="canManageLogistics ? 7 : 6"
                  class="text-center text-gray-500 py-8"
                >
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
                    />
                    데이터를 불러오는 중...
                  </div>
                </td>
              </tr>

              <!-- 데이터 없음 -->
              <tr v-else-if="inboundWaitingList.length === 0">
                <td
                  :colspan="canManageLogistics ? 7 : 6"
                  class="text-center text-gray-500 py-8"
                >
                  입고 대기 중인 제품이 없습니다.
                </td>
              </tr>

              <!-- 데이터 행들 -->
              <tr
                v-for="(item, index) in inboundWaitingList"
                v-else
                :key="`${item.result_id}-${item.product_code}`"
                class="hover:bg-gray-50"
              >
                <td
                  v-if="canManageLogistics"
                  class="border border-gray-200 px-2 py-2 text-center"
                >
                  <input
                    v-model="item.selected"
                    type="checkbox"
                    class="rounded"
                  />
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.request_date }}
                </td>
                <td class="border border-gray-200 px-2 py-2 font-mono text-xs">
                  {{ item.product_code }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.product_name }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.product_stand || "-" }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.product_unit || "-" }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ formatNumber(item.inbound_qty) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 하단 정보 -->
        <div class="flex justify-between items-center text-xs text-gray-600">
          <div>전체 {{ inboundWaitingList.length }}건</div>
        </div>
      </div>

      <!-- 입고 완료 탭 -->
      <div v-else-if="activeTab === 'completed'" class="h-full">
        <!-- 검색 영역 -->
        <div class="grid grid-cols-5 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >LOT번호</label
            >
            <input
              v-model="completedSearch.lot_num"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="LOT번호 검색"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >제품명</label
            >
            <input
              v-model="completedSearch.product_name"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="제품명 검색"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >제품코드</label
            >
            <input
              v-model="completedSearch.product_code"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="제품코드 검색"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >입고일자</label
            >
            <input
              v-model="completedSearch.inbound_date"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              class="px-4 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              @click="loadInboundCompletedList"
            >
              검색
            </button>
            <button
              class="px-4 py-1.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
              @click="resetCompletedSearch"
            >
              초기화
            </button>
          </div>
        </div>

        <!-- 상단 버튼 영역 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <button
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              @click="loadInboundCompletedList"
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
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              새로고침
            </button>

            <div class="text-sm text-gray-600">
              입고 완료:
              <span class="font-medium text-green-600"
                >{{ inboundCompletedList.length }}건</span
              >
            </div>
          </div>
        </div>

        <!-- 입고 완료 목록 테이블 -->
        <div
          class="flex-1 overflow-auto border border-gray-200 rounded mb-4"
          style="height: calc(100% - 200px)"
        >
          <table class="w-full text-xs border-collapse bg-white">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-24"
                >
                  입고일
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-24"
                >
                  유통기한
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-24"
                >
                  제품코드
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-32"
                >
                  제품명
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-24"
                >
                  규격
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-16"
                >
                  단위
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  수량
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-32"
                >
                  완제품LOT
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 로딩 상태 -->
              <tr v-if="isLoadingCompleted">
                <td colspan="8" class="text-center text-gray-500 py-8">
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
                    />
                    데이터를 불러오는 중...
                  </div>
                </td>
              </tr>

              <!-- 데이터 없음 -->
              <tr v-else-if="inboundCompletedList.length === 0">
                <td colspan="8" class="text-center text-gray-500 py-8">
                  입고 완료된 제품이 없습니다.
                </td>
              </tr>

              <!-- 데이터 행들 -->
              <tr
                v-for="(item, index) in inboundCompletedList"
                v-else
                :key="`${item.lot_num}`"
                class="hover:bg-gray-50"
              >
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ formatDate(item.inbound_date) }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.expiry_date }}
                </td>
                <td class="border border-gray-200 px-2 py-2 font-mono text-xs">
                  {{ item.product_code }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.product_name }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.product_stand || "-" }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.product_unit || "-" }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ formatNumber(item.quantity) }}
                </td>
                <td class="border border-gray-200 px-2 py-2 font-mono text-xs">
                  {{ item.lot_num }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 하단 정보 -->
        <div class="flex justify-between items-center text-xs text-gray-600">
          <div>전체 {{ inboundCompletedList.length }}건</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

// 권한(물류)
const canManageLogistics = computed(() => authStore.canManageLogistics);

// 상태 관리
const activeTab = ref("waiting");
const isLoading = ref(false);
const isLoadingCompleted = ref(false);
const inboundWaitingList = ref([]);
const inboundCompletedList = ref([]);

const waitingSearch = ref({
  result_id: "",
  product_name: "",
  product_code: "",
  request_date: "",
});
const completedSearch = ref({
  lot_num: "",
  product_name: "",
  product_code: "",
  inbound_date: "",
});

// 선택 관련
const selectAll = ref(false);

const hasSelectedItems = computed(() =>
  inboundWaitingList.value.some((item) => item.selected),
);
const selectedItemsCount = computed(
  () => inboundWaitingList.value.filter((item) => item.selected).length,
);

// 날짜 포맷
const formatDate = (dateTimeString) => {
  if (!dateTimeString) return "-";
  return dateTimeString.split(" ")[0];
};
const formatNumber = (value) => {
  if (!value && value !== 0) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
};
const toggleSelectAll = () => {
  inboundWaitingList.value.forEach((item) => {
    item.selected = selectAll.value;
  });
};

const resetWaitingSearch = () => {
  waitingSearch.value = {
    result_id: "",
    product_name: "",
    product_code: "",
    request_date: "",
  };
  loadInboundWaitingList();
};
const resetCompletedSearch = () => {
  completedSearch.value = {
    lot_num: "",
    product_name: "",
    product_code: "",
    inbound_date: "",
  };
  loadInboundCompletedList();
};

// 입고 대기 목록 조회
const loadInboundWaitingList = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get("/productInbound/waiting-list", {
      params: waitingSearch.value,
    });
    inboundWaitingList.value = response.data.map((item) => ({
      ...item,
      selected: false,
      isProcessing: false,
    }));
    selectAll.value = false;
  } catch (error) {
    let errorMessage = "입고 대기 목록을 불러오는데 실패했습니다.";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    alert(errorMessage);
    inboundWaitingList.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 입고 완료 목록 조회
const loadInboundCompletedList = async () => {
  isLoadingCompleted.value = true;
  try {
    const response = await axios.get("/productInbound/completed-list", {
      params: completedSearch.value,
    });
    inboundCompletedList.value = response.data;
  } catch (error) {
    let errorMessage = "입고 완료 목록을 불러오는데 실패했습니다.";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    alert(errorMessage);
    inboundCompletedList.value = [];
  } finally {
    isLoadingCompleted.value = false;
  }
};

// 선택된 제품들 일괄 입고 처리
const processSelectedItems = async () => {
  const selectedItems = inboundWaitingList.value.filter(
    (item) => item.selected,
  );
  if (selectedItems.length === 0) {
    alert("입고 처리할 제품을 선택해주세요.");
    return;
  }
  const confirmed = confirm(
    `선택된 ${selectedItems.length}건의 제품을 일괄 입고 처리하시겠습니까?`,
  );
  if (!confirmed) return;

  try {
    selectedItems.forEach((item) => {
      item.isProcessing = true;
    });
    const products = selectedItems.map((item) => ({
      result_id: item.result_id,
      product_code: item.product_code,
      inbound_qty: item.inbound_qty,
      manufacture_datetime: item.manufacture_datetime,
      work_order_no: item.work_order_no,
    }));
    const response = await axios.post("/productInbound/process-multiple", {
      products,
    });
    const { success_count, error_count, results, errors } = response.data;

    // 성공한 제품들 목록에서 제거
    if (results && results.length > 0) {
      results.forEach((result) => {
        const index = inboundWaitingList.value.findIndex(
          (item) =>
            item.result_id === result.result_id &&
            item.product_code === result.product_code,
        );
        if (index > -1) inboundWaitingList.value.splice(index, 1);
      });
    }
    let message = `일괄 입고 처리 완료\n성공: ${success_count}건`;
    if (error_count > 0) {
      message += `\n실패: ${error_count}건`;
      if (errors && errors.length > 0) {
        message += "\n\n실패 상세:";
        errors.forEach((error) => {
          message += `\n- ${error.product_code}: ${error.error}`;
        });
      }
    }
    alert(message);
    selectAll.value = false;
  } catch (error) {
    let errorMessage = "일괄 입고 처리 중 오류가 발생했습니다.";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    alert(errorMessage);
  } finally {
    selectedItems.forEach((item) => {
      item.isProcessing = false;
    });
  }
};

// 탭 변경 시 데이터 로드
const handleTabChange = () => {
  if (activeTab.value === "waiting") {
    loadInboundWaitingList();
  } else if (activeTab.value === "completed") {
    loadInboundCompletedList();
  }
};

// 마운트 시 권한 안내 및 데이터 로드
onMounted(() => {
  if (!canManageLogistics.value) {
    alert("조회만 가능합니다. 입고 처리 권한이 없습니다.");
  }
  loadInboundWaitingList();
});

// 탭 변경 감시
watch(activeTab, handleTabChange);
</script>

<style scoped>
input,
select,
button {
  transition: all 0.15s ease-in-out;
}
input:focus,
select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
button {
  transition: all 0.15s ease-in-out;
}
</style>
