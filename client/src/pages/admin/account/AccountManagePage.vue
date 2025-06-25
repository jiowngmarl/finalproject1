<template>
  <div class="account-page-container">
    <!-- 좌측: 거래처 목록 -->
    <div class="account-list-panel">
      <h1 class="page-title">거래처 관리</h1>

      <!-- 검색 및 필터 영역 -->
      <div class="search-filter-area">
        <div class="search-bar">
          <va-input
            v-model="searchText"
            placeholder="거래처명, 사업자 번호로 검색..."
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
            <label>거래처명</label>
            <va-select
              v-model="filters.accountName"
              :options="accountNameOptions"
              placeholder="전체"
              clearable
            />
          </div>
          <div class="filter-item">
            <label>거래처 구분</label>
            <va-select
              v-model="filters.accountType"
              :options="accountTypeOptions"
              value-by="value"
              text-by="text"
              placeholder="전체"
              clearable
            />
          </div>
        </div>
      </div>

      <!-- 액션 버튼 (영업 권한만) -->
      <div class="action-buttons" v-if="canManageSales">
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
          조회 전용 모드입니다. 거래처 관리는 영업부서 권한이 필요합니다.
        </va-alert>
      </div>

      <!-- 거래처 목록 테이블 -->
      <div class="table-container">
        <table class="account-table">
          <thead>
            <tr>
              <!-- 체크박스는 영업 권한이 있을 때만 -->
              <th width="40" v-if="canManageSales">
                <va-checkbox
                  v-model="selectAll"
                  @update:model-value="handleSelectAll"
                />
              </th>
              <th width="60">번호</th>
              <th>거래처명</th>
              <th>사업자 번호</th>
              <th>담당자</th>
              <th>연락처</th>
              <th>주소</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(account, index) in paginatedAccounts"
              :key="account.account_id"
              @click="canManageSales ? selectAccount(account) : null"
              :class="{
                selected:
                  selectedAccount?.account_id === account.account_id &&
                  canManageSales,
                'read-only': !canManageSales,
              }"
            >
              <!-- 체크박스는 영업 권한이 있을 때만 -->
              <td @click.stop v-if="canManageSales">
                <va-tooltip
                  v-if="account.in_use"
                  text="주문 또는 발주에서 사용된 거래처는 삭제할 수 없습니다"
                  placement="top"
                >
                  <template #activator>
                    <span>
                      <va-checkbox
                        v-model="selectedIds"
                        :array-value="account.account_id"
                        :disabled="!!account.in_use"
                      />
                    </span>
                  </template>
                </va-tooltip>
                <va-checkbox
                  v-else
                  v-model="selectedIds"
                  :array-value="account.account_id"
                />
              </td>
              <td>{{ startIndex + index + 1 }}</td>
              <td>{{ account.account_name }}</td>
              <td>{{ account.business_no }}</td>
              <td>{{ account.charger_name }}</td>
              <td>{{ account.phone }}</td>
              <td class="address-cell">{{ account.address }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 데이터 없을 때 표시 -->
        <div v-if="filteredAccounts.length === 0" class="no-data">
          검색 결과가 없습니다.
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination-area">
        <div class="page-info">
          {{ startIndex + 1 }}-{{
            Math.min(currentPage * itemsPerPage, filteredAccounts.length)
          }}
          of {{ filteredAccounts.length }}
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

    <!-- 우측: 거래처 등록/수정 (영업 권한만) -->
    <div class="account-detail-panel" v-if="canManageSales">
      <div class="detail-header">
        <h2>거래처 등록/수정</h2>
        <div class="action-buttons">
          <va-button preset="secondary" @click="resetForm">초기화</va-button>
          <va-button @click="saveAccount">
            {{ selectedAccount ? "수정" : "저장" }}
          </va-button>
        </div>
      </div>

      <div class="detail-form">
        <!-- 거래처명 -->
        <div class="form-row">
          <div class="form-group">
            <label>거래처명 <span class="required">*</span></label>
            <va-input
              v-model="form.accountName"
              placeholder="거래처명을 입력하세요"
              :error="errors.accountName"
              :error-messages="
                errors.accountName ? '거래처명은 필수입니다' : ''
              "
            />
          </div>
        </div>

        <!-- 사업자 번호 -->
        <div class="form-row">
          <div class="form-group">
            <label>사업자 번호 <span class="required">*</span></label>
            <va-input
              v-model="form.businessNo"
              placeholder="10자리 숫자만 입력하세요"
              inputmode="numeric"
              pattern="[0-9]*"
              @input="(e) => handleBusinessNoInput(e.target.value)"
              :error="errors.businessNo"
              :error-messages="
                errors.businessNo ? '올바른 사업자번호를 입력하세요' : ''
              "
              maxlength="10"
            />
          </div>
        </div>

        <!-- 담당자 -->
        <div class="form-row">
          <div class="form-group">
            <label>담당자 <span class="required">*</span></label>
            <va-input
              v-model="form.chargerName"
              placeholder="담당자명"
              :error="errors.chargerName"
              :error-messages="
                errors.chargerName ? '담당자명은 필수입니다' : ''
              "
            />
          </div>
        </div>

        <!-- 연락처 -->
        <div class="form-row">
          <div class="form-group">
            <label>연락처 <span class="required">*</span></label>
            <va-input
              v-model="form.phone"
              placeholder="숫자만 입력하세요"
              inputmode="numeric"
              pattern="[0-9]*"
              @input="(e) => handlePhoneInput(e.target.value)"
              :error="errors.phone"
              :error-messages="errors.phone ? '올바른 연락처를 입력하세요' : ''"
              maxlength="15"
            />
          </div>
        </div>

        <!-- 주소 -->
        <div class="form-row">
          <div class="form-group">
            <label>주소</label>
            <div class="address-input-group">
              <va-input
                v-model="form.address"
                placeholder="주소를 입력하세요"
              />
            </div>
          </div>
        </div>

        <!-- 상세주소 -->
        <div class="form-row">
          <div class="form-group">
            <label>상세주소</label>
            <va-input
              v-model="form.addressDetail"
              placeholder="상세주소를 입력하세요"
            />
          </div>
        </div>

        <!-- 구분 -->
        <div class="form-row">
          <div class="form-group">
            <label>구분</label>
            <div class="radio-group">
              <va-radio v-model="form.accountType" option="customer">
                <template #label>
                  <span class="radio-label">고객사</span>
                </template>
              </va-radio>
              <va-radio v-model="form.accountType" option="supplier">
                <template #label>
                  <span class="radio-label">공급사</span>
                </template>
              </va-radio>
            </div>
          </div>
        </div>

        <!-- 사용여부 -->
        <div class="form-row">
          <div class="form-group">
            <label>사용여부</label>
            <div class="radio-group">
              <va-radio v-model="form.useYn" option="Y">
                <template #label>
                  <span class="radio-label">여</span>
                </template>
              </va-radio>
              <va-radio v-model="form.useYn" option="N">
                <template #label>
                  <span class="radio-label">부</span>
                </template>
              </va-radio>
            </div>
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
        <va-icon name="lock" size="large" color="primary" />
        <h3>거래처 관리 권한 필요</h3>
        <p>거래처 등록 및 수정은 영업부서 권한이 필요합니다.</p>
        <div class="current-permission">
          <va-chip color="info" size="small">
            현재 권한: {{ userRole || "조회 전용" }}
          </va-chip>
        </div>
        <p class="permission-desc">
          거래처 목록은 조회할 수 있지만,<br />
          등록, 수정, 삭제는 영업부서만 가능합니다.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// 인증 스토어 사용
const authStore = useAuthStore();
const { canManageSales, userRole } = authStore;

// 타입 정의
interface Account {
  account_id: string;
  account_name: string;
  business_no: string;
  charger_name: string;
  phone: string;
  address: string;
  address_detail?: string;
  account_type: "customer" | "supplier";
  use_yn: "Y" | "N";
  email?: string;
  remarks?: string;
  in_use: number;
}

interface Form {
  accountName: string;
  businessNo: string;
  chargerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  accountType: "customer" | "supplier";
  useYn: "Y" | "N";
  email: string;
  remarks: string;
}

// 상태 관리
const searchText = ref("");
const selectedIds = ref<string[]>([]);
const selectAll = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const accounts = ref<Account[]>([]);
const selectedAccount = ref<Account | null>(null);
const loading = ref(false);

// 필터 상태
const filters = ref({
  accountName: "",
  businessNo: "",
  manager: "",
  phone: "",
  accountType: "",
});

// 폼 데이터
const form = ref<Form>({
  accountName: "",
  businessNo: "",
  chargerName: "",
  phone: "",
  address: "",
  addressDetail: "",
  accountType: "customer",
  useYn: "Y",
  email: "",
  remarks: "",
});

// 폼 검증 에러
const errors = ref({
  accountName: false,
  businessNo: false,
  chargerName: false,
  phone: false,
});

// 필터 옵션들
const accountNameOptions = ref<string[]>([]);
const businessNoOptions = ref<string[]>([]);
const managerOptions = ref<string[]>([]);
const phoneOptions = ref<string[]>([]);
const accountTypeOptions = ref([
  { text: "고객사", value: "customer" },
  { text: "공급사", value: "supplier" },
]);

// 필터링된 거래처 목록
const filteredAccounts = computed(() => {
  return accounts.value.filter((account) => {
    // 검색어 필터
    const matchesSearch =
      !searchText.value ||
      account.account_name
        .toLowerCase()
        .includes(searchText.value.toLowerCase()) ||
      account.business_no.includes(searchText.value);

    // 드롭다운 필터
    const matchesFilters =
      (!filters.value.accountName ||
        account.account_name === filters.value.accountName) &&
      (!filters.value.accountType ||
        account.account_type === filters.value.accountType);

    return matchesSearch && matchesFilters;
  });
});

// 페이지네이션
const totalPages = computed(() =>
  Math.ceil(filteredAccounts.value.length / itemsPerPage.value),
);
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const paginatedAccounts = computed(() => {
  const start = startIndex.value;
  const end = start + itemsPerPage.value;
  return filteredAccounts.value.slice(start, end);
});

// 라이프사이클
onMounted(async () => {
  await fetchAccounts();
  setupFilterOptions();
});

// API 함수들
async function fetchAccounts() {
  try {
    loading.value = true;
    const response = await axios.get("/account");
    accounts.value = response.data;
  } catch (error) {
    console.error("거래처 목록 로드 실패:", error);
    // Mock 데이터
    accounts.value = [];
  } finally {
    loading.value = false;
  }
}

// 필터 옵션 설정
function setupFilterOptions() {
  accountNameOptions.value = [
    ...new Set(accounts.value.map((a) => a.account_name)),
  ];
  businessNoOptions.value = [
    ...new Set(accounts.value.map((a) => a.business_no)),
  ];
  managerOptions.value = [
    ...new Set(accounts.value.map((a) => a.charger_name)),
  ];
  phoneOptions.value = [...new Set(accounts.value.map((a) => a.phone))];
}

// 메서드들
function handleSearch() {
  currentPage.value = 1;
}

function handleSelectAll(value: boolean) {
  if (value) {
    selectedIds.value = paginatedAccounts.value.map(
      (account) => account.account_id,
    );
  } else {
    selectedIds.value = [];
  }
}

function selectAccount(account: Account) {
  if (!canManageSales) {
    console.log("거래처 수정 권한이 없습니다.");
    return;
  }

  selectedAccount.value = account;
  // 폼에 데이터 채우기
  form.value = {
    accountName: account.account_name,
    businessNo: account.business_no,
    chargerName: account.charger_name,
    phone: account.phone,
    address: account.address,
    addressDetail: account.address_detail || "",
    accountType: account.account_type,
    useYn: account.use_yn,
    email: account.email || "",
    remarks: account.remarks || "",
  };
  // 에러 초기화
  resetErrors();
}

function resetForm() {
  selectedAccount.value = null;
  form.value = {
    accountName: "",
    businessNo: "",
    chargerName: "",
    phone: "",
    address: "",
    addressDetail: "",
    accountType: "customer",
    useYn: "Y",
    email: "",
    remarks: "",
  };
  resetErrors();
}

function resetErrors() {
  errors.value = {
    accountName: false,
    businessNo: false,
    chargerName: false,
    phone: false,
  };
}

// 폼 검증
function validateForm() {
  resetErrors();
  let isValid = true;

  if (!form.value.accountName.trim()) {
    errors.value.accountName = true;
    isValid = false;
  }

  if (!form.value.businessNo || !isValidBusinessNo(form.value.businessNo)) {
    errors.value.businessNo = true;
    isValid = false;
  }

  if (!form.value.chargerName.trim()) {
    errors.value.chargerName = true;
    isValid = false;
  }

  if (!form.value.phone || !isValidPhone(form.value.phone)) {
    errors.value.phone = true;
    isValid = false;
  }

  return isValid;
}

// 사업자번호 유효성 검사
function isValidBusinessNo(businessNo: string) {
  const regex = /^\d{3}-\d{2}-\d{5}$/;
  return regex.test(businessNo);
}

// 전화번호 유효성 검사
function isValidPhone(phone: string) {
  const regex =
    /^\d{3}-\d{4}-\d{4}$|^\d{2}-\d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$|^\d{4}-\d{4}$/;
  return regex.test(phone);
}

// 저장
async function saveAccount() {
  if (!canManageSales) {
    alert("거래처 관리 권한이 없습니다.");
    return;
  }

  if (!validateForm()) {
    return;
  }

  try {
    const accountData = {
      account_name: form.value.accountName,
      business_no: form.value.businessNo,
      charger_name: form.value.chargerName,
      phone: form.value.phone,
      address: form.value.address,
      address_detail: form.value.addressDetail,
      account_type: form.value.accountType,
      use_yn: form.value.useYn,
      email: form.value.email,
      remarks: form.value.remarks,
    };

    if (selectedAccount.value) {
      // 수정
      await axios.put(
        `/account/${selectedAccount.value.account_id}`,
        accountData,
      );
      alert("거래처가 수정되었습니다.");
    } else {
      // 신규 등록
      await axios.post("/account", accountData);
      alert("거래처가 등록되었습니다.");
    }

    // 목록 새로고침
    await fetchAccounts();
    resetForm();
  } catch (error) {
    console.error("거래처 저장 실패:", error);
    alert("거래처 저장에 실패했습니다.");
  }
}

// 선택 삭제
async function deleteSelected() {
  if (!canManageSales) {
    alert("거래처 관리 권한이 없습니다.");
    return;
  }

  console.log("삭제할 selectedIds:", selectedIds.value);
  if (selectedIds.value.length === 0) return;

  if (
    !confirm(
      `선택한 ${selectedIds.value.length}개의 거래처를 삭제하시겠습니까?`,
    )
  ) {
    return;
  }

  try {
    // 여러 개 삭제 API 호출
    const res = await axios.post("/account/delete-multiple", {
      ids: selectedIds.value,
    });

    const { success, deletedCount, failedCount, failedIds, message } = res.data;

    // 성공/실패 안내 분기
    if (!success && failedCount > 0) {
      alert(
        `${message}\n\n삭제 실패한 거래처 ID: ${
          failedIds && failedIds.length ? failedIds.join(", ") : "없음"
        }`,
      );
    } else {
      alert(message);
    }

    // 목록 새로고침 & 선택 해제
    await fetchAccounts();
    selectedIds.value = [];
  } catch (error) {
    console.error("거래처 삭제 실패:", error);
    alert("거래처 삭제에 실패했습니다.");
  }
}

// 엑셀 내보내기
function exportExcel() {
  // 실제로는 서버에서 엑셀 파일 생성하여 다운로드
  console.log("엑셀 내보내기");
  alert("엑셀 내보내기 기능은 준비 중입니다.");
}

// 주소 검색 (다음 주소 API 등)
function searchAddress() {
  // 실제로는 다음 주소 API 팝업 호출
  console.log("주소 검색");
  alert("주소 검색 기능은 준비 중입니다.");
}

// 사업자번호 자동 포맷팅
function handleBusinessNoInput(value: string) {
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, "");

  // 사업자 포맷팅
  if (numbers.length >= 10) {
    form.value.businessNo = `${numbers.slice(0, 3)}-${numbers.slice(
      3,
      5,
    )}-${numbers.slice(5)}`;
  } else if (numbers.length == 3) {
    form.value.businessNo = `${numbers.slice(0, 3)}-`;
  } else if (numbers.length == 5) {
    form.value.businessNo = `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-`;
  }
}

// 전화번호 자동 포맷팅
function handlePhoneInput(value: string) {
  // 숫자만 추출
  const phonenumbers = value.replace(/[^0-9]/g, "");

  // 포맷팅
  if (phonenumbers.length == 11) {
    form.value.phone = `${phonenumbers.slice(0, 3)}-${phonenumbers.slice(
      3,
      7,
    )}-${phonenumbers.slice(7)}`;
  } else if (phonenumbers.length == 9) {
    form.value.phone = `${phonenumbers.slice(0, 2)}-${phonenumbers.slice(
      2,
      5,
    )}-${phonenumbers.slice(5)}`;
  } else if (phonenumbers.length == 10) {
    form.value.phone = `${phonenumbers.slice(0, 3)}-${phonenumbers.slice(
      3,
      6,
    )}-${phonenumbers.slice(6)}`;
  }
}

// 감시자
watch(
  filters,
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

watch(itemsPerPage, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* 전체 컨테이너 */
.account-page-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 100px);
  background-color: #f5f5f5;
  align-items: stretch;
}

/* 좌측 패널 */
.account-list-panel {
  flex: 1;
  min-width: 800px;
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  max-width: 248px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.account-table {
  width: 100%;
  border-collapse: collapse;
}

.account-table th {
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

.account-table td {
  padding: 12px 8px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.account-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

.account-table tbody tr:hover {
  background-color: #f8f8f8;
}

.account-table tbody tr.selected {
  background-color: #e3f2fd;
}

.address-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.account-detail-panel {
  flex: 0 0 450px;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.address-input-group {
  display: flex;
  gap: 8px;
}

.address-input-group .va-input {
  flex: 1;
}

/* 유틸리티 클래스 */
.ml-3 {
  margin-left: 12px;
}

/* 반응형 */
@media (max-width: 1400px) {
  .filter-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .account-detail-panel {
    flex: 0 0 400px;
  }
}

@media (max-width: 1200px) {
  .account-page-container {
    flex-direction: column;
  }

  .account-list-panel {
    min-width: unset;
    max-height: unset;
  }

  .account-detail-panel {
    flex: 1;
    width: 100%;
    position: static;
  }
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }

  .account-table {
    font-size: 12px;
  }

  .account-table th,
  .account-table td {
    padding: 8px 4px;
  }
}
</style>
