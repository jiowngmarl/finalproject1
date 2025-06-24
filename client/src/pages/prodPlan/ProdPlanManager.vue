<template>
  <div class="max-w-[1060px] h-[739px] mx-auto p-4 bg-gray-50 overflow-hidden">
    <!-- 상단 타이틀 -->
    <div class="mb-3">
      <h1 class="text-2xl font-bold text-gray-800">
        생산계획 관리
      </h1>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style="height: calc(100% - 60px);">
      <!-- 기본 정보 영역 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- 계획번호 -->
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">계획번호</label>
          <div class="flex">
            <input 
              v-model="form.plan_id" 
              class="flex-1 px-2 py-1.5 border border-gray-300 rounded-l-md text-xs bg-gray-50"
              readonly
            />
            <button 
              @click="openPlanModal"
              class="px-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-xs flex items-center justify-center"
              title="기존 계획 불러오기"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 주문번호 -->
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">주문번호</label>
          <div class="flex">
            <input 
              v-model="form.order_id" 
              class="flex-1 px-2 py-1.5 border border-gray-300 rounded-l-md text-xs bg-gray-50"
              readonly
            />
            <button 
              @click="openOrderModal"
              class="px-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-xs flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 계획명 및 작성자 영역 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">계획명 *</label>
          <input 
            v-model="form.plan_name" 
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="생산계획명을 입력해주세요"
            required
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">작성자</label>
          <input 
            v-model="form.writer_name" 
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-gray-50"
            readonly
            placeholder="로그인된 사용자"
          />
        </div>
      </div>

      <!-- 일정 및 비고 영역 -->
      <div class="grid grid-cols-4 gap-3 mb-4">
        <!-- 등록일 -->
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">등록일</label>
          <input 
            v-model="form.plan_reg_dt" 
            type="date"
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs bg-gray-50"
            readonly
          />
        </div>

        <!-- 계획시작일 -->
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">계획시작일 *</label>
          <input 
            v-model="form.plan_start_dt" 
            type="date"
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <!-- 계획종료일 -->
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">계획종료일 *</label>
          <input 
            v-model="form.plan_end_dt" 
            type="date"
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <!-- 비고 -->
        <div>
          <label class="block text-xs font-medium text-blue-600 mb-1">비고</label>
          <input 
            v-model="form.plan_remark" 
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="비고 입력"
          />
        </div>
      </div>

      <!-- 제품 목록 영역 -->
      <div class="flex flex-col" style="height: calc(100% - 200px);">
        <div class="flex justify-between items-center mb-3">
          <label class="text-sm font-medium text-blue-600">제품 목록</label>
          <div class="flex gap-2" v-if="authStore.canManageProduction">
            <button 
              @click="removeSelectedProducts" 
              class="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              :disabled="!hasSelectedProducts"
            >
              제거
            </button>
            <button 
              @click="openProductModal"
              class="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              제품 추가
            </button>
          </div>
        </div>

        <!-- 제품 테이블 -->
        <div class="flex-1 overflow-auto border border-gray-200 rounded mb-4">
          <table class="w-full text-xs border-collapse bg-white">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-700" v-if="authStore.canManageProduction">#</th>
                <th class="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-700">제품코드</th>
                <th class="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-700">제품명</th>
                <th class="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-700">단위</th>
                <th class="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-700">규격</th>
                <th class="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-700">공정그룹코드</th>
                <th class="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-700">계획수량</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="form.products.length === 0">
                <td :colspan="authStore.canManageProduction ? 7 : 6" class="text-center text-gray-500 py-8">
                  등록된 제품이 없습니다. 제품을 추가해주세요.
                </td>
              </tr>
              <tr v-else v-for="(product, index) in form.products" :key="index" class="hover:bg-gray-50">
                <td class="border border-gray-200 px-2 py-1.5 text-center" v-if="authStore.canManageProduction">
                  <input type="checkbox" v-model="product.selected" class="rounded w-3 h-3" />
                </td>
                <td class="border border-gray-200 px-2 py-1.5">{{ product.product_code }}</td>
                <td class="border border-gray-200 px-2 py-1.5">{{ product.product_name }}</td>
                <td class="border border-gray-200 px-2 py-1.5">{{ product.product_unit }}</td>
                <td class="border border-gray-200 px-2 py-1.5">{{ product.product_stand }}</td>
                <td class="border border-gray-200 px-2 py-1.5">{{ product.process_group_code }}</td>
                <td class="border border-gray-200 px-2 py-1.5">
                  <input 
                    v-model.number="product.plan_qty" 
                    type="number" 
                    min="1"
                    step="1"
                    class="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="수량"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 저장/초기화 버튼 -->
        <div class="flex gap-3 justify-center" v-if="authStore.canManageProduction">
          <button 
            @click="savePlan" 
            class="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            :disabled="!canSave"
          >
            {{ isEditMode ? '수정' : '저장' }}
          </button>
          <button 
            @click="resetForm" 
            class="px-6 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors font-medium"
          >
            초기화
          </button>
        </div>
      </div>
    </div>

    <!-- 모달들 (검색은 모든 사용자 가능, 제품추가는 권한 필요) -->
    <PlanProductSearchModal 
      v-if="showProductModal && authStore.canManageProduction" 
      @select="addProduct" 
      @close="showProductModal = false" 
    />
    
    <OrderSearchModal 
      v-if="showOrderModal" 
      @select="selectOrder" 
      @close="showOrderModal = false" 
    />

    <ProdPlanSearchModal 
      v-if="showPlanModal" 
      @select="selectPlan" 
      @close="showPlanModal = false" 
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// 권한 스토어
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

// 모달 컴포넌트들 
import OrderSearchModal from './OrderSearchModal.vue'
import PlanProductSearchModal from './PlanProductSearchModal.vue'
import ProdPlanSearchModal from './ProdPlanSearchModal.vue'

// 기본 상태
const isEditMode = ref(false)

// 모달 상태
const showProductModal = ref(false)
const showOrderModal = ref(false)
const showPlanModal = ref(false)

// 폼 데이터
const form = ref({
  plan_id: '',
  plan_name: '',
  order_id: '',
  employee_name: '', // DB에 저장될 사원명
  writer_name: '',   // 화면 표시용
  plan_reg_dt: '',
  plan_start_dt: '',
  plan_end_dt: '',
  plan_remark: '',
  products: []
})

// 권한 체크 함수들
const checkProductionPermission = (action = '이 작업') => {
  if (!authStore.canManageProduction) {
    alert(authStore.getPermissionMessage('production') || '생산 관리 권한이 없습니다.')
    return false
  }
  return true
}

// Computed 속성들
const hasSelectedProducts = computed(() => {
  return form.value.products.some(product => product.selected)
})

const canSave = computed(() => {
  return form.value.employee_name &&
         form.value.plan_name &&
         form.value.plan_start_dt &&
         form.value.plan_end_dt &&
         form.value.products.length > 0 &&
         authStore.canManageProduction
})

// 메서드들
const openProductModal = () => {
  if (!checkProductionPermission('제품 추가')) return
  showProductModal.value = true
}

const openOrderModal = () => {
  showOrderModal.value = true
}

const openPlanModal = () => {
  showPlanModal.value = true
}

// 주문 선택
const selectOrder = async (order) => {
  form.value.order_id = order.order_id
  showOrderModal.value = false

  // 권한이 있을 때만 제품 정보 자동 추가
  if (!authStore.canManageProduction) {
    return
  }

  // 주문의 제품 정보를 자동으로 추가
  try {
    const res = await axios.get(`/prodPlan/order/${order.order_id}`)
    if (res.data && res.data.products) {
      form.value.products = []
      
      res.data.products.forEach((product, index) => {
        form.value.products.push({
          product_code: product.product_code,
          product_name: product.product_name,
          product_unit: product.product_unit,
          product_stand: product.product_stand,
          process_group_code: product.process_group_code || '',
          plan_qty: product.remain_qty || product.order_qty,
          selected: false
        })
      })
    }
  } catch (err) {
    alert('주문 제품 정보를 불러오는데 실패했습니다.')
  }
}

// 계획 선택 (불러오기)
const selectPlan = async (plan) => {
  try {
    const res = await axios.get(`/prodPlan/${plan.plan_id}`)
    
    if (res.data && res.data.master) {
      const { master, products } = res.data
      
      // 날짜 포맷팅 함수
      const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
      }
      
      // 폼에 계획 정보 설정
      form.value = {
        plan_id: master.plan_id || '',
        plan_name: master.plan_name || '',
        order_id: master.order_id || '',
        employee_name: master.employee_name || '', // 저장된 사원명 불러오기
        writer_name: master.employee_name || '',   // 화면 표시용
        plan_reg_dt: formatDate(master.plan_reg_dt),
        plan_start_dt: formatDate(master.plan_start_dt),
        plan_end_dt: formatDate(master.plan_end_dt),
        plan_remark: master.plan_remark || '',
        products: (products || []).map((product, index) => ({
          product_code: product.product_code || '',
          product_name: product.product_name || '',
          product_unit: product.product_unit || '',
          product_stand: product.product_stand || '',
          process_group_code: product.process_group_code || '',
          plan_qty: product.plan_qty || null,
          selected: false
        }))
      }
      
      // 수정 모드로 설정
      isEditMode.value = true
    } else {
      alert('생산계획 정보가 올바르지 않습니다.')
    }
    
    showPlanModal.value = false
  } catch (err) {
    alert('생산계획 정보를 불러오는데 실패했습니다.')
  }
}

// 제품 추가
const addProduct = (product) => {
  if (!checkProductionPermission('제품 추가')) return
  
  // 이미 추가된 제품인지 확인
  const existingProduct = form.value.products.find(p => p.product_code === product.product_code)
  if (existingProduct) {
    return // 중복 제품은 조용히 무시
  }

  const newProduct = {
    product_code: product.product_code,
    product_name: product.product_name,
    product_unit: product.product_unit,
    product_stand: product.product_stand,
    process_group_code: product.process_group_code || '',
    plan_qty: null,
    selected: false
  }
  
  form.value.products.push(newProduct)
  showProductModal.value = false
}

// 제품 제거
const removeSelectedProducts = () => {
  if (!checkProductionPermission('제품 제거')) return
  
  const selectedProducts = form.value.products.filter(product => product.selected)
  
  if (selectedProducts.length === 0) {
    return // 선택된 제품이 없으면 조용히 무시
  }
  
  form.value.products = form.value.products.filter(product => !product.selected)
}

// 생산계획 저장
const savePlan = async () => {
  if (!checkProductionPermission('생산계획 저장')) return
  
  if (!canSave.value) {
    alert('계획명, 작성자, 시작일, 종료일, 제품을 모두 입력해주세요.')
    return
  }

  try {
    const payload = {
      master: {
        // plan_id는 신규 등록 시 서버에서 자동 생성하므로 수정 모드일 때만 포함
        ...(isEditMode.value && form.value.plan_id && { plan_id: form.value.plan_id }),
        plan_name: form.value.plan_name,
        order_id: form.value.order_id || null,
        employee_name: form.value.employee_name || authStore.user?.employee_name || '', // 로그인된 사용자명
        plan_reg_dt: form.value.plan_reg_dt,
        plan_start_dt: form.value.plan_start_dt,
        plan_end_dt: form.value.plan_end_dt,
        plan_remark: form.value.plan_remark || ''
      },
      products: form.value.products.map(product => ({
        product_code: product.product_code,
        plan_qty: product.plan_qty || null,
        process_group_code: product.process_group_code || ''
      }))
    }

    let response
    if (isEditMode.value && form.value.plan_id) {
      // 수정 시에는 기존 번호 사용
      response = await axios.put('/prodPlan', payload)
      alert('생산계획 수정 완료')
    } else {
      // 신규 등록 시에는 번호 제외 (서버에서 생성)
      response = await axios.post('/prodPlan', payload)
      alert('생산계획 등록 완료')
      
      // 서버에서 생성된 번호를 폼에 설정
      if (response.data && response.data.plan_id) {
        form.value.plan_id = response.data.plan_id
        isEditMode.value = true
      }
    }
  } catch (err) {
    if (err.response) {
      if (err.response.data && err.response.data.error) {
        alert(`저장 실패: ${err.response.data.error}`)
      } else {
        alert(`저장 실패 (${err.response.status}): ${JSON.stringify(err.response.data)}`)
      }
    } else {
      alert('생산계획 저장에 실패했습니다.')
    }
  }
}

// 폼 초기화
const resetForm = () => {
  if (!checkProductionPermission('폼 초기화')) return
  
  const today = new Date().toISOString().split('T')[0]
  
  form.value = {
    plan_id: '',
    plan_name: '',
    order_id: '',
    employee_name: authStore.user?.employee_name || '', // 로그인된 사용자명
    writer_name: authStore.user?.employee_name || '',   // 화면 표시용
    plan_reg_dt: today,
    plan_start_dt: '',
    plan_end_dt: '',
    plan_remark: '',
    products: []
  }
  isEditMode.value = false
}

// 컴포넌트 마운트 시 로그인된 사용자 정보 설정
onMounted(() => {
  // 권한 체크 및 알림
  if (!authStore.canManageProduction) {
    alert('조회만 가능합니다. 생산 관리 권한이 없습니다.')
  }
  
  const today = new Date().toISOString().split('T')[0]
  form.value.plan_reg_dt = today
  form.value.employee_name = authStore.user?.employee_name || '' // 로그인된 사용자명
  form.value.writer_name = authStore.user?.employee_name || ''   // 화면 표시용
  form.value.plan_id = ''
})
</script>

<style scoped>
input, select {
  transition: all 0.15s ease-in-out;
}

input:focus, select:focus {
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