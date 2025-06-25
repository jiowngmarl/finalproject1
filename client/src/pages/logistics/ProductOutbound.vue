<template>
  <div class="max-w-[1060px] h-[739px] mx-auto p-4 bg-gray-50 overflow-hidden">
    <!-- 상단 타이틀 -->
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-gray-800">제품 출고 관리</h1>
    </div>

    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      style="height: calc(100% - 60px)"
    >
      <!-- 탭 메뉴 -->
      <div class="flex border-b border-gray-200 mb-4">
        <button
          @click="activeTab = 'waiting'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'waiting'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
        >
          출고 대기 목록
        </button>
        <button
          @click="activeTab = 'completed'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'completed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
        >
          출고 완료
        </button>
      </div>

      <!-- 출고 대기 탭 -->
      <div v-if="activeTab === 'waiting'" class="h-full">
        <!-- 검색 영역 -->
        <div class="grid grid-cols-6 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >거래처</label
            >
            <input
              v-model="waitingSearch.client_name"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="거래처명 검색"
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
              >주문일(시작)</label
            >
            <input
              v-model="waitingSearch.order_date_start"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >주문일(종료)</label
            >
            <input
              v-model="waitingSearch.order_date_end"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >납기일(시작)</label
            >
            <input
              v-model="waitingSearch.delivery_date_start"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >납기일(종료)</label
            >
            <input
              v-model="waitingSearch.delivery_date_end"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 검색 버튼 영역 -->
        <div class="flex justify-center gap-2 mb-4">
          <button
            @click="loadOutboundWaitingList"
            class="px-6 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
          <button
            @click="resetWaitingSearch"
            class="px-6 py-1.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
          >
            초기화
          </button>
        </div>

        <!-- 상단 버튼 영역 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <button
              @click="loadOutboundWaitingList"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                <path
                  d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                ></path>
                <path d="M21 3v5h-5"></path>
                <path
                  d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                ></path>
                <path d="M3 21v-5h5"></path>
              </svg>
              새로고침
            </button>

            <div class="text-sm text-gray-600">
              출고 대기:
              <span class="font-medium text-blue-600"
                >{{ outboundWaitingList.length }}건</span
              >
            </div>
          </div>

          <div class="flex gap-2">
            <button
              v-if="authStore.canManageLogistics"
              @click="processSelectedItems"
              :disabled="!hasSelectedItems || isProcessing"
              class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <div
                v-if="isProcessing"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
              ></div>
              {{
                isProcessing ? "처리중..." : `출고 (${selectedItemsCount}건)`
              }}
            </button>
            <div
              v-else
              class="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded border border-orange-200"
            >
              조회 전용 (출고 권한 없음)
            </div>
          </div>
        </div>

        <!-- 출고 대기 목록 테이블 -->
        <div
          class="flex-1 overflow-auto border border-gray-200 rounded mb-4"
          style="height: calc(100% - 250px)"
        >
          <table class="w-full text-xs border-collapse bg-white">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  v-if="authStore.canManageLogistics"
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-12"
                >
                  <input
                    type="checkbox"
                    v-model="selectAll"
                    @change="toggleSelectAll"
                    class="rounded"
                  />
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  주문일
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-24"
                >
                  주문번호
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-32"
                >
                  제품명
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  규격
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  수량
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-24"
                >
                  거래처
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  납기일
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 로딩 상태 -->
              <tr v-if="isLoading">
                <td
                  :colspan="authStore.canManageLogistics ? 8 : 7"
                  class="text-center text-gray-500 py-8"
                >
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
                    ></div>
                    데이터를 불러오는 중...
                  </div>
                </td>
              </tr>

              <!-- 데이터 없음 -->
              <tr v-else-if="outboundWaitingList.length === 0">
                <td
                  :colspan="authStore.canManageLogistics ? 8 : 7"
                  class="text-center text-gray-500 py-8"
                >
                  출고 대기 중인 제품이 없습니다.
                </td>
              </tr>

              <!-- 데이터 행들 -->
              <tr
                v-else
                v-for="(item, index) in outboundWaitingList"
                :key="`${item.order_id}-${item.product_code}`"
                class="hover:bg-gray-50"
              >
                <td
                  v-if="authStore.canManageLogistics"
                  class="border border-gray-200 px-2 py-2 text-center"
                >
                  <input
                    type="checkbox"
                    v-model="item.selected"
                    class="rounded"
                  />
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.order_date }}
                </td>
                <td
                  class="border border-gray-200 px-2 py-2 text-center font-mono text-xs"
                >
                  {{ item.order_number }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.product_name }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.product_stand }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ formatNumber(item.quantity) }} {{ item.unit }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.client_name }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.delivery_date }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 하단 정보 -->
        <div class="flex justify-between items-center text-xs text-gray-600">
          <div>전체 {{ outboundWaitingList.length }}건</div>
        </div>
      </div>

      <!-- 출고 완료 탭 -->
      <div v-else-if="activeTab === 'completed'" class="h-full">
        <!-- 검색 영역 -->
        <div class="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >거래처</label
            >
            <input
              v-model="completedSearch.client_name"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="거래처명 검색"
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
              >출고일(시작)</label
            >
            <input
              v-model="completedSearch.outbound_date_start"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >출고일(종료)</label
            >
            <input
              v-model="completedSearch.outbound_date_end"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 검색 버튼 영역 -->
        <div class="flex justify-center gap-2 mb-4">
          <button
            @click="loadOutboundCompletedList"
            class="px-6 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
          <button
            @click="resetCompletedSearch"
            class="px-6 py-1.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
          >
            초기화
          </button>
        </div>

        <!-- 상단 버튼 영역 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <button
              @click="loadOutboundCompletedList"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                <path
                  d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                ></path>
                <path d="M21 3v5h-5"></path>
                <path
                  d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                ></path>
                <path d="M3 21v-5h5"></path>
              </svg>
              새로고침
            </button>

            <div class="text-sm text-gray-600">
              출고 완료:
              <span class="font-medium text-green-600"
                >{{ outboundCompletedList.length }}건</span
              >
            </div>
          </div>
        </div>

        <!-- 출고 완료 목록 테이블 -->
        <div
          class="flex-1 overflow-auto border border-gray-200 rounded mb-4"
          style="height: calc(100% - 200px)"
        >
          <table class="w-full text-xs border-collapse bg-white">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  출고일
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-28"
                >
                  출고번호
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-32"
                >
                  제품명
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  규격
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-20"
                >
                  수량
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-left font-medium text-gray-700 w-24"
                >
                  거래처
                </th>
                <th
                  class="border border-gray-200 px-2 py-2 text-center font-medium text-gray-700 w-24"
                >
                  LOT
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 로딩 상태 -->
              <tr v-if="isLoadingCompleted">
                <td colspan="7" class="text-center text-gray-500 py-8">
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
                    ></div>
                    데이터를 불러오는 중...
                  </div>
                </td>
              </tr>

              <!-- 데이터 없음 -->
              <tr v-else-if="outboundCompletedList.length === 0">
                <td colspan="7" class="text-center text-gray-500 py-8">
                  출고 완료된 제품이 없습니다.
                </td>
              </tr>

              <!-- 데이터 행들 -->
              <tr
                v-else
                v-for="(item, index) in outboundCompletedList"
                :key="item.outbound_code"
                class="hover:bg-gray-50"
              >
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.outbound_date }}
                </td>
                <td
                  class="border border-gray-200 px-2 py-2 text-center font-mono text-xs"
                >
                  {{ item.outbound_code }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.product_name }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ item.product_stand }}
                </td>
                <td class="border border-gray-200 px-2 py-2 text-center">
                  {{ formatNumber(item.outbound_qty) }} {{ item.unit }}
                </td>
                <td class="border border-gray-200 px-2 py-2">
                  {{ item.client_name }}
                </td>
                <td
                  class="border border-gray-200 px-2 py-2 text-center font-mono text-xs"
                >
                  {{ item.lot_num }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 하단 정보 -->
        <div class="flex justify-between items-center text-xs text-gray-600">
          <div>전체 {{ outboundCompletedList.length }}건</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
// 권한 스토어
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

// 상태 관리
const activeTab = ref("waiting");
const isLoading = ref(false);
const isLoadingCompleted = ref(false);
const isProcessing = ref(false);
const outboundWaitingList = ref([]);
const outboundCompletedList = ref([]);
const selectAll = ref(false);

// 검색 조건
const waitingSearch = ref({
  client_name: "",
  product_name: "",
  order_date_start: "",
  order_date_end: "",
  delivery_date_start: "",
  delivery_date_end: "",
});

const completedSearch = ref({
  client_name: "",
  product_name: "",
  outbound_date_start: "",
  outbound_date_end: "",
});

// 계산된 속성
const hasSelectedItems = computed(() =>
  outboundWaitingList.value.some((item) => item.selected),
);

const selectedItemsCount = computed(
  () => outboundWaitingList.value.filter((item) => item.selected).length,
);

// 유틸리티 함수
const formatNumber = (val) => {
  if (val == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(val);
};

const toggleSelectAll = () => {
  outboundWaitingList.value.forEach((item) => {
    item.selected = selectAll.value;
  });
};

// 검색 초기화
const resetWaitingSearch = () => {
  waitingSearch.value = {
    client_name: "",
    product_name: "",
    order_date_start: "",
    order_date_end: "",
    delivery_date_start: "",
    delivery_date_end: "",
  };
  loadOutboundWaitingList();
};

const resetCompletedSearch = () => {
  completedSearch.value = {
    client_name: "",
    product_name: "",
    outbound_date_start: "",
    outbound_date_end: "",
  };
  loadOutboundCompletedList();
};

// 출고 대기 목록 조회 (표준화된 API 응답 처리)
const loadOutboundWaitingList = async () => {
  isLoading.value = true;
  try {
    console.log("=== 출고 대기 목록 조회 시작 ===");
    console.log("Search params:", waitingSearch.value);

    const response = await axios.get("/productOutbound/waiting-list", {
      params: waitingSearch.value,
    });

    console.log("API Response:", response.data);

    // 표준화된 API 응답 처리
    if (response.data.success) {
      outboundWaitingList.value = (response.data.data || []).map((item) => ({
        ...item,
        selected: false,
      }));
      console.log(`조회 결과: ${response.data.count}건 (응답 성공)`);
    } else {
      // 오류 응답 처리
      console.error("API 응답 오류:", response.data.error);
      throw new Error(response.data.error || "출고 대기 목록 조회 실패");
    }

    selectAll.value = false;
  } catch (err) {
    console.error("출고 대기 목록 조회 오류:", err);

    // 백엔드에서 제공하는 상세 오류 정보 활용
    let errorMessage = "출고 대기 목록 불러오기 실패";
    if (err.response?.data) {
      const errorData = err.response.data;
      errorMessage = errorData.error || errorMessage;

      // 특정 오류 코드별 처리
      if (errorData.error_code === "GET_WAITING_LIST_FAILED") {
        errorMessage = "출고 대기 목록 조회 중 서버 오류가 발생했습니다.";
      }
    }

    alert(errorMessage);
    outboundWaitingList.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 출고 완료 목록 조회 (표준화된 API 응답 처리)
const loadOutboundCompletedList = async () => {
  isLoadingCompleted.value = true;
  try {
    console.log("=== 출고 완료 목록 조회 시작 ===");
    console.log("Search params:", completedSearch.value);

    const response = await axios.get("/productOutbound/completed-list", {
      params: completedSearch.value,
    });

    console.log("API Response:", response.data);

    // 표준화된 API 응답 처리
    if (response.data.success) {
      outboundCompletedList.value = response.data.data || [];
      console.log(`조회 결과: ${response.data.count}건 (응답 성공)`);
    } else {
      console.error("API 응답 오류:", response.data.error);
      throw new Error(response.data.error || "출고 완료 목록 조회 실패");
    }
  } catch (err) {
    console.error("출고 완료 목록 조회 오류:", err);

    // 백엔드에서 제공하는 상세 오류 정보 활용
    let errorMessage = "출고 완료 목록 불러오기 실패";
    if (err.response?.data) {
      const errorData = err.response.data;
      errorMessage = errorData.error || errorMessage;

      // 특정 오류 코드별 처리
      if (errorData.error_code === "GET_COMPLETED_LIST_FAILED") {
        errorMessage = "출고 완료 목록 조회 중 서버 오류가 발생했습니다.";
      }
    }

    alert(errorMessage);
    outboundCompletedList.value = [];
  } finally {
    isLoadingCompleted.value = false;
  }
};

// 선택된 제품들 출고 처리 (최신 백엔드 API 활용)
const processSelectedItems = async () => {
  // 권한 체크
  if (!authStore.canManageLogistics) {
    alert(authStore.getPermissionMessage("logistics"));
    return;
  }

  const selectedItems = outboundWaitingList.value.filter(
    (item) => item.selected,
  );

  if (selectedItems.length === 0) {
    alert("출고 처리할 제품을 선택해주세요.");
    return;
  }

  if (!confirm(`${selectedItems.length}건의 제품을 출고 처리하시겠습니까?`)) {
    return;
  }

  isProcessing.value = true;

  try {
    console.log("=== 출고 처리 시작 ===");
    console.log("Selected items:", selectedItems);
    console.log(
      "처리자:",
      authStore.user?.employee_name || authStore.user?.employee_id,
    );

    // 백엔드 API에 맞는 제품 데이터 구성
    const products = selectedItems.map((item) => ({
      order_id: item.order_id,
      order_detail_id: item.order_detail_id,
      product_code: item.product_code,
      product_name: item.product_name,
      product_stand: item.product_stand,
      quantity: item.quantity,
    }));

    console.log("Products for processing:", products);

    // 1. 선택된 제품들 재고 체크 (백엔드의 새로운 API 활용)
    console.log("선택된 제품들 재고 체크 시작...");
    const inventoryCheckResponse = await axios.post(
      "/productOutbound/check-selected-inventory",
      {
        products: products,
      },
    );

    console.log("Inventory check response:", inventoryCheckResponse.data);

    const inventoryData = inventoryCheckResponse.data;

    // 표준화된 응답 처리
    if (!inventoryData.success) {
      throw new Error(
        inventoryData.error || "재고 확인 중 오류가 발생했습니다.",
      );
    }

    if (inventoryData.has_shortage) {
      const shortageMessage = inventoryData.shortage_items
        .map(
          (item) =>
            `${item.product_name}: 필요 수량 ${item.required_qty}, 재고 ${
              item.available_qty
            } (부족: ${item.required_qty - item.available_qty})`,
        )
        .join("\n");

      alert(`재고 부족으로 출고할 수 없습니다:\n${shortageMessage}`);
      return;
    }

    console.log("재고 체크 완료 - 출고 가능");

    // 2. 일괄 출고 처리
    console.log("일괄 출고 처리 시작...");
    const outboundResponse = await axios.post(
      "/productOutbound/process-products",
      {
        products,
        employee_id: authStore.user?.employee_id || null, // 실제 로그인한 사용자의 employee_id 사용
      },
    );

    console.log("Outbound response:", outboundResponse.data);

    // 3. 결과 처리 (표준화된 응답 구조 활용)
    const result = outboundResponse.data;

    if (result.success) {
      // 성공한 제품들만 목록에서 제거
      const successfulProducts = result.results
        .filter((r) => r.success)
        .map((r) => `${r.order_id}-${r.product_code}`);

      outboundWaitingList.value = outboundWaitingList.value.filter(
        (item) =>
          !successfulProducts.includes(`${item.order_id}-${item.product_code}`),
      );

      selectAll.value = false;

      // 출고 완료 탭이 활성화되어 있으면 새로고침
      if (activeTab.value === "completed") {
        await loadOutboundCompletedList();
      }

      // 결과 메시지 표시 (백엔드 summary 정보 활용)
      if (result.summary) {
        const { total, success, failure, success_rate } = result.summary;
        let message = `출고 처리 완료\n총 ${total}건 중 ${success}건 성공, ${failure}건 실패 (성공률: ${success_rate})`;

        if (failure > 0) {
          const failedItems = result.results.filter((r) => !r.success);
          const failedMessages = failedItems
            .map(
              (item) =>
                `${item.product_name || item.product_code}: ${item.error}`,
            )
            .join("\n");
          message += `\n\n실패한 항목:\n${failedMessages}`;
        }

        alert(message);
      } else {
        alert("출고 처리가 완료되었습니다.");
      }
    } else {
      // 실패 처리 (백엔드 error_code 활용)
      if (
        result.error_code === "INSUFFICIENT_INVENTORY" &&
        result.shortage_items
      ) {
        const shortageMessage = result.shortage_items
          .map(
            (item) =>
              `${item.product_name}: 필요 수량 ${item.required_qty}, 재고 ${item.available_qty} (부족: ${item.shortage_qty})`,
          )
          .join("\n");

        alert(`재고 부족으로 출고할 수 없습니다:\n${shortageMessage}`);
      } else {
        alert(
          `출고 처리 실패: ${
            result.message || "알 수 없는 오류가 발생했습니다."
          }`,
        );
      }
    }
  } catch (err) {
    console.error("출고 처리 오류:", err);

    // 백엔드에서 제공하는 상세 오류 정보 활용
    if (err.response?.data) {
      const errorData = err.response.data;

      // 재고 부족 에러 특별 처리
      if (
        errorData.error_code === "INSUFFICIENT_INVENTORY" &&
        errorData.shortage_items
      ) {
        const shortageMessage = errorData.shortage_items
          .map(
            (item) =>
              `${item.product_name}: 필요 수량 ${item.required_qty}, 재고 ${item.available_qty} (부족: ${item.shortage_qty})`,
          )
          .join("\n");

        alert(`재고 부족으로 출고할 수 없습니다:\n${shortageMessage}`);
      } else if (errorData.error_code === "CHECK_SELECTED_INVENTORY_FAILED") {
        alert("선택된 제품들의 재고 확인 중 오류가 발생했습니다.");
      } else if (errorData.error_code === "PROCESS_PRODUCTS_FAILED") {
        alert("일괄 출고 처리 중 시스템 오류가 발생했습니다.");
      } else if (errorData.error_code === "INVALID_PRODUCTS_ARRAY") {
        alert("출고 처리할 제품 정보가 올바르지 않습니다.");
      } else if (errorData.error_code === "MISSING_EMPLOYEE_ID") {
        alert("직원 정보가 필요합니다. 다시 로그인해주세요.");
      } else {
        // 일반적인 오류 처리
        const errorMsg =
          errorData.error || "제품 출고 처리 중 오류가 발생했습니다.";
        alert(errorMsg);
      }
    } else {
      alert("네트워크 오류가 발생했습니다. 연결 상태를 확인해주세요.");
    }
  } finally {
    isProcessing.value = false;
  }
};

// 탭 변경 처리
const handleTabChange = () => {
  if (activeTab.value === "waiting") {
    loadOutboundWaitingList();
  } else if (activeTab.value === "completed") {
    loadOutboundCompletedList();
  }
};

// 라이프사이클
onMounted(() => {
  console.log("제품 출고 관리 컴포넌트 마운트됨");
  console.log("현재 사용자:", authStore.user?.employee_name || "미로그인");
  console.log("물류 권한:", authStore.canManageLogistics);

  // 권한 체크 후 안내 메시지
  if (!authStore.canManageLogistics) {
    alert("조회만 가능합니다. 출고 처리 권한이 없습니다.");
  }

  // 모든 사용자가 데이터 조회 가능
  loadOutboundWaitingList();
});

// 감시자
watch(activeTab, handleTabChange);

// selectAll 변경 감시
watch(selectAll, (newVal) => {
  if (newVal !== undefined) {
    toggleSelectAll();
  }
});

// 개별 체크박스 변경 감시
watch(
  () => outboundWaitingList.value.map((item) => item.selected),
  (newSelections) => {
    const selectedCount = newSelections.filter(Boolean).length;
    const totalCount = newSelections.length;

    if (selectedCount === 0) {
      selectAll.value = false;
    } else if (selectedCount === totalCount) {
      selectAll.value = true;
    } else {
      selectAll.value = false;
    }
  },
  { deep: true },
);
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
