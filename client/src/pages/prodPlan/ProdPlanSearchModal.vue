<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg w-[700px] h-[500px] flex flex-col">
      <!-- 헤더 -->
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold">생산계획 선택</h3>
        <button @click="$emit('close')" class="text-xl">&times;</button>
      </div>

      <!-- 검색 -->
      <div class="p-4 border-b">
        <input
          v-model="searchTerm"
          @input="searchPlans"
          placeholder="계획 ID 또는 제품명"
          class="w-full px-3 py-2 border"
        />
      </div>

      <!-- 결과 테이블 -->
      <div class="flex-1 overflow-auto p-4">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="border p-2">계획 ID</th>
              <th class="border p-2">제품정보요약</th>
              <th class="border p-2">총 수량</th>
              <th class="border p-2">시작예정일</th>
              <th class="border p-2">종료예정일</th>
              <th class="border p-2">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in searchResults" :key="plan.plan_id">
              <td class="border p-2">{{ plan.plan_id }}</td>
              <td class="border p-2">{{ plan.product_summary }}</td>
              <td class="border p-2">{{ plan.total_qty }}</td>
              <td class="border p-2">{{ formatDate(plan.plan_start_dt) }}</td>
              <td class="border p-2">{{ formatDate(plan.plan_end_dt) }}</td>
              <td class="border p-2 text-center">
                <button
                  @click="$emit('select', plan)"
                  class="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  선택
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

defineEmits(["select", "close"]);

const searchTerm = ref("");
const searchResults = ref([]);

const searchPlans = async () => {
  try {
    const res = await axios.get("/prodPlan/search", {
      params: { q: searchTerm.value },
    });
    searchResults.value = res.data || [];
  } catch (err) {
    searchResults.value = [];
  }
};

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR");
};

onMounted(() => {
  searchPlans(); // 전체 목록 로드
});
</script>
