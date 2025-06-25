<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-[800px] h-[600px] flex flex-col">
      <!-- 모달 헤더 -->
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">작업지시서 검색</h2>
        <button 
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      <!-- 검색 영역 -->
      <div class="p-4 border-b">
        <div class="flex gap-2">
          <input 
            ref="searchInput"
            v-model="searchTerm"
            @keyup.enter="searchWorkOrders"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="작업지시서 번호 또는 제품명으로 검색"
          />
          <button 
            @click="searchWorkOrders"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            :disabled="loading"
          >
            {{ loading ? '검색중...' : '검색' }}
          </button>
          <button 
            @click="clearSearch"
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            전체
          </button>
        </div>
      </div>

      <!-- 검색 결과 -->
      <div class="flex-1 overflow-auto p-4">
        <div v-if="loading" class="text-center py-8 text-gray-500">
          검색 중...
        </div>
        
        <div v-else-if="workOrders.length === 0 && searchTerm" class="text-center py-8 text-gray-500">
          "<strong>{{ searchTerm }}</strong>"에 대한 검색 결과가 없습니다.
        </div>
        
        <div v-else-if="workOrders.length === 0" class="text-center py-8 text-gray-500">
          등록된 작업지시서가 없습니다.
        </div>
        
        <div v-else>
          <!-- 테이블 형태로 변경 -->
          <div class="overflow-auto border border-gray-200 rounded">
            <table class="w-full text-sm border-collapse bg-white">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">작업지시서 번호</th>
                  <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">제품정보</th>
                  <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">작성일</th>
                  <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">시작예정일</th>
                  <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">종료예정일</th>
                  <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">선택</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="workOrder in workOrders" 
                  :key="workOrder.work_order_no"
                  class="hover:bg-blue-50 cursor-pointer transition-colors"
                  @click="selectWorkOrder(workOrder)"
                >
                  <td class="border border-gray-200 px-3 py-2 font-medium">{{ workOrder.work_order_no }}</td>
                  <td class="border border-gray-200 px-3 py-2">{{ workOrder.product_summary || '제품 정보 없음' }}</td>
                  <td class="border border-gray-200 px-3 py-2 text-center">{{ formatDate(workOrder.write_date) }}</td>
                  <td class="border border-gray-200 px-3 py-2 text-center">{{ formatDate(workOrder.order_start_dt) || '-' }}</td>
                  <td class="border border-gray-200 px-3 py-2 text-center">{{ formatDate(workOrder.order_end_dt) || '-' }}</td>
                  <td class="border border-gray-200 px-3 py-2 text-center">
                    <button 
                      @click.stop="selectWorkOrder(workOrder)"
                      class="px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
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

      <!-- 모달 푸터 -->
      <div class="p-4 border-t flex justify-between items-center">
        <div class="text-sm text-gray-500">
          {{ workOrders.length > 0 ? `총 ${workOrders.length}개의 작업지시서` : '' }}
        </div>
        <button 
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
        >
          취소
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'

// Props & Emits
const emit = defineEmits(['select', 'close'])

// 상태
const searchTerm = ref('')
const workOrders = ref([])
const loading = ref(false)
const searchInput = ref(null)

// 메서드
const searchWorkOrders = async () => {
  loading.value = true
  try {
    const res = await axios.get('/workOrder/search', {
      params: { q: searchTerm.value }
    })
    workOrders.value = res.data || []
  } catch (err) {
    console.error('작업지시서 검색 오류:', err)
    alert('작업지시서 검색에 실패했습니다.')
    workOrders.value = []
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  searchTerm.value = ''
  searchWorkOrders()
}

const selectWorkOrder = (workOrder) => {
  emit('select', workOrder)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('ko-KR')
  } catch (err) {
    return '-'
  }
}

// 마운트 시 전체 목록 로딩 및 포커스
onMounted(async () => {
  await searchWorkOrders()
  
  // 검색 입력란에 포커스
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
})
</script>

<style scoped>
/* 모달 스타일 */
.z-50 {
  z-index: 9999;
}

/* 검색 결과 호버 효과 강화 */
.cursor-pointer:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 로딩 상태 버튼 비활성화 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>