<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg w-[800px] h-[500px] flex flex-col">
      <!-- 헤더 -->
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold">주문 검색</h3>
        <button class="text-xl" @click="$emit('close')">&times;</button>
      </div>

      <!-- 검색 -->
      <div class="p-4 border-b">
        <input
          v-model="searchTerm"
          placeholder="주문번호, 제품명으로 검색"
          class="w-full px-3 py-2 border"
          @input="searchOrders"
        />
      </div>

      <!-- 결과 테이블 -->
      <div class="flex-1 overflow-auto p-4">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="border p-2">주문번호</th>
              <th class="border p-2">제품정보</th>
              <th class="border p-2">총수량</th>
              <th class="border p-2">주문일</th>
              <th class="border p-2">납기일</th>
              <th class="border p-2">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="border p-4 text-center">검색 중...</td>
            </tr>
            <tr v-else-if="orderList.length === 0">
              <td colspan="6" class="border p-4 text-center text-gray-500">
                등록된 주문이 없습니다.
              </td>
            </tr>
            <tr v-for="order in orderList" v-else :key="order.order_id">
              <td class="border p-2">
                {{ order.order_id }}
              </td>
              <td class="border p-2">
                {{ order.product_summary }}
              </td>
              <td class="border p-2">
                {{ formatNumber(order.total_qty) }}
              </td>
              <td class="border p-2">
                {{ formatDate(order.order_date) }}
              </td>
              <td class="border p-2">
                {{ formatDate(order.delivery_date) }}
              </td>
              <td class="border p-2 text-center">
                <button
                  class="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                  @click="$emit('select', order)"
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

// Emits
defineEmits(["select", "close"]);

// 반응형 데이터
const searchTerm = ref("");
const orderList = ref([]);
const loading = ref(false);

// 메서드들
const searchOrders = async () => {
  loading.value = true;
  console.log("주문 검색 시작:", searchTerm.value); // 디버깅

  try {
    const response = await axios.get("/prodPlan/orders/search", {
      params: { q: searchTerm.value },
    });

    if (response.data) {
      orderList.value = response.data;
      console.log("설정된 주문 목록:", orderList.value); // 디버깅
    } else {
      orderList.value = [];
      console.log("응답 데이터가 없음"); // 디버깅
    }
  } catch (error) {
    console.error("주문 검색 오류:", error);
    console.error("에러 상세:", error.response); // 디버깅
    orderList.value = [];
  } finally {
    loading.value = false;
  }
};

// 유틸리티 함수들
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR");
};

const formatNumber = (number) => {
  if (!number) return "0";
  return number.toLocaleString();
};

// 컴포넌트 마운트 시 초기 검색 (전체 목록)
onMounted(() => {
  searchOrders();
});
</script>
