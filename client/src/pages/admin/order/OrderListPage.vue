<template>
  <div class="order-page-container">
    <!-- 🔹 좌측 패널: 주문 목록 -->
    <div class="order-list-panel">
      <h1 class="page-title">주문 조회</h1>

      <!-- 🔹 검색 영역 -->
      <div class="search-filter-area">
        <!-- 검색창 -->
        <div class="search-bar">
          <!-- v-model: 입력값과 searchText 변수를 양방향으로 연결 -->
          <va-input
            v-model="searchText"
            placeholder="주문번호, 거래처명으로 검색..."
            class="search-input"
          >
            <!-- 검색 아이콘을 입력창 앞에 추가 -->
            <template #prepend>
              <va-icon name="search" />
            </template>
          </va-input>
          <!-- @click: 버튼 클릭 시 handleSearch 함수 실행 -->
          <va-button @click="handleSearch"> 조회 </va-button>
        </div>

        <!-- 🔹 필터 드롭다운 영역 -->
        <div class="filter-row">
          <!-- 거래처명 필터 -->
          <div class="filter-item">
            <label>거래처명</label>
            <!-- v-model로 선택값을 filters.customer에 저장 -->
            <va-select
              v-model="filters.customer"
              :options="customerOptions"
              placeholder="전체"
              clearable
            />
          </div>

          <!-- 사업자번호 필터 -->
          <div class="filter-item">
            <label>사업자번호</label>
            <va-select
              v-model="filters.businessNo"
              :options="businessNoOptions"
              placeholder="전체"
              clearable
            />
          </div>

          <!-- 담당자 필터 -->
          <div class="filter-item">
            <label>담당자</label>
            <va-select
              v-model="filters.manager"
              :options="managerOptions"
              placeholder="전체"
              clearable
            />
          </div>

          <!-- 상태 필터 -->
          <div class="filter-item">
            <label>상태</label>
            <va-select
              v-model="filters.status"
              :options="statusOptions"
              placeholder="전체"
              clearable
            />
          </div>
        </div>
      </div>

      <!-- 🔹 주문 목록 테이블 -->
      <div class="table-container">
        <table class="order-table">
          <thead>
            <tr>
              <th width="40">
                <!-- 전체 선택 체크박스 -->
                <va-checkbox
                  v-model="selectAll"
                  @update:model-value="handleSelectAll"
                />
              </th>
              <th>주문번호</th>
              <th>거래처명</th>
              <th>주문일</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <!-- v-for: 배열을 순회하며 각 항목을 표시 -->
            <tr
              v-for="order in paginatedOrders"
              :key="order.order_id"
              :class="{ selected: selectedOrder?.order_id === order.order_id }"
              @click="selectOrder(order)"
            >
              <!-- @click.stop: 이벤트 전파 중지 (tr의 클릭 이벤트가 실행되지 않음) -->
              <td @click.stop>
                <va-checkbox
                  v-model="selectedIds"
                  :array-value="order.order_id"
                />
              </td>
              <td>{{ order.order_id }}</td>
              <td>{{ order.customer_name }}</td>
              <td>{{ formatDate(order.order_date) }}</td>
              <td>
                <!-- 상태별 색상 표시 -->
                <va-chip :color="getStatusColor(order.status)" size="small">
                  {{ order.status }}
                </va-chip>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 데이터 없을 때 표시 -->
        <div v-if="filteredOrders.length === 0" class="no-data">
          검색 결과가 없습니다.
        </div>
      </div>

      <!-- 🔹 페이지네이션 -->
      <div class="pagination-area">
        <div class="page-info">
          {{ startIndex + 1 }}-{{
            Math.min(currentPage * itemsPerPage, filteredOrders.length)
          }}
          of {{ filteredOrders.length }}
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

    <!-- 🔹 우측 패널: 주문 상세 정보 -->
    <div v-if="selectedOrder" class="order-detail-panel">
      <h2 class="detail-title">주문 상세 조회</h2>

      <!-- 주문 기본 정보 -->
      <div class="order-detail-section">
        <h4>[주문 기본 정보]</h4>
        <div class="order-detail-info">
          <div class="info-row">
            <div class="info-item">
              <span class="label">주문번호:</span>
              <span class="value">{{ selectedOrder.order_id }}</span>
              <va-chip
                :color="getStatusColor(selectedOrder.status)"
                size="small"
                class="ml-2"
              >
                {{ selectedOrder.status }}
              </va-chip>
            </div>
            <div class="info-item">
              <span class="label">주문일:</span>
              <span class="value">{{
                formatDate(selectedOrder.order_date)
              }}</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <span class="label">거래처:</span>
              <span class="value">{{ selectedOrder.customer_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">납기일:</span>
              <span class="value">{{
                formatDate(selectedOrder.delivery_date)
              }}</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <span class="label">연락처:</span>
              <span class="value">{{ selectedOrder.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">작성자:</span>
              <span class="value">{{ selectedOrder.created_by }}</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <span class="label">담당자:</span>
              <span class="value">{{ selectedOrder.manager_name }}</span>
            </div>
          </div>

          <div class="info-row full-width">
            <div class="info-item">
              <span class="label">주소:</span>
              <span class="value">{{ selectedOrder.address }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 주문 품목 정보 -->
      <div class="order-detail-section">
        <h4>[주문 품목 정보]</h4>
        <div class="item-table-wrapper">
          <table class="item-table">
            <thead>
              <tr>
                <th>제품명</th>
                <th>규격</th>
                <th>제품코드</th>
                <th>출하 필요량</th>
                <th>현재 재고</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in orderItems" :key="item.product_id">
                <td>{{ item.product_name }}</td>
                <td>{{ item.spec }}</td>
                <td>{{ item.product_code }}</td>
                <td>{{ item.order_qty }}</td>
                <td>{{ item.stock_qty }}</td>
                <td>{{ item.note || "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 선택된 주문이 없을 때 -->
    <div v-else class="order-detail-panel">
      <div class="empty-state">
        <va-icon name="inventory_2" size="48px" color="secondary" />
        <p>주문을 선택하면 상세 정보가 표시됩니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 🔹 Vue 3 Composition API 함수들을 가져옵니다
import { ref, computed, onMounted, watch } from "vue";
// 🔹 HTTP 요청을 위한 axios 라이브러리
import axios from "axios";

// 🔹 TypeScript 인터페이스: 데이터의 구조를 정의합니다
interface Order {
  order_id: string; // 주문번호
  customer_name: string; // 거래처명
  customer_id: string; // 거래처 ID
  order_date: string; // 주문일
  delivery_date: string; // 납기일
  status: string; // 상태
  phone: string; // 연락처
  address: string; // 주소
  manager_name: string; // 담당자명
  created_by: string; // 작성자
}

interface OrderItem {
  product_id: string; // 제품 ID
  product_name: string; // 제품명
  product_code: string; // 제품코드
  spec: string; // 규격
  order_qty: number; // 주문수량
  stock_qty: number; // 재고수량
  note: string; // 비고
}

// 🔹 ref(): Vue의 반응형 데이터를 만듭니다
// 값이 변경되면 화면이 자동으로 업데이트됩니다
const searchText = ref(""); // 검색어
const selectedIds = ref<string[]>([]); // 선택된 주문 ID들
const selectAll = ref(false); // 전체 선택 여부
const currentPage = ref(1); // 현재 페이지
const itemsPerPage = ref(10); // 페이지당 항목 수
const orders = ref<Order[]>([]); // 전체 주문 목록
const selectedOrder = ref<Order | null>(null); // 선택된 주문
const orderItems = ref<OrderItem[]>([]); // 선택된 주문의 품목들
const loading = ref(false); // 로딩 상태

// 🔹 필터 상태
const filters = ref({
  customer: "", // 거래처명 필터
  businessNo: "", // 사업자번호 필터
  manager: "", // 담당자 필터
  status: "", // 상태 필터
});

// 🔹 필터 옵션들 (DB에서 가져온 고유값들)
const customerOptions = ref<string[]>([]);
const businessNoOptions = ref<string[]>([]);
const managerOptions = ref<string[]>([]);
const statusOptions = ref(["진행중", "완료", "지연", "대기", "취소"]);

// 🔹 computed: 다른 데이터를 기반으로 계산되는 속성
// 의존하는 데이터가 변경되면 자동으로 재계산됩니다
const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    // 검색어 필터
    const matchesSearch =
      !searchText.value ||
      order.order_id.includes(searchText.value) ||
      order.customer_name
        .toLowerCase()
        .includes(searchText.value.toLowerCase());

    // 드롭다운 필터
    const matchesFilters =
      (!filters.value.customer ||
        order.customer_name === filters.value.customer) &&
      (!filters.value.status || order.status === filters.value.status) &&
      (!filters.value.manager || order.manager_name === filters.value.manager);

    return matchesSearch && matchesFilters;
  });
});

// 🔹 총 페이지 수 계산
const totalPages = computed(() =>
  Math.ceil(filteredOrders.value.length / itemsPerPage.value),
);

// 🔹 현재 페이지의 시작 인덱스
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

// 🔹 현재 페이지에 표시할 주문들
const paginatedOrders = computed(() => {
  const start = startIndex.value;
  const end = start + itemsPerPage.value;
  return filteredOrders.value.slice(start, end);
});

// 🔹 onMounted: 컴포넌트가 화면에 표시될 때 실행됩니다
onMounted(async () => {
  await fetchOrders(); // 주문 목록 가져오기
  await fetchFilterOptions(); // 필터 옵션 가져오기
});

// 🔸 Mock 데이터 함수 (개발용)
function useMockData() {
  // 주문 목록 설정
  orders.value = [
    {
      order_id: "ORD001",
      customer_name: "셀트리온",
      customer_id: "CUS001",
      order_date: "2024-01-15",
      delivery_date: "2024-01-20",
      status: "진행중",
      phone: "02-1234-5678",
      address: "인천광역시 연수구 아카데미로 23",
      manager_name: "홍길동",
      created_by: "김철수",
    },
    {
      order_id: "ORD002",
      customer_name: "한미약품",
      customer_id: "CUS002",
      order_date: "2024-01-16",
      delivery_date: "2024-01-22",
      status: "완료",
      phone: "02-9876-5432",
      address: "서울특별시 송파구 위례성대로 14",
      manager_name: "이영희",
      created_by: "박지민",
    },
    {
      order_id: "ORD003",
      customer_name: "종근당",
      customer_id: "CUS003",
      order_date: "2024-01-17",
      delivery_date: "2024-01-25",
      status: "지연",
      phone: "02-5555-1234",
      address: "서울특별시 용산구 청파로 383",
      manager_name: "홍길동",
      created_by: "김철수",
    },
    {
      order_id: "ORD004",
      customer_name: "대웅제약",
      customer_id: "CUS004",
      order_date: "2024-01-18",
      delivery_date: "2024-01-28",
      status: "대기",
      phone: "02-3333-4444",
      address: "서울시 강남구 봉은사로 114길 12",
      manager_name: "박지민",
      created_by: "이영희",
    },
  ];

  // 필터 옵션 설정
  customerOptions.value = [
    "셀트리온",
    "한미약품",
    "종근당",
    "대웅제약",
    "유한양행",
  ];
  managerOptions.value = ["홍길동", "김철수", "이영희", "박지민"];
  businessNoOptions.value = ["111-11-11111", "222-22-22222", "333-33-33333"];

  // 첫 번째 주문 자동 선택
  if (orders.value.length > 0) {
    selectOrder(orders.value[0]);
  }
}

// 🔹 API 함수들
// async/await: 비동기 작업을 동기적으로 처리합니다
async function fetchOrders() {
  try {
    loading.value = true;
    // GET 요청: 서버에서 주문 목록을 가져옵니다
    const response = await axios.get("/api/orders");

    // 🔸 디버깅: 받은 데이터 확인
    console.log("API 응답 데이터:", response.data);

    // 🔸 데이터가 배열인지 확인하고 처리
    if (Array.isArray(response.data)) {
      orders.value = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      // 만약 { data: [...] } 형태로 왔다면
      orders.value = response.data.data;
    } else if (response.data && Array.isArray(response.data.orders)) {
      // 만약 { orders: [...] } 형태로 왔다면
      orders.value = response.data.orders;
    } else {
      console.error("예상치 못한 데이터 형식:", response.data);
      orders.value = [];
    }

    // 첫 주문 자동 선택
    if (orders.value.length > 0) {
      await selectOrder(orders.value[0]);
    }
  } catch (error) {
    console.error("주문 목록 로드 실패:", error);
    // API가 아직 없으면 임시 데이터 사용
    orders.value = [
      {
        order_id: "ORD001",
        customer_name: "셀트리온",
        customer_id: "CUS001",
        order_date: "2024-01-15",
        delivery_date: "2024-01-20",
        status: "진행중",
        phone: "02-1234-5678",
        address: "인천광역시 연수구 아카데미로 23",
        manager_name: "홍길동",
        created_by: "김철수",
      },
      {
        order_id: "ORD002",
        customer_name: "한미약품",
        customer_id: "CUS002",
        order_date: "2024-01-16",
        delivery_date: "2024-01-22",
        status: "완료",
        phone: "02-9876-5432",
        address: "서울특별시 송파구 위례성대로 14",
        manager_name: "이영희",
        created_by: "박지민",
      },
    ];
  } finally {
    loading.value = false;
  }
}

// 🔹 필터 옵션 가져오기
async function fetchFilterOptions() {
  try {
    // 거래처명 목록 가져오기
    const customersRes = await axios.get("/api/customers/names");
    customerOptions.value = customersRes.data;

    // 담당자 목록 가져오기
    const managersRes = await axios.get("/api/employees/managers");
    managerOptions.value = managersRes.data;
  } catch (error) {
    console.error("필터 옵션 로드 실패:", error);

    // 🔸 API가 없을 때 임시 데이터 사용
    customerOptions.value = [
      "셀트리온",
      "한미약품",
      "종근당",
      "대웅제약",
      "유한양행",
    ];
    managerOptions.value = ["홍길동", "김철수", "이영희", "박지민"];
    businessNoOptions.value = ["111-11-11111", "222-22-22222", "333-33-33333"];
  }
}

// 🔹 주문 선택 시 상세 정보 가져오기
async function selectOrder(order: Order) {
  try {
    selectedOrder.value = order;

    // 🔸 백엔드 API 경로에 맞게 수정 (/details)
    const response = await axios.get(`/api/orders/${order.order_id}/details`);
    console.log("주문 상세 응답:", response.data);

    // 🔸 백엔드 응답 구조에 맞게 데이터 처리
    if (response.data) {
      // order와 items가 분리되어 있을 경우
      if (response.data.items) {
        orderItems.value = response.data.items;
      }
      // 또는 다른 구조일 경우 (백엔드 응답 확인 필요)
      else if (Array.isArray(response.data)) {
        orderItems.value = response.data;
      } else {
        console.log("예상치 못한 상세 데이터 구조:", response.data);
        orderItems.value = [];
      }
    }
  } catch (error) {
    console.error("주문 상세 정보 로드 실패:", error);

    // 🔸 임시 데이터 사용
    orderItems.value = [
      {
        product_id: "PRD001",
        product_name: "타이레놀 500mg",
        product_code: "TYL-500",
        spec: "500mg x 10정",
        order_qty: 100,
        stock_qty: 50,
        note: "긴급 배송 요청",
      },
      {
        product_id: "PRD002",
        product_name: "아스피린 100mg",
        product_code: "ASP-100",
        spec: "100mg x 30정",
        order_qty: 200,
        stock_qty: 150,
        note: "",
      },
    ];
  }
}

// 🔹 검색 실행
function handleSearch() {
  currentPage.value = 1; // 검색 시 첫 페이지로 이동
}

// 🔹 전체 선택/해제
function handleSelectAll(value: boolean) {
  if (value) {
    // 현재 페이지의 모든 주문 선택
    selectedIds.value = paginatedOrders.value.map((order) => order.order_id);
  } else {
    // 모두 선택 해제
    selectedIds.value = [];
  }
}

// 🔹 날짜 포맷팅 함수
function formatDate(dateString: string) {
  if (!dateString) return "-";
  // YYYY-MM-DD 형식으로 변환
  const date = new Date(dateString);
  return date
    .toLocaleDateString("ko-KR")
    .replace(/\. /g, "-")
    .replace(/\./g, "");
}

// 🔹 상태별 색상 반환
function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    진행중: "info",
    완료: "success",
    지연: "danger",
    대기: "warning",
    취소: "secondary",
  };
  return colorMap[status] || "secondary";
}

// 🔹 watch: 특정 데이터의 변경을 감지합니다
watch(
  filters,
  () => {
    // 필터가 변경되면 첫 페이지로 이동
    currentPage.value = 1;
  },
  { deep: true },
); // deep: 객체 내부의 변경도 감지

// 🔹 페이지당 항목 수 변경 시
watch(itemsPerPage, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* 🔹 scoped: 이 컴포넌트에만 적용되는 스타일 */

/* 전체 컨테이너 */
.order-page-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr; /* 좌 40%, 우 60% */
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 100px);
  background-color: #f5f5f5;
}

/* 좌측 패널 */
.order-list-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  width: 500px;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* 검색 영역 */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1; /* 남은 공간 모두 차지 */
}

/* 필터 행 */
.filter-row {
  display: grid; /* 격자 레이아웃 */
  grid-template-columns: repeat(4, 1fr); /* 4개 열, 동일 너비 */
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

/* 테이블 컨테이너 */
.table-container {
  flex: 1; /* 남은 공간 모두 차지 */
  overflow-y: auto; /* 세로 스크롤 */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

/* 테이블 스타일 */
.order-table {
  width: 100%;
  border-collapse: collapse; /* 테이블 경계선 합치기 */
}

.order-table th {
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: left;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky; /* 스크롤 시 고정 */
  top: 0;
  z-index: 1;
}

.order-table td {
  padding: 12px 8px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.order-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s; /* 부드러운 색상 전환 */
}

.order-table tbody tr:hover {
  background-color: #f8f8f8;
}

.order-table tbody tr.selected {
  background-color: #e3f2fd; /* 선택된 행 강조 */
}

/* 데이터 없음 */
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

/* 우측 패널 */
.order-detail-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

/* 주문 상세 섹션 */
.order-detail-section {
  margin-bottom: 32px;
}

.order-detail-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

/* 정보 행 */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.info-row.full-width {
  grid-template-columns: 1fr;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.info-item .value {
  color: #333;
}

/* 품목 테이블 */
.item-table-wrapper {
  overflow-x: auto;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
}

.item-table th {
  background-color: #f8f8f8;
  padding: 10px;
  text-align: left;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 2px solid #e0e0e0;
}

.item-table td {
  padding: 10px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  gap: 16px;
}

/* 유틸리티 클래스 */
.ml-2 {
  margin-left: 8px;
}
.ml-3 {
  margin-left: 12px;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .order-page-container {
    flex-direction: column;
  }

  .order-list-panel,
  .order-detail-panel {
    flex: 1;
    max-width: none;
  }
}
</style>
