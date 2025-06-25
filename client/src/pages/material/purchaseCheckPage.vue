<template>
  <div class="order-search-page">
    <!-- 발주 조회 -->
    <div class="search-section">
      <h3 class="section-title">발주 조회</h3>
      <div class="search-form">
        <va-input v-model="filters.purchase_order_name" label="발주명" />
        <va-date-input
          v-model="filters.purchase_order_date"
          label="발주일"
          :manual-input="false"
          :clearable="true"
        />
        <va-input v-model="filters.material_name" label="자재명" />
        <va-input v-model="filters.name" label="발주담당자" />
        <va-input v-model="filters.account_name" label="거래처 명" />
        <va-date-input
          v-model="filters.due_date"
          label="납기일"
          :manual-input="false"
          :clearable="true"
        />

        <div class="button-group">
          <va-button @click="searchOrders">조회</va-button>
          <va-button color="secondary" @click="resetFilters">초기화</va-button>
        </div>
      </div>
    </div>

    <!-- 발주 요청 리스트 -->
    <div class="result-section">
      <h3 class="section-title">부족 수량 발주 요청 리스트</h3>
      <div class="table-wrapper">
        <va-data-table
          :items="orderList"
          :columns="columns"
          :per-page="perPage"
          :current-page.sync="page"
          track-by="purchase_order_id"
        >
          <!-- 발주 가격 숫자 포맷팅 -->
          <template #cell(sumPay)="{ value }">
            {{ Number(value).toLocaleString() }} 원
          </template>
          <template #cell(select)="{ row }">
            <va-checkbox
              v-model="selectedIds"
              :array-value="row.source.purchase_order_id"
            />
          </template>
          <template #cell(purchase_order_date)="{ row }">
            {{ formatDateForView(row.source.purchase_order_date) }}
          </template>
          <template #cell(due_date)="{ row }">
            {{ formatDateForView(row.source.due_date) }}
          </template>
        </va-data-table>

        <va-pagination
          v-model="page"
          :pages="Math.max(1, Math.ceil(orderList.length / perPage))"
          class="mt-2"
        />
      </div>
      <div class="button-group mt-3">
        <va-button color="primary" @click="createPurchasePDF"
          >발주 생성</va-button
        >
      </div>
    </div>

    <!-- 📄 발주서 PDF 출력용 영역 (숨김 처리) -->
    <div v-if="showPDF" id="purchase-pdf">
      <h2 class="title">발주서</h2>

      <div class="top-tables">
        <table class="info-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>상호</td>
              <td>{{ firstOrder?.account_name || "-" }}</td>
            </tr>
            <tr>
              <td>사업자 번호</td>
              <td>{{ firstOrder?.business_no || "-" }}</td>
            </tr>
            <tr>
              <td>대표자</td>
              <td>{{ firstOrder?.charger_name || "-" }}</td>
            </tr>
            <tr>
              <td>주소</td>
              <td>{{ firstOrder?.address || "-" }}</td>
            </tr>
          </tbody>
        </table>

        <table class="info-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>발주일</td>
              <td>{{ formatDate(firstOrder?.purchase_order_date || "-") }}</td>
            </tr>
            <tr>
              <td>납기일</td>
              <td>{{ formatDate(firstOrder?.due_date || "-") }}</td>
            </tr>
            <tr>
              <td>합계 금액</td>
              <td>{{ totalPrice.toLocaleString() }}원</td>
            </tr>
            <tr>
              <td>발주 담당자</td>
              <td>{{ firstOrder?.name || "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="request-text">
        아래 내용으로 발주를 신청합니다 &nbsp;&nbsp;
        <u>{{ firstOrder?.name || "-" }}</u> &nbsp;&nbsp; 담당자 (인)
      </p>

      <table class="item-table">
        <thead>
          <tr>
            <th>품목명</th>
            <th>수량</th>
            <th>단위</th>
            <th>단가</th>
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in selectedOrders" :key="item.purchase_order_id">
            <td>{{ item.material_name }}</td>
            <td>{{ item.purchase_order_quantity.toLocaleString() }}</td>
            <td>{{ item.material_unit }}</td>
            <td>{{ Number(item.material_pay).toLocaleString() }}원</td>
            <td>
              {{
                (
                  item.purchase_order_quantity * Number(item.material_pay)
                ).toLocaleString()
              }}원
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ref, nextTick, computed, onMounted, watch } from "vue";

interface Order {
  purchase_order_id: string;
  purchase_order_name: string;
  material_code: string;
  material_name: string;
  purchase_order_quantity: number;
  material_unit: string;
  purchase_order_date: string;
  due_date: string;
  account_id: string;
  account_name: string;
  name: string;
  material_pay: number;
  business_no: string;
  address: string;
  charger_name: string;
}

const filters = ref({
  purchase_order_name: "",
  material_name: "",
  account_name: "",
  purchase_order_date: null as Date | null,
  due_date: null as Date | null,
  name: "",
});

const orderList = ref<Order[]>([]);
const allOrders = ref<Order[]>([]);
const selectedIds = ref<string[]>([]);
const showPDF = ref(false);
const perPage = 5;

const page = ref(1);

const selectedOrders = computed(() =>
  orderList.value.filter((order) =>
    selectedIds.value.includes(order.purchase_order_id),
  ),
);

const firstOrder = computed(() => selectedOrders.value[0] || null);

const formatDateForView = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const columns = [
  { key: "select", label: "선택", width: 60 },
  { key: "purchase_order_id", label: "발주코드" },
  { key: "purchase_order_name", label: "발주명" },
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "purchase_order_quantity", label: "요청수량" },
  { key: "sumPay", label: "발주 가격" },
  { key: "material_unit", label: "단위" },
  { key: "purchase_order_date", label: "발주일" },
  { key: "due_date", label: "납기일" },
  { key: "account_id", label: "거래처 코드" },
  { key: "account_name", label: "거래처 명" },
  { key: "name", label: "담당자" },
];

const fetchPurchase = async () => {
  try {
    const res = await axios.get("/purchaseCheck");
    allOrders.value = Array.isArray(res.data) ? res.data : [];
    orderList.value = [...allOrders.value];
    console.log("allOrders: ", res.data);
    console.log("order: ", orderList.value);
  } catch (err) {
    console.error("계획 조회 실패", err);
    allOrders.value = [];
  }
};

function isSameDate(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const totalPrice = computed(() => {
  return selectedOrders.value.reduce(
    (sum, o) => sum + Number(o.material_pay) * o.purchase_order_quantity,
    0,
  );
});

function formatDate(date: string | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function searchOrders() {
  const {
    purchase_order_name,
    material_name,
    account_name,
    purchase_order_date,
    due_date,
    name,
  } = filters.value;

  orderList.value = allOrders.value.filter((order) => {
    const matchesOrderName =
      !purchase_order_name ||
      order.purchase_order_name.includes(purchase_order_name);
    const matchesMaterialName =
      !material_name || order.material_name.includes(material_name);
    const matchesAccountName =
      !account_name || order.account_name.includes(account_name);
    const matchesManager = !name || order.name.includes(name);

    const matchesOrderDate =
      !purchase_order_date ||
      isSameDate(
        new Date(order.purchase_order_date),
        new Date(purchase_order_date),
      );
    const matchesDueDate =
      !due_date || isSameDate(new Date(order.due_date), new Date(due_date));

    return (
      matchesOrderName &&
      matchesMaterialName &&
      matchesAccountName &&
      matchesManager &&
      matchesOrderDate &&
      matchesDueDate
    );
  });
  page.value = 1;
}

function createPurchasePDF() {
  if (selectedOrders.value.length === 0) {
    alert("선택된 항목이 없습니다.");
    return;
  }

  const baseAccountId = selectedOrders.value[0].account_id;
  const isSameAccount = selectedOrders.value.every(
    (o) => o.account_id === baseAccountId,
  );

  if (!isSameAccount) {
    alert("같은 거래처의 발주 항목만 PDF로 생성할 수 있습니다.");
    return;
  }

  showPDF.value = true;

  nextTick(() => {
    const el = document.getElementById("purchase-pdf");
    if (!el) return alert("출력 영역이 없습니다.");

    html2canvas(el, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("발주서.pdf");
      })
      .finally(() => {
        showPDF.value = false;
      });
  });
}

function resetFilters() {
  filters.value = {
    purchase_order_name: "",
    material_name: "",
    account_name: "",
    purchase_order_date: null,
    due_date: null,
    name: "",
  };
}

onMounted(() => {
  fetchPurchase();
});
</script>

<style scoped>
.order-search-page {
  padding: 20px;
  max-width: 1400px;
  margin: auto;
}
.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 15px;
}
.search-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
  row-gap: 16px;
}
.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.result-section {
  margin-top: 30px;
  width: 100%;
}
.table-wrapper {
  width: 100%;
  overflow-x: auto; /* 필요 시만 스크롤 생김 */
}
.order-page {
  padding: 20px;
}

/* 출력용 PDF 스타일 */
#purchase-pdf {
  width: 800px;
  padding: 20px;
  font-family: "Malgun Gothic", sans-serif;
  color: black;
  background-color: white;
  position: absolute;
  left: -9999px; /* 화면 밖으로 밀어둠 */
}

.title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.top-tables {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.info-table {
  border-collapse: collapse;
  width: 48%;
  font-size: 14px;
}

.info-table th,
.info-table td {
  border: 1px solid #000;
  padding: 6px;
  text-align: left;
}

.request-text {
  margin-top: 20px;
  font-size: 16px;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 14px;
}

.item-table th,
.item-table td {
  border: 1px solid #000;
  padding: 6px;
  text-align: center;
}

.footer {
  font-size: 13px;
  margin-top: 20px;
}
</style>
