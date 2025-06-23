<template>
  <div class="employee-page-container">
    <!-- 좌측: 사원 목록 -->
    <div class="employee-list-panel">
      <h1 class="page-title">사원 관리</h1>
      
      <!-- 검색 및 필터 영역 -->
      <div class="search-filter-area">
        <div class="search-bar">
          <va-input 
            v-model="searchText" 
            placeholder="사번, 이름으로 검색..."
            class="search-input"
          >
            <template #prepend>
              <va-icon name="search" />
            </template>
          </va-input>
          <va-button @click="handleSearch">조회</va-button>
        </div>
        
        <!-- 필터 드롭다운들 -->
        <div class="filter-row">
          <div class="filter-item">
            <label>사번</label>
            <va-select
              v-model="filters.employeeId"
              :options="employeeIdOptions"
              placeholder="전체"
              clearable
            />
          </div>
          <div class="filter-item">
            <label>이름</label>
            <va-select
              v-model="filters.employeeName"
              :options="employeeNameOptions"
              placeholder="전체"
              clearable
            />
          </div>
          <div class="filter-item">
            <label>부서</label>
            <va-select
              v-model="filters.department"
              :options="departmentOptions"
              value-by="value"
              text-by="text"
              placeholder="전체"
              clearable
            />
          </div>
          <div class="filter-item">
            <label>직급</label>
            <va-select
              v-model="filters.position"
              :options="positionOptions"
              placeholder="전체"
              clearable
            />
          </div>
          <div class="filter-item">
            <label>재직여부</label>
            <va-select
              v-model="filters.employmentStatus"
              :options="employmentStatusOptions"
              value-by="value"
              text-by="text"
              placeholder="전체"
              clearable
            />
          </div>
        </div>
      </div>

      <!-- 액션 버튼 (관리자 권한만) -->
      <div class="action-buttons" v-if="canManageAdmin">
        <va-button 
          preset="secondary" 
          icon="delete_outline"
          @click="deleteSelected"
          :disabled="selectedIds.length === 0"
        >
          삭제
        </va-button>
        
      </div>

      <!-- 권한 없는 사용자를 위한 메시지 -->
      <div v-else class="permission-notice">
        <va-alert color="info" icon="info">
          조회 전용 모드입니다. 사원 관리는 관리자 권한이 필요합니다.
        </va-alert>
      </div>

      <!-- 사원 목록 테이블 -->
      <div class="table-container">
        <table class="employee-table">
          <thead>
            <tr>
              <!-- 체크박스는 관리자 권한이 있을 때만 -->
              <th width="40" v-if="canManageAdmin">
                <va-checkbox v-model="selectAll" @update:model-value="handleSelectAll" />
              </th>
              <th>사번</th>
              <th>이름</th>
              <th>부서</th>
              <th>직급</th>
              <th>입사일</th>
              <th>재직여부</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(employee, index) in paginatedEmployees" 
              :key="employee.employee_id"
              @click="canManageAdmin ? selectEmployee(employee) : null"
              :class="{ 
                'selected': selectedEmployee?.employee_id === employee.employee_id && canManageAdmin,
                'read-only': !canManageAdmin
              }"
            >
              <!-- 체크박스는 관리자 권한이 있을 때만 -->
              <td @click.stop v-if="canManageAdmin">
                <va-checkbox
                  v-model="selectedIds"
                  :array-value="employee.employee_id"
                />
              </td>
              <td>{{ employee.employee_id }}</td>
              <td>{{ employee.employee_name }}</td>
              <td>{{ getDepartmentName(employee.department_code) }}</td>
              <td>{{ employee.position }}</td>
              <td>{{ formatDate(employee.hire_date) }}</td>
              <td>{{ employee.employment_status }}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- 데이터 없을 때 표시 -->
        <div v-if="filteredEmployees.length === 0" class="no-data">
          검색 결과가 없습니다.
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination-area">
        <div class="page-info">
          {{ startIndex + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }} of {{ filteredEmployees.length }}
        </div>
        <div class="page-controls">
          <span>Rows per page: </span>
          <va-select
            v-model="itemsPerPage"
            :options="[10, 20, 50]"
            class="rows-select"
          />
          <va-pagination
            v-model="currentPage"
            :pages="totalPages"
            :visible-pages="5"
            buttons-preset="secondary"
            rounded
            gapped
            border-color="primary"
            class="ml-3"
          />
        </div>
      </div>
    </div>

    <!-- 우측: 사원 등록/수정 (관리자 권한만) -->
    <div class="employee-detail-panel" v-if="canManageAdmin">
      <div class="detail-header">
        <h2>사원 등록/수정</h2>
        <div class="action-buttons">
          <va-button preset="secondary" @click="resetForm">초기화</va-button>
          <va-button @click="saveEmployee">
            {{ selectedEmployee ? '수정' : '저장' }}
          </va-button>
        </div>
      </div>

      <div class="detail-form">
        <!-- 이름 -->
        <div class="form-row">
          <div class="form-group">
            <label>이름 <span class="required">*</span></label>
            <va-input 
              v-model="form.employeeName" 
              placeholder="이름을 입력하세요"
              :error="errors.employeeName"
              :error-messages="errors.employeeName ? '이름은 필수입니다' : ''"
            />
          </div>
        </div>

        <!-- 부서 -->
        <div class="form-row">
          <div class="form-group">
            <label>부서 <span class="required">*</span></label>
            <va-select
              v-model="form.departmentCode"
              :options="departmentOptions"
              value-by="value"
              text-by="text"
              placeholder="부서를 선택하세요"
              :error="errors.departmentCode"
              :error-messages="errors.departmentCode ? '부서를 선택하세요' : ''"
            />
          </div>
        </div>

        <!-- 직급 -->
        <div class="form-row">
          <div class="form-group">
            <label>직급 <span class="required">*</span></label>
            <va-select
              v-model="form.position"
              :options="positionSelectOptions"
              placeholder="직급을 선택하세요"
              :error="errors.position"
              :error-messages="errors.position ? '직급을 선택하세요' : ''"
            />
          </div>
        </div>

        <!-- 입사일 -->
        <div class="form-row">
          <div class="form-group">
            <label>입사일</label>
            <va-date-input 
              v-model="form.hireDate"
              :error="errors.hireDate"
              :error-messages="errors.hireDate ? '입사일을 선택하세요' : ''"
            />
          </div>
        </div>

        <!-- 연락처 -->
        <div class="form-row">
          <div class="form-group">
            <label>연락처</label>
            <va-input 
              v-model="form.phone" 
              placeholder="숫자만 입력하세요"
              inputmode="numeric"
              pattern="[0-9]*"
              @input="e => handlePhoneInput(e.target.value)"
              maxlength="15"
            />
          </div>
        </div>

        <!-- 이메일 -->
        <div class="form-row">
          <div class="form-group">
            <label>이메일</label>
            <va-input 
              v-model="form.email" 
              placeholder="example@company.com"
              type="email"
            />
          </div>
        </div>

        <!-- 재직여부 -->
        <div class="form-row">
          <div class="form-group">
            <label>재직여부</label>
            <div class="radio-group">
              <va-radio v-model="form.employmentStatus" option="Y">
                <template #label>
                  <span class="radio-label">재직</span>
                </template>
              </va-radio>
              <va-radio v-model="form.employmentStatus" option="N">
                <template #label>
                  <span class="radio-label">퇴직</span>
                </template>
              </va-radio>
            </div>
          </div>
        </div>

        <!-- 비고 -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>비고</label>
            <va-textarea 
              v-model="form.remarks" 
              placeholder="비고사항을 입력하세요"
              :min-rows="3"
              :max-rows="5"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 권한 없는 사용자를 위한 안내 패널 -->
    <div class="permission-info-panel" v-else>
      <div class="permission-content">
        <va-icon name="admin_panel_settings" size="large" color="primary" />
        <h3>사원 관리 권한 필요</h3>
        <p>사원 등록 및 수정은 관리자 권한이 필요합니다.</p>
        <div class="current-permission">
          <va-chip color="info" size="small">
            현재 권한: {{ userRole || '조회 전용' }}
          </va-chip>
        </div>
        <p class="permission-desc">
          사원 목록은 조회할 수 있지만,<br>
          등록, 수정, 삭제는 관리자만 가능합니다.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

// 인증 스토어 사용
const authStore = useAuthStore()
const { canManageAdmin, userRole } = authStore

// 타입 정의
interface Employee {
  employee_id: string
  employee_name: string
  department_code: string
  position: string
  hire_date: string
  phone?: string
  email?: string
  employment_status: 'Y' | 'N'
  remarks?: string
}

interface Form {
  employeeId: string
  employeeName: string
  departmentCode: string
  position: string
  hireDate: Date | null
  phone: string
  email: string
  employmentStatus: 'Y' | 'N'
  remarks: string
}

// 상태 관리
const searchText = ref('')
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const employees = ref<Employee[]>([])
const selectedEmployee = ref<Employee | null>(null)
const loading = ref(false)

// 필터 상태
const filters = ref({
  employeeId: '',
  employeeName: '',
  department: '',
  position: '',
  employmentStatus: ''
})

// 폼 데이터
const form = ref<Form>({
  employeeId: '',
  employeeName: '',
  departmentCode: '',
  position: '',
  hireDate: null,
  phone: '',
  email: '',
  employmentStatus: 'Y',
  remarks: ''
})

// 폼 검증 에러
const errors = ref({
  employeeName: false,
  departmentCode: false,
  position: false,
  hireDate: false
})

// 부서 매핑
const departmentMap = {
  '01': '생산',
  '02': '자재',
  '03': '포장',
  '04': '설비',
  '05': '품질',
  '06': '물류',
  '07': '영업'
}

// 필터 옵션들
const employeeIdOptions = ref<string[]>([])
const employeeNameOptions = ref<string[]>([])
const departmentOptions = ref([
  { text: '생산', value: '01' },
  { text: '자재', value: '02' },
  { text: '포장', value: '03' },
  { text: '설비', value: '04' },
  { text: '품질', value: '05' },
  { text: '물류', value: '06' },
  { text: '영업', value: '07' }
])
const positionOptions = ref<string[]>([])
const positionSelectOptions = ref(['사원', '주임', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '대표'])
const employmentStatusOptions = ref([
  { text: '재직', value: 'Y' },
  { text: '퇴직', value: 'N' }
])

// 필터링된 사원 목록
const filteredEmployees = computed(() => {
  return employees.value.filter(employee => {
    // 검색어 필터
    const matchesSearch = !searchText.value || 
      employee.employee_id.toLowerCase().includes(searchText.value.toLowerCase()) ||
      employee.employee_name.toLowerCase().includes(searchText.value.toLowerCase())
    
    // 드롭다운 필터
    const matchesFilters = 
      (!filters.value.employeeId || employee.employee_id === filters.value.employeeId) &&
      (!filters.value.employeeName || employee.employee_name === filters.value.employeeName) &&
      (!filters.value.department || employee.department_code === filters.value.department) &&
      (!filters.value.position || employee.position === filters.value.position) &&
      (!filters.value.employmentStatus || employee.employment_status === filters.value.employmentStatus)
    
    return matchesSearch && matchesFilters
  })
})

// 페이지네이션
const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const paginatedEmployees = computed(() => {
  const start = startIndex.value
  const end = start + itemsPerPage.value
  return filteredEmployees.value.slice(start, end)
})

// 라이프사이클
onMounted(async () => {
  await fetchEmployees()
  setupFilterOptions()
})

// API 함수들
async function fetchEmployees() {
  try {
    loading.value = true
    const response = await axios.get('/employee')
    console.log('사원 데이터:', response.data)
    employees.value = response.data
  } catch (error) {
    console.error('사원 목록 로드 실패:', error)
    // Mock 데이터
    employees.value = [
      {
        employee_id: '2024001',
        employee_name: '홍길동',
        department_code: '07',
        position: '과장',
        hire_date: '2023-05-01',
        phone: '010-1234-5678',
        email: 'hong@company.com',
        employment_status: 'Y'
      },
      {
        employee_id: '2024002',
        employee_name: '김철수',
        department_code: '01',
        position: '대리',
        hire_date: '2024-01-15',
        phone: '010-9876-5432',
        email: 'kim@company.com',
        employment_status: 'Y'
      }
    ]
  } finally {
    loading.value = false
  }
}

// 필터 옵션 설정
function setupFilterOptions() {
  employeeIdOptions.value = [...new Set(employees.value.map(e => e.employee_id))]
  employeeNameOptions.value = [...new Set(employees.value.map(e => e.employee_name))]
  positionOptions.value = [...new Set(employees.value.map(e => e.position))]
}

// 부서명 가져오기
function getDepartmentName(code: string) {
  return departmentMap[code as keyof typeof departmentMap] || code;
}

// 메서드들
function handleSearch() {
  currentPage.value = 1
}

function handleSelectAll(value: boolean) {
  if (value) {
    selectedIds.value = paginatedEmployees.value.map(employee => employee.employee_id)
  } else {
    selectedIds.value = []
  }
}

function selectEmployee(employee: Employee) {
  if (!canManageAdmin) {
    console.log('사원 수정 권한이 없습니다.')
    return
  }

  selectedEmployee.value = employee
  // 폼에 데이터 채우기
  form.value = {
    employeeId: employee.employee_id,
    employeeName: employee.employee_name,
    departmentCode: employee.department_code,
    position: employee.position,
    hireDate: employee.hire_date ? new Date(employee.hire_date) : null,
    phone: employee.phone || '',
    email: employee.email || '',
    employmentStatus: employee.employment_status,
    remarks: employee.remarks || ''
  }
  // 에러 초기화
  resetErrors()
}

function resetForm() {
  selectedEmployee.value = null
  form.value = {
    employeeId: '',
    employeeName: '',
    departmentCode: '',
    position: '',
    hireDate: null,
    phone: '',
    email: '',
    employmentStatus: 'Y',
    remarks: ''
  }
  resetErrors()
}

function resetErrors() {
  errors.value = {
    employeeName: false,
    departmentCode: false,
    position: false,
    hireDate: false
  }
}

// 폼 검증
function validateForm() {
  resetErrors()
  let isValid = true
  
  if (!form.value.employeeName.trim()) {
    errors.value.employeeName = true
    isValid = false
  }
  
  if (!form.value.departmentCode) {
    errors.value.departmentCode = true
    isValid = false
  }
  
  if (!form.value.position) {
    errors.value.position = true
    isValid = false
  }
  
  if (!form.value.hireDate) {
    errors.value.hireDate = true
    isValid = false
  }
  
  return isValid
}

// 저장
async function saveEmployee() {
  if (!canManageAdmin) {
    alert('사원 관리 권한이 없습니다.')
    return
  }

  if (!validateForm()) {
    return
  }
  
  try {
    const employeeData = {
      employee_name: form.value.employeeName,
      department_code: form.value.departmentCode,
      position: form.value.position,
      hire_date: form.value.hireDate ? formatDate(form.value.hireDate.toISOString()) : null,
      phone: form.value.phone,
      email: form.value.email,
      employment_status: form.value.employmentStatus,
      remarks: form.value.remarks
    }
    console.log('전송할 데이터: ', employeeData);
    
    if (selectedEmployee.value) {
      // 수정
      await axios.put(`/employee/${selectedEmployee.value.employee_id}`, employeeData)
      alert('사원 정보가 수정되었습니다.')
    } else {
      // 신규 등록
      await axios.post('/employee', employeeData)
      alert('사원이 등록되었습니다.')
    }
    
    // 목록 새로고침
    await fetchEmployees()
    resetForm()
  } catch (error) {
    console.error('사원 저장 실패:', error)
    alert('사원 저장에 실패했습니다.')
  }
}

// 선택 삭제
async function deleteSelected() {
  if (!canManageAdmin) {
    alert('사원 관리 권한이 없습니다.')
    return
  }

  console.log('삭제할 사원들: ', selectedIds.value);

  if (selectedIds.value.length === 0) return

  if (!confirm(`선택한 ${selectedIds.value.length}명의 사원을 삭제하시겠습니까?`)) {
    return
  }

  try {
    console.log('다중 삭제 요청 시작');
    
    // 서버의 다중 삭제 API 호출
    const response = await axios.post('/employee/delete-multiple', {
      ids: selectedIds.value
    });
    
    console.log('삭제 응답:', response.data);
    
    if (response.data.success) {
      alert(`${response.data.deletedCount}명의 사원이 삭제되었습니다.`);
    } else {
      if (response.data.failedCount > 0) {
        alert(`${response.data.deletedCount}명 삭제 완료, ${response.data.failedCount}명 삭제 실패\n${response.data.message}`);
      } else {
        alert('삭제에 실패했습니다.');
      }
    }
    
    // 목록 새로고침
    await fetchEmployees();
    selectedIds.value = [];
    selectAll.value = false;
    
  } catch (error) {
    console.error('사원 삭제 실패:', error);
    alert('사원 삭제에 실패했습니다.');
  }
}

// 엑셀 내보내기
function exportExcel() {
  console.log('엑셀 내보내기')
  alert('엑셀 내보내기 기능은 준비 중입니다.')
}

// 전화번호 자동 포맷팅
function handlePhoneInput(value: string) {
  const phonenumbers = value.replace(/[^0-9]/g, '')
  
  if (phonenumbers.length == 11) {
    form.value.phone = `${phonenumbers.slice(0, 3)}-${phonenumbers.slice(3, 7)}-${phonenumbers.slice(7)}`
  } else if (phonenumbers.length == 9) {
    form.value.phone = `${phonenumbers.slice(0,2)}-${phonenumbers.slice(2, 5)}-${phonenumbers.slice(5)}`
  } else if (phonenumbers.length == 10) {
    form.value.phone = `${phonenumbers.slice(0,3)}-${phonenumbers.slice(3, 6)}-${phonenumbers.slice(6)}`
  }
}

// 날짜 포맷
function formatDate(dateString: string) {
  if (!dateString) return '-'
  return dateString.split('T')[0]
}

// 감시자
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

watch(itemsPerPage, () => {
  currentPage.value = 1
})
</script>

<style scoped>
/* 전체 컨테이너 */
.employee-page-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 100px);
  background-color: #f5f5f5;
  align-items: stretch;
  justify-content: center;
}

/* 좌측 패널 */
.employee-list-panel {
  flex: 1;
  min-width: 800px;
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: auto;
  max-height: 1025px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* 검색 및 필터 영역 */
.search-filter-area {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  max-width: 300px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 220px;
}

.filter-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: right;
}

/* 테이블 */
.table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.employee-table {
  width: 100%;
  border-collapse: collapse;
}

.employee-table th {
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: left;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.employee-table td {
  padding: 12px 8px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.employee-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

.employee-table tbody tr:hover {
  background-color: #f8f8f8;
}

.employee-table tbody tr.selected {
  background-color: #e3f2fd;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* 페이지네이션 */
.pagination-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rows-select {
  width: 80px;
}

/* 우측 패널 */
.employee-detail-panel {
  flex: 0 0 450px;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-header h2 {
  font-size: 20px;
  font-weight: 600;
}

/* 폼 스타일 */
.detail-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #e74c3c;
}

.radio-group {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}

.radio-label {
  font-size: 14px;
  color: #333;
}

/* 유틸리티 클래스 */
.ml-3 { margin-left: 12px; }

/* 반응형 */
@media (max-width: 100vw) {
  .filter-row {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .employee-detail-panel {
    flex: 0 0 400px;
  }
}

@media (max-width: 1200px) {
  .employee-page-container {
    flex-direction: column;
  }
  
  .employee-list-panel {
    min-width: unset;
    max-height: unset;
  }
  
  .employee-detail-panel {
    flex: 1;
    width: 100%;
    position: static;
  }
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .employee-table {
    font-size: 12px;
  }
  
  .employee-table th,
  .employee-table td {
    padding: 8px 4px;
  }
}
</style>