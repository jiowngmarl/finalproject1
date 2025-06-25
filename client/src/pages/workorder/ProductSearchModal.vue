<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg w-[600px] h-[450px] flex flex-col">
      <!-- 헤더 -->
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold">제품 선택</h3>
        <button @click="$emit('close')" class="text-xl">&times;</button>
      </div>

      <!-- 검색 -->
      <div class="p-4 border-b">
        <input
          v-model="searchTerm"
          @input="searchProducts"
          placeholder="제품명 또는 제품코드"
          class="w-full px-3 py-2 border"
        />
      </div>

      <!-- 결과 테이블 -->
      <div class="flex-1 overflow-auto p-4">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="border p-2">제품코드</th>
              <th class="border p-2">제품명</th>
              <th class="border p-2">단위</th>
              <th class="border p-2">규격</th>
              <th class="border p-2">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in searchResults" :key="product.product_code">
              <td class="border p-2">{{ product.product_code }}</td>
              <td class="border p-2">{{ product.product_name }}</td>
              <td class="border p-2">{{ product.product_unit }}</td>
              <td class="border p-2">{{ product.product_stand }}</td>
              <td class="border p-2 text-center">
                <button
                  @click="$emit('select', product)"
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

const searchProducts = async () => {
  try {
    const res = await axios.get("/workOrder/products/search", {
      params: { q: searchTerm.value },
    });
    searchResults.value = res.data || [];
  } catch (err) {
    searchResults.value = [];
  }
};

onMounted(() => {
  searchProducts(); // 전체 목록 로드
});
</script>
