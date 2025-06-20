<template>
  <div class="order-management">
    <h1>주문 관리</h1>

    <!-- 검색 영역 -->
    <div class="search-area">
      <va-input
        v-model="searchText"
        placeholder="주문번호, 거래처명 검색"
        style="width: 300px"
      />
      <va-button @click="handleSearch"> 검색 </va-button>
    </div>

    <!-- 권한 없는 사용자를 위한 메시지 -->
    <div v-if="!canManageSales" class="permission-notice">
      <va-alert color="info" icon="info">
        조회 전용 모드입니다. 주문 관리는 영업부서 권한이 필요합니다.
      </va-alert>
    </div>

    <!-- 주문 목록 테이블 -->
    <div class="table-section">
      <table class="order-table">
        <thead>
          <tr>
            <th>주문번호</th>
            <th>거래처명</th>
            <th>주문일</th>
            <th>납기일</th>
            <th>상태</th>
            <!-- 삭제 버튼은 영업 권한이 있을 때만 -->
            <th v-if="canManageSales" style="width: 80px; text-align: center">
              삭제
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in groupedOrders" :key="order.orderId">
            <!-- 주문 헤더 행 -->
            <tr
              class="order-header-row"
              :class="{
                selected: selectedOrderId === order.orderId && canManageSales,
                'read-only': !canManageSales,
              }"
              @click="handleOrderClick(order)"
            >
              <td>{{ order.orderId }}</td>
              <td>{{ order.customerName }}</td>
              <td>{{ formatDateToYMD(order.orderDate) }}</td>
              <td>{{ formatDateToYMD(order.deliveryDate) }}</td>
              <td>
                <va-chip
                  :color="getStatusColor(order.status)"
                  size="small"
                  :class="{ 'clickable-status': canManageSales }"
                  :title="canManageSales ? '클릭하여 상태 변경' : ''"
                  @click.stop="canManageSales ? openStatusModal(order) : null"
                >
                  {{ order.status }}
                </va-chip>
              </td>
              <!-- 삭제 버튼은 영업 권한이 있을 때만 -->
              <td v-if="canManageSales" style="text-align: center">
                <va-button
                  icon="delete"
                  preset="plain"
                  size="medium"
                  color="danger"
                  title="주문 삭제"
                  @click.stop="deleteOrder(order)"
                />
              </td>
            </tr>

            <!-- 제품 목록 행 (펼쳐질 때만 표시) -->
            <Transition name="accordion">
              <tr
                v-if="expandedOrders.includes(order.orderId)"
                class="product-details-row"
              >
                <td :colspan="canManageSales ? 6 : 5">
                  <table class="product-table">
                    <thead>
                      <tr>
                        <th>제품명</th>
                        <th>규격</th>
                        <th>수량</th>
                        <th>제품코드</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in order.items" :key="item.productCode">
                        <td>{{ item.productName }}</td>
                        <td>{{ item.productStand }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.productCode }}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </Transition>
          </template>
        </tbody>
      </table>
    </div>

    <!-- 주문 등록/수정 폼 (영업 권한만) -->
    <div v-if="canManageSales" class="form-section">
      <h2>{{ editMode ? "주문 수정" : "주문 등록" }}</h2>

      <!-- 기본 정보 -->
      <div class="form-row">
        <div class="form-group" style="width: 240px">
          <label>거래처 <span class="required">*</span></label>
          <va-select
            v-model="form.customerId"
            :options="customerOptions"
            placeholder="거래처를 선택하세요"
            style="width: 240px"
            text-by="label"
            value-by="value"
          />
        </div>

        <div class="form-group">
          <label>주문일 <span class="required">*</span></label>
          <va-date-input v-model="form.orderDate" />
        </div>
        <div class="form-group">
          <label>납기일 <span class="required">*</span></label>
          <va-date-input v-model="form.deliveryDate" />
        </div>

        <div class="form-group">
          <label>작성자</label>
          <va-input
            v-model="form.createdBy"
            placeholder="작성자명"
            style="width: 250px"
          />
        </div>
      </div>

      <!-- 제품 정보 -->
      <div class="products-section">
        <div class="section-header">
          <h3>제품 정보</h3>
          <va-button size="small" @click="addProduct"> 제품 추가 </va-button>
        </div>

        <table class="product-table">
          <thead>
            <tr>
              <th style="width: 186px">제품명</th>
              <th style="width: 120px">규격 (정)</th>
              <th>제품코드</th>
              <th>수량 (box)</th>
              <th>단가 (원)</th>
              <th>주문가격 (원)</th>
              <th style="width: 50px; text-align: center">삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in form.products" :key="index">
              <!-- 제품명 -->
              <td>
                <va-select
                  v-model="item.productName"
                  :options="uniqueProductName"
                  placeholder="제품 선택"
                  @update:model-value="(val) => updateProduct(val, index)"
                />
              </td>
              <!-- 규격 -->
              <td>
                <va-select
                  v-model="item.productStand"
                  :options="getProductStandOptions(item.productName)"
                  placeholder="규격 선택"
                  :disabled="!item.productName"
                  @update:model-value="
                    (val) =>
                      updateProductByProductStand(item.productName, val, index)
                  "
                />
              </td>
              <!-- 제품코드 -->
              <td>{{ item.productCode }}</td>
              <!-- 수량 -->
              <td>
                <va-input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  @input="onQuantityInput(index)"
                />
              </td>
              <!-- 단가 -->
              <td>
                {{ item.unitPrice.toLocaleString() }}
              </td>
              <!-- 주문가격 -->
              <td>
                {{ computedOrderPrices[index].toLocaleString() }}
              </td>
              <td style="text-align: center">
                <va-button
                  icon="delete"
                  preset="plain"
                  size="medium"
                  color="danger"
                  @click="removeProduct(index)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 버튼 -->
      <div class="form-actions">
        <va-button preset="secondary" @click="resetForm">
          <va-icon name="refresh" class="mr-1" />
          초기화
        </va-button>
        <va-button preset="secondary" @click="cancelForm"> 취소 </va-button>
        <va-button @click="saveOrder">
          {{ editMode ? "수정" : "저장" }}
        </va-button>
      </div>
    </div>

    <!-- 권한 없는 사용자를 위한 안내 섹션 -->
    <div v-else class="permission-info-section">
      <div class="permission-content">
        <va-icon name="shopping_cart" size="large" color="primary" />
        <h3>주문 관리 권한 필요</h3>
        <p>주문 등록 및 수정은 영업부서 권한이 필요합니다.</p>
        <div class="current-permission">
          <va-chip color="info" size="small">
            현재 권한: {{ userRole || "조회 전용" }}
          </va-chip>
        </div>
        <p class="permission-desc">
          주문 목록은 조회할 수 있지만,<br />
          등록, 수정, 삭제는 영업부서만 가능합니다.
        </p>
      </div>
    </div>

    <!-- 주문 상태 변경 모달 -->
    <va-modal
      v-model="showStatusModal"
      title="주문 상태 변경"
      size="small"
      hide-default-actions
    >
      <div class="status-modal-content">
        <div class="current-status">
          <p>
            <strong>주문번호:</strong> {{ selectedOrderForStatus?.orderId }}
          </p>
          <p>
            <strong>거래처:</strong> {{ selectedOrderForStatus?.customerName }}
          </p>
          <p>
            <strong>현재 상태:</strong>
            <va-chip
              :color="getStatusColor(selectedOrderForStatus?.status)"
              size="small"
            >
              {{ selectedOrderForStatus?.status }}
            </va-chip>
          </p>
        </div>

        <div class="form-group">
          <label>변경할 상태 <span class="required">*</span></label>
          <va-select
            v-model="statusForm.newStatus"
            :options="statusOptions"
            placeholder="상태를 선택하세요"
          />
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <va-button preset="secondary" @click="closeStatusModal">
            취소
          </va-button>
          <va-button :loading="statusLoading" @click="updateOrderStatus">
            변경
          </va-button>
        </div>
      </template>
    </va-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// 인증 스토어 사용
const authStore = useAuthStore();
const { canManageSales, userRole } = authStore;

// 데이터
const orders = ref<any[]>([]);
const customers = ref<any[]>([]);
const products = ref<any[]>([]);

// 상태
const searchText = ref("");
const editMode = ref(false);
const selectedOrderId = ref<number | null>(null);

// 상태 모달 관련 데이터
const showStatusModal = ref(false);
const selectedOrderForStatus = ref<any | null>(null);
const statusLoading = ref(false);

const statusForm = ref({
  newStatus: "",
});

const statusOptions = ref(["대기", "진행중", "완료", "지연", "취소"]);

// 날짜 포맷팅
const formatDateToYMD = (date: string | Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

// 펼쳐진 주문 목록 관리
const expandedOrders = ref<number[]>([]);

// 주문 펼치기/접기 토글 함수
const toggleOrder = (orderId: number) => {
  const index = expandedOrders.value.indexOf(orderId);
  if (index > -1) {
    expandedOrders.value.splice(index, 1); // 접기
  } else {
    expandedOrders.value.push(orderId); // 펼치기
  }
};

// 같은 주문번호 그룹(아코디언)
interface OrderItem {
  productName: string;
  productStand: string;
  quantity: number;
  productCode: string;
}

interface GroupedOrder {
  orderId: number;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  items: OrderItem[];
}

const groupedOrders = computed<GroupedOrder[]>(() => {
  const grouped: Record<string, GroupedOrder> = {};

  filteredOrders.value.forEach((order) => {
    const orderId = order.order_id;

    if (!grouped[orderId]) {
      grouped[orderId] = {
        orderId: orderId,
        customerName: order.account_name,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        status: order.status,
        items: [],
      };
    }

    grouped[orderId].items.push({
      productName: order.product_name,
      productStand: order.product_stand,
      quantity: order.order_qty,
      productCode: order.product_code,
    });
  });

  return Object.values(grouped);
});

// 폼 데이터
const form = ref({
  customerId: "",
  orderDate: new Date(),
  deliveryDate: new Date(),
  createdBy: "",
  products: [
    {
      productCode: "",
      productName: "",
      productStand: "",
      quantity: 1,
      unitPrice: 0,
    },
  ],
});

// computed
const filteredOrders = computed(() => {
  if (!searchText.value) return orders.value;

  const search = searchText.value.toLowerCase();
  return orders.value.filter(
    (order) =>
      String(order.order_id).toLowerCase().includes(search) ||
      order.account_name.toLowerCase().includes(search),
  );
});

// 거래처 선택 드롭다운(고객사만 나오게)
const customerOptions = computed(() =>
  customers.value
    .filter((c) => c.account_type == "customer")
    .map((c) => ({
      value: c.account_id,
      label: c.account_name,
    })),
);

const uniqueProductName = computed(() => {
  // 제품명 중복제거
  const uniqueNames = [...new Set(products.value.map((p) => p.product_name))];
  return uniqueNames;
});

// 제품 규격 선택
function getProductStandOptions(productName: string) {
  if (!productName) {
    return [];
  }

  return products.value
    .filter((p) => p.product_name === productName)
    .map((p) => p.product_stand);
}

// 수량 마이너스 선택 못하게!
function onQuantityInput(index: number) {
  const q = form.value.products[index].quantity;
  if (q < 1 || isNaN(q)) {
    form.value.products[index].quantity = 1;
  }
}

// 주문 가격 computed
const computedOrderPrices = computed(() => {
  return form.value.products.map((item) => item.unitPrice * item.quantity);
});

// 상태 모달 함수들
function openStatusModal(order: GroupedOrder) {
  if (!canManageSales) {
    alert("주문 상태 변경 권한이 없습니다.");
    return;
  }

  selectedOrderForStatus.value = order;
  statusForm.value.newStatus = "";
  showStatusModal.value = true;
}

function closeStatusModal() {
  showStatusModal.value = false;
  selectedOrderForStatus.value = null;
}

async function updateOrderStatus() {
  if (!statusForm.value.newStatus) {
    alert("변경할 상태를 선택하세요.");
    return;
  }

  if (statusForm.value.newStatus === selectedOrderForStatus.value?.status) {
    alert("현재 상태와 동일한 상태로는 변경할 수 없습니다.");
    return;
  }

  try {
    statusLoading.value = true;

    const statusData = {
      newStatus: statusForm.value.newStatus,
    };

    await axios.put(
      `/orders/${selectedOrderForStatus.value!.orderId}/status`,
      statusData,
    );

    alert("주문 상태가 변경되었습니다.");
    closeStatusModal();

    // 주문 목록 새로고침
    await fetchOrders();
  } catch (error: any) {
    console.error("상태 변경 실패:", error);
    alert(
      `상태 변경에 실패했습니다.\n${
        error.response?.data?.message || "알 수 없는 오류"
      }`,
    );
  } finally {
    statusLoading.value = false;
  }
}

// 초기 데이터 로드
onMounted(() => {
  console.log("컴포넌트 마운트됨");
  fetchOrders();
  fetchCustomers();
  fetchProducts();
});

// API 함수들
async function fetchOrders() {
  try {
    const response = await axios.get("/orders/with-items");
    console.log("주문 데이터:", response.data);
    orders.value = response.data || [];
  } catch (error) {
    console.error("주문 조회 실패:", error);
    // Mock 데이터
    orders.value = [
      {
        order_id: 1,
        account_name: "셀트리온",
        order_date: "2024-01-15",
        delivery_date: "2024-01-20",
        product_name: "타이레놀 500mg",
        product_stand: "10정",
        order_qty: 100,
        product_code: "TYL500",
        status: "진행중",
      },
      {
        order_id: 2,
        account_name: "한미약품",
        order_date: "2024-01-16",
        delivery_date: "2024-01-22",
        product_name: "아스피린 100mg",
        product_stand: "30정",
        order_qty: 200,
        product_code: "ASP100",
        status: "완료",
      },
    ];
  }
}

async function fetchCustomers() {
  try {
    const response = await axios.get("/account");
    console.log("거래처 데이터:", response.data);
    customers.value = response.data || [];
  } catch (error) {
    console.error("거래처 조회 실패:", error);
    // Mock 데이터 추가
    customers.value = [
      { account_id: 1, account_name: "셀트리온", account_type: "customer" },
      { account_id: 2, account_name: "한미약품", account_type: "customer" },
    ];
  }
}

async function fetchProducts() {
  try {
    const response = await axios.get("/product");
    console.log("제품 데이터:", response.data);
    products.value = response.data || [];
  } catch (error) {
    console.error("제품 조회 실패:", error);
    // Mock 데이터 추가
    products.value = [
      {
        product_id: 1,
        product_name: "타이레놀 500mg",
        product_stand: "10정",
        product_code: "TYL500",
        product_pay: 5000,
      },
      {
        product_id: 2,
        product_name: "아스피린 100mg",
        product_stand: "30정",
        product_code: "ASP100",
        product_pay: 3000,
      },
    ];
  }
}

// 검색
function handleSearch() {
  // filteredOrders computed가 자동으로 처리
}

// 주문 수정
async function editOrder(order: GroupedOrder) {
  if (!canManageSales) {
    console.log("주문 수정 권한이 없습니다.");
    return;
  }

  console.log("주문 수정:", order);
  editMode.value = true;
  selectedOrderId.value = order.orderId;

  try {
    const response = await axios.get(`/orders/${order.orderId}/details`);
    console.log("서버 응답 데이터: ", response.data);
    const { order: orderInfo, items } = response.data;

    // 거래처 ID 찾기
    const customer = customers.value.find(
      (c) => c.account_name === order.customerName,
    );

    form.value = {
      customerId: customer?.account_id || "",
      orderDate: new Date(orderInfo.order_date),
      deliveryDate: new Date(orderInfo.delivery_date),
      createdBy: orderInfo.created_by || "",
      products: items.map((item: any) => ({
        productName: item.product_name,
        productStand: item.product_stand,
        productCode: item.product_code,
        quantity: item.order_qty,
        unitPrice: item.unit_price || 0,
      })),
    };

    console.log("폼 데이터 설정 완료: ", form.value);
  } catch (error) {
    console.error("주문 상세 조회 실패:", error);
    // API 실패시 목업 데이터로 폼 채우기
    const customer = customers.value.find(
      (c) => c.account_name === order.customerName,
    );

    form.value = {
      customerId: customer?.account_id || "",
      orderDate: new Date(order.orderDate),
      deliveryDate: new Date(order.deliveryDate),
      createdBy: "관리자",
      products: order.items.map((item) => {
        const product = products.value.find(
          (p) =>
            p.product_name === item.productName &&
            p.product_stand === item.productStand,
        );
        return {
          productName: item.productName,
          productStand: item.productStand,
          productCode: item.productCode,
          quantity: item.quantity,
          unitPrice: product?.product_pay || 0,
        };
      }),
    };
  }
}

// 주문 선택시 토글&수정폼
function handleOrderClick(order: GroupedOrder) {
  console.log("클릭된 order 데이터: ", order);
  toggleOrder(order.orderId);

  // 영업 권한이 있을 때만 수정 폼 로드
  if (canManageSales) {
    editOrder(order);
  }
}

// 주문 삭제
async function deleteOrder(order: GroupedOrder) {
  if (!canManageSales) {
    alert("주문 관리 권한이 없습니다.");
    return;
  }

  if (!confirm(`주문번호 ${order.orderId}를 정말 삭제하시겠습니까?`)) return;

  try {
    await axios.delete(`/orders/${order.orderId}`);
    alert("삭제되었습니다.");

    // 삭제한 주문이 선택된 상태였다면 폼 초기화
    if (selectedOrderId.value === order.orderId) {
      resetForm();
    }

    fetchOrders();
  } catch (error) {
    console.error("삭제 실패:", error);
    alert("삭제에 실패했습니다.");
  }
}

function addProduct() {
  form.value.products.push({
    productName: "",
    productStand: "",
    quantity: 1,
    productCode: "",
    unitPrice: 0,
  });
}

function removeProduct(index: number) {
  if (form.value.products.length > 1) {
    form.value.products.splice(index, 1);
  }
}

// 제품 선택 시 정보 업데이트
function updateProduct(productName: string, index: number) {
  const product = products.value.find((p) => p.product_name == productName);
  if (product) {
    form.value.products[index] = {
      productCode: "",
      productName: product.product_name,
      productStand: "",
      quantity: form.value.products[index].quantity || 1,
      unitPrice: 0,
    };
  }
}

// 제품명, 규격 선택 시 나머지 데이터 자동입력
function updateProductByProductStand(
  productName: string,
  productStand: string,
  index: number,
) {
  console.log("규격 업데이트 됨!");
  const product = products.value.find(
    (p) => p.product_name === productName && p.product_stand === productStand,
  );
  if (product) {
    const quantity = form.value.products[index].quantity;
    const unitPrice = product.product_pay;

    form.value.products[index] = {
      productCode: product.product_code,
      productName: product.product_name,
      productStand: product.product_stand,
      quantity: quantity,
      unitPrice: unitPrice,
    };
  }
}

// 폼 초기화
function resetForm() {
  form.value = {
    customerId: "",
    orderDate: new Date(),
    deliveryDate: new Date(),
    createdBy: "",
    products: [
      {
        productName: "",
        productStand: "",
        quantity: 1,
        productCode: "",
        unitPrice: 0,
      },
    ],
  };
  editMode.value = false;
  selectedOrderId.value = null;
}

// 저장
async function saveOrder() {
  if (!canManageSales) {
    alert("주문 관리 권한이 없습니다.");
    return;
  }

  // 유효성 검사
  if (!form.value.customerId) {
    alert("거래처를 선택하세요.");
    return;
  }

  if (form.value.products.some((p) => !p.productCode)) {
    alert("제품 정보를 모두 입력하세요.");
    return;
  }

  if (editMode.value) {
    // 수정모드
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const formatDateForAPI = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = ("0" + (d.getMonth() + 1)).slice(-2);
      const day = ("0" + d.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    };

    const orderData = {
      account_id: form.value.customerId,
      order_date: formatDateForAPI(form.value.orderDate),
      delivery_date: formatDateForAPI(form.value.deliveryDate),
      created_by: form.value.createdBy || "관리자",
      status: "진행중",
      products: form.value.products.map((p, index) => ({
        product_code: p.productCode,
        order_qty: p.quantity,
        order_price: computedOrderPrices.value[index],
      })),
    };

    try {
      await axios.put(`/orders/${selectedOrderId.value}`, orderData);
      alert("수정되었습니다.");
      resetForm();
      fetchOrders();
    } catch (error: any) {
      console.error("수정 실패:", error);
      alert(
        `수정에 실패했습니다.\n${
          error.response?.data?.message || error.message || "알 수 없는 오류"
        }`,
      );
    }
  } else {
    // 등록모드 - addOrderTransaction이 기대하는 형식으로
    const orderData = {
      customerId: {
        value: form.value.customerId,
      },
      orderDate: form.value.orderDate,
      deliveryDate: form.value.deliveryDate,
      createdBy: form.value.createdBy || "관리자",
      products: form.value.products.map((p, index) => ({
        productCode: p.productCode,
        quantity: p.quantity,
        orderPrice: computedOrderPrices.value[index],
      })),
    };

    console.log("저장할 데이터:", orderData);

    try {
      await axios.post("/orders", orderData);
      alert("등록되었습니다.");
      resetForm();
      fetchOrders();
    } catch (error: any) {
      console.error("저장 실패:", error);
      console.error("에러 상세:", error.response?.data);
      alert(
        `저장에 실패했습니다.\n${
          error.response?.data?.message || error.message || "알 수 없는 오류"
        }`,
      );
    }
  }
}

// 취소
function cancelForm() {
  resetForm();
}

// 날짜 포맷
function formatDate(dateString: string) {
  if (!dateString) return "-";
  return dateString.split("T")[0];
}

// 상태별 색상
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    진행중: "info",
    완료: "success",
    지연: "danger",
    대기: "warning",
    취소: "secondary",
  };
  return colors[status] || "secondary";
}
</script>

<style scoped>
.order-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-width: 600px;
}

h1 {
  margin-bottom: 20px;
}

/* 검색 영역 */
.search-area {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: nowrap;
}

.search-area .va-input {
  width: 300px;
  flex-shrink: 0;
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
}

.order-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 500;
  border-bottom: 2px solid #e0e0e0;
}

.order-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-table tr:hover {
  background: #f8f8f8;
}

.order-header-row.selected {
  background-color: #e3f2fd;
}

.no-data {
  text-align: center;
  color: #999;
}

/* 클릭 가능한 상태 스타일 */
.clickable-status {
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.clickable-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 폼 섹션 */
.form-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 0 auto;
}

.form-section h2 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 16px;
}

.required {
  color: red;
}

/* 제품 섹션 */
.products-section {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.product-table th {
  background: #f5f5f5;
  padding: 8px;
  text-align: left;
  font-weight: 500;
  border: 1px solid #e0e0e0;
}

.product-table td {
  padding: 8px;
  border: 1px solid #e0e0e0;
}

/* 버튼 영역 */
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.new-order-button {
  margin-top: 20px;
  text-align: center;
}

/* 상태 모달 스타일 */
.status-modal-content {
  padding: 16px 0;
}

.current-status {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.current-status p {
  margin: 4px 0;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 권한 안내 섹션 */
.permission-info-section {
  background: white;
  border-radius: 8px;
  padding: 40px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-top: 20px;
}

.permission-content {
  max-width: 400px;
  margin: 0 auto;
}

.permission-content h3 {
  margin: 16px 0;
  color: #333;
}

.permission-content p {
  color: #666;
  line-height: 1.5;
  margin: 12px 0;
}

.current-permission {
  margin: 16px 0;
}

.permission-desc {
  font-size: 14px;
}

/* 반응형 */
@media (max-width: 1420px) {
  .form-row {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .search-area {
    flex-direction: row;
    align-items: center;
  }
}

@media (max-width: 1180px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }

  .search-area {
    flex-direction: row;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .search-area {
    flex-direction: row;
    align-items: center;
  }
}

.order-header-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.order-header-row:hover {
  background-color: #f5f5f5;
}

.product-details-row {
  background-color: #fafafa;
}

.product-details-content {
  overflow: hidden;
}

/* 제품목록 흘러내리는 애니메이션 */
.accordion-enter-active {
  animation: slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.accordion-leave-active {
  animation: slideUp 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

@keyframes slideDown {
  0% {
    max-height: 0;
    opacity: 0;
    transform: scaleY(0);
    transform-origin: top;
  }
  100% {
    max-height: 400px;
    opacity: 1;
    transform: scaleY(1);
    transform-origin: top;
  }
}

@keyframes slideUp {
  0% {
    max-height: 400px;
    opacity: 1;
    transform: scaleY(1);
    transform-origin: top;
  }
  100% {
    max-height: 0;
    opacity: 0;
    transform: scaleY(0);
    transform-origin: top;
  }
}

.product-table {
  width: 100%;
  margin: 10px 0;
}

.product-table th,
.product-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
</style>
