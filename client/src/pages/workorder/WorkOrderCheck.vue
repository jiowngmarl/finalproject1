<template>
  <div class="max-w-[1060px] h-[739px] mx-auto p-4 bg-gray-50 overflow-hidden">
    <!-- 상단 타이틀 -->
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-gray-800">작업지시 조회</h1>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style="height: calc(100% - 60px);">
      
      <!-- 검색 영역 -->
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-5 gap-3 mb-3">
          <!-- 작업지시서번호 검색 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">작업지시서번호</label>
            <input 
              v-model="searchParams.workOrderNo"
              @keypress.enter="searchWorkOrders"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="작업지시서번호 검색"
            />
          </div>

          <!-- 제품명 검색 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">제품명</label>
            <input 
              v-model="searchParams.productName"
              @keypress.enter="searchWorkOrders"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="제품명 검색"
            />
          </div>

          <!-- 시작예정일 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">시작예정일</label>
            <input 
              v-model="searchParams.startDate"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- 종료예정일 -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">종료예정일</label>
            <input 
              v-model="searchParams.endDate"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 검색 버튼 -->
        <div class="flex gap-2 justify-center">
          <button 
            @click="searchWorkOrders"
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
          총 <span class="font-semibold text-blue-600">{{ workOrderList.length }}</span>건
        </div>
      </div>

      <!-- 작업지시 목록 테이블 -->
      <div class="flex-1 overflow-auto border border-gray-200 rounded" style="height: calc(100% - 200px);">
        <table class="w-full text-xs border-collapse bg-white">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[140px]">작업지시번호</th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[300px]">제품정보</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[80px]">총수량</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[100px]">작성일</th>
              <th class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[80px]">작성자</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[100px]">시작예정일</th>
              <th class="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[100px]">종료예정일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center text-gray-500 py-8">
                검색중입니다...
              </td>
            </tr>
            <tr v-else-if="workOrderList.length === 0">
              <td colspan="7" class="text-center text-gray-500 py-8">
                조회된 작업지시가 없습니다.
              </td>
            </tr>
            <tr 
              v-else 
              v-for="(workOrder, index) in workOrderList" 
              :key="workOrder.work_order_no" 
              class="hover:bg-blue-50 cursor-pointer"
              @dblclick="viewWorkOrderDetail(workOrder)"
            >
              <td class="border border-gray-200 px-3 py-2 font-medium">{{ workOrder.work_order_no }}</td>
              <td class="border border-gray-200 px-3 py-2">
                <span class="text font-medium">{{ workOrder.product_summary }}</span>
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">
                <span class="font-semibold">{{ formatNumber(workOrder.total_qty) }}</span>
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center">{{ formatDate(workOrder.write_date) }}</td>
              <td class="border border-gray-200 px-3 py-2">{{ workOrder.writer_name }}</td>
              <td class="border border-gray-200 px-3 py-2 text-center">{{ formatDate(workOrder.order_start_dt) }}</td>
              <td class="border border-gray-200 px-3 py-2 text-center">{{ formatDate(workOrder.order_end_dt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 상세보기 모달 -->
    <WorkOrderDetailModal 
      v-if="showDetailModal"
      :work-order-no="selectedWorkOrderNo"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 모달 컴포넌트 (필요시 생성)
// import WorkOrderDetailModal from './WorkOrderDetailModal.vue'

// 상태 관리
const loading = ref(false)
const workOrderList = ref([])
const showDetailModal = ref(false)
const selectedWorkOrderNo = ref('')

// 검색 파라미터
const searchParams = ref({
  workOrderNo: '',
  productName: '',
  writeDate: '',
  startDate: '',
  endDate: ''
})

// 메서드들
const searchWorkOrders = async () => {
  loading.value = true
  try {
    // 검색 파라미터 준비
    const params = new URLSearchParams()
    Object.keys(searchParams.value).forEach(key => {
      if (searchParams.value[key]) {
        params.append(key, searchParams.value[key])
      }
    })
    
    // API 호출
    const response = await axios.get(`/workOrder/list-page?${params.toString()}`)
    workOrderList.value = response.data || []
  } catch (err) {
    alert('작업지시 조회에 실패했습니다.')
    workOrderList.value = []
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchParams.value = {
    workOrderNo: '',
    productName: '',
    writeDate: '',
    startDate: '',
    endDate: ''
  }
  workOrderList.value = []
}

const viewWorkOrderDetail = (workOrder) => {
  selectedWorkOrderNo.value = workOrder.work_order_no
  showDetailModal.value = true
}

// 유틸리티 함수들
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatNumber = (number) => {
  if (!number && number !== 0) return ''
  return number.toLocaleString()
}

// 컴포넌트 마운트 시 전체 목록 조회
onMounted(() => {
  searchWorkOrders() // 빈 검색조건으로 전체 조회
})
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
