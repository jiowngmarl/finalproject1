<template>
  <div class="max-w-[1060px] h-[739px] mx-auto p-4 bg-gray-50 overflow-hidden">
    <!-- 상단 타이틀 -->
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-gray-800">생산계획 조회</h1>
    </div>

    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      style="height: calc(100% - 60px)"
    >
      <!-- 검색 영역 -->
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-5 gap-3 mb-3">
          <!-- 계획번호 검색 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >계획번호</label
            >
            <input
              v-model="searchParams.plan_id"
              @keypress.enter="searchPlans"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="계획번호 검색"
            />
          </div>

          <!-- 계획명 검색 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >계획명</label
            >
            <input
              v-model="searchParams.plan_name"
              @keypress.enter="searchPlans"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="계획명 검색"
            />
          </div>

          <!-- 제품명 검색 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >제품명</label
            >
            <input
              v-model="searchParams.product_name"
              @keypress.enter="searchPlans"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="제품명 검색"
            />
          </div>

          <!-- 작성일 시작 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >시작예정일</label
            >
            <input
              v-model="searchParams.start_date"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- 작성일 종료 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >종료예정일</label
            >
            <input
              v-model="searchParams.end_date"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 검색 버튼 -->
        <div class="flex gap-2 justify-center">
          <button
            @click="searchPlans"
            class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium"
            :disabled="loading"
          >
            <span v-if="loading">검색중...</span>
            <span v-else>검색</span>
          </button>
          <button
            @click="resetSearch"
            class="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors font-medium"
          >
            초기화
          </button>
        </div>
      </div>

      <!-- 결과 개수 -->
      <div class="mb-3 flex justify-between items-center">
        <div class="text-sm text-gray-600">
          총
          <span class="font-semibold text-blue-600">{{ planList.length }}</span
          >건
        </div>
      </div>

      <!-- 생산계획 목록 테이블 -->
      <div
        class="flex-1 overflow-auto border border-gray-200 rounded"
        style="height: calc(100% - 200px)"
      >
        <table class="w-full text-xs border-collapse bg-white">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">계획번호</th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[150px]">계획명</th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[280px]">제품정보</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[80px]">총수량</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[100px]">작성일</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[100px]">시작예정일</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[100px]">종료예정일</th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[60px]">작성자</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center text-gray-500 py-8">
                검색중입니다...
              </td>
            </tr>
            <tr v-else-if="planList.length === 0">
              <td colspan="8" class="text-center text-gray-500 py-8">
                조회된 생산계획이 없습니다.
              </td>
            </tr>
            <tr
              v-else
              v-for="(plan, index) in planList"
              :key="plan.plan_id"
              class="hover:bg-blue-50 cursor-pointer"
              @dblclick="viewPlanDetail(plan)"
            >
              <td class="border border-gray-200 px-3 py-2">
                <span class="text font-medium">{{ plan.product_summary }}</span>
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                <span class="font-semibold">{{
                  formatNumber(plan.total_qty)
                }}</span>
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                {{ formatDate(plan.plan_reg_dt) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                {{ formatDate(plan.plan_start_dt) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                {{ formatDate(plan.plan_end_dt) }}
              </td>
              <td class="border border-gray-200 px-3 py-2">
                {{ plan.writer_name }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 상세보기 모달 -->
    <PlanDetailModal
      v-if="showDetailModal"
      :plan-id="selectedPlanId"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// 모달 컴포넌트 (필요시 생성)
// import PlanDetailModal from './PlanDetailModal.vue'

// 상태 관리
const loading = ref(false);
const planList = ref([]);
const showDetailModal = ref(false);
const selectedPlanId = ref("");

// 검색 파라미터
const searchParams = ref({
  plan_id: "",
  plan_name: "",
  product_name: "",
  start_date: "",
  end_date: "",
});

// 메서드들
const searchPlans = async () => {
  loading.value = true;
  try {
    // 모든 검색 조건이 비어있으면 빈 파라미터로 전체 조회
    const params = new URLSearchParams();
    Object.keys(searchParams.value).forEach((key) => {
      if (searchParams.value[key]) {
        params.append(key, searchParams.value[key]);
      }
    });

    // 검색 조건이 없어도 전체 조회
    const response = await axios.get(
      `/prodPlan/integrated/list?${params.toString()}`,
    );
    planList.value = response.data || [];
  } catch (err) {
    alert("생산계획 조회에 실패했습니다.");
    planList.value = [];
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  searchParams.value = {
    plan_id: "",
    plan_name: "",
    product_name: "",
    start_date: "",
    end_date: "",
  };
  planList.value = [];
};

const viewPlanDetail = (plan) => {
  selectedPlanId.value = plan.plan_id;
  showDetailModal.value = true;
};

// 유틸리티 함수들
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatNumber = (number) => {
  if (!number && number !== 0) return "";
  return number.toLocaleString();
};

// 컴포넌트 마운트 시 전체 목록 조회 (검색조건 없이)
onMounted(() => {
  searchPlans(); // 빈 검색조건으로 전체 조회
});
</script>

<style scoped>
/* 테이블 스크롤바 스타일링 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 테이블 행 hover 효과 */
tbody tr:hover {
  background-color: #eff6ff !important;
}

/* 입력 필드 포커스 효과 */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 버튼 트랜지션 */
button {
  transition: all 0.15s ease-in-out;
}
</style>
