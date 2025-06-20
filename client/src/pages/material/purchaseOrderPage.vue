<template>
  <div class="mrp-page">
    <!-- 생산계획 테이블 -->
    <div class="table-section">
      <h3 class="table-title">발주 요청 자재</h3>
      <va-data-table
        v-model:current-page="page"
        :items="orderList"
        :columns="orderColumns"
        :per-page="5"
        track-by="purchase_order_id"
      >
        <template #cell(action)="{ row }">
          <va-button size="small" @click="onSelectMt(row.source)">
            선택
          </va-button>
        </template>
      </va-data-table>

      <!-- 페이지네이션 UI 추가 -->
      <va-pagination
        v-model="page"
        :pages="Math.ceil(orderList.length / 5)"
        class="mt-2"
      />
    </div>

    <!-- 부족 자재 리스트 -->
    <div class="table-section">
      <h3 class="table-title">발주 등록</h3>
      <va-data-table
        :items="shortageList"
        :columns="shortageColumns"
        track-by="purchase_order_id"
        class="input-compact"
      >
        <template #cell(select)="{ row }">
          <va-checkbox
            :model-value="selectedRows.includes(row.source.purchase_order_id)"
            @update:model-value="
              (checked) => {
                const id = row.source.purchase_order_id;
                if (checked) {
                  selectedRows.push(id);
                } else {
                  selectedRows.splice(selectedRows.indexOf(id), 1);
                }
              }
            "
          />
        </template>
        <!-- 날짜 포맷 -->
        <template #cell(purchase_order_date)="{ row }">
          {{ formatDateForView(row.source.purchase_order_date) }}
        </template>

        <!-- 납기일: 캘린더 선택 -->
        <template #cell(due_date)="{ rowIndex }">
          <va-date-input
            v-model="shortageList[rowIndex].due_date"
            placeholder="납기일"
            :clearable="false"
            style="width: 130px; min-width: 0"
          />
        </template>

        <template #cell(account_id)="{ rowIndex }">
          <va-input
            v-model="shortageList[rowIndex].account_id"
            placeholder="거래처 코드"
            size="small"
            class="input-compact"
            @input="onAccountIdInput(rowIndex)"
          />
        </template>

        <!-- 거래처 명 -->
        <template #cell(account_name)="{ rowIndex }">
          <va-input
            v-model="shortageList[rowIndex].account_name"
            placeholder="거래처명"
            size="small"
            class="input-compact"
            @input="onAccountNameInput(rowIndex)"
          />
        </template>

        <!-- 담당자: input -->
        <template #cell(name)="{ rowIndex }">
          <va-input
            v-model="shortageList[rowIndex].name"
            placeholder="담당자"
            size="small"
            class="input-compact"
          />
        </template>
      </va-data-table>
      <div class="button-wrap">
        <va-button @click="onRegisterOrder"> 등록 </va-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, onMounted } from "vue";

interface PurchaseOrder {
  purchase_order_id: string;
  material_code: string;
  material_name: string;
  material_unit: string;
  material_cls: string;
  purchase_order_quantity: string;
}

interface Shortage {
  purchase_order_id: string;
  purchase_order_name: string;
  material_code: string;
  material_name: string;
  purchase_order_quantity: number;
  purchase_order_date: string;
  material_unit: string;
  due_date: string | Date | null;
  account_id: string;
  account_name: string;
  name: string;
}

interface Account {
  account_id: string;
  account_name: string;
}

const accountList = ref<Account[]>([]);
const orderList = ref<PurchaseOrder[]>([]);
const shortageList = ref<Shortage[]>([]);
const selectedPlan = ref<PurchaseOrder | null>(null);
const page = ref(1);
const selectedRows = ref<string[]>([]);

const orderColumns = [
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "material_safty", label: "안전재고" },
  { key: "material_unit", label: "단위" },
  { key: "material_cls", label: "분류" },
  { key: "purchase_order_quantity", label: "발주수량" },
  { key: "action", label: "선택" },
];

const shortageColumns = [
  { key: "select", label: "선택" },
  { key: "purchase_order_name", label: "발주명" },
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "purchase_order_quantity", label: "요청수량" },
  { key: "purchase_order_date", label: "발주 요청일" },
  { key: "material_unit", label: "단위" },
  { key: "due_date", label: "납기일" },
  { key: "account_id", label: "거래처코드" },
  { key: "account_name", label: "거래처 명" },
  { key: "name", label: "담당자" },
];

const formatDateForView = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const fetchPlans = async () => {
  try {
    const res = await axios.get("/purchase");
    orderList.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("계획 조회 실패", err);
    orderList.value = []; // 실패 시에도 빈 배열로 초기화
  }
};

const fetchOrder = async () => {
  try {
    const res = await axios.get("/purchaseIn");
    shortageList.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("계획 조회 실패", err);
    orderList.value = []; // 실패 시에도 빈 배열로 초기화
  }
};

const fetchAccounts = async () => {
  try {
    const res = await axios.get("/account"); // 예: 거래처 API
    accountList.value = res.data;
  } catch (err) {
    console.error("거래처 목록 불러오기 실패", err);
  }
};

const onSelectMt = async (order: PurchaseOrder) => {
  try {
    selectedPlan.value = order;
    await axios.put(`/purchase/${order.purchase_order_id}`);
    await fetchPlans();
    await fetchOrder();
  } catch (err) {
    console.error("MRP 계산 실패", err);
  }
};

const onRegisterOrder = async () => {
  if (selectedRows.value.length === 0) {
    alert("선택된 항목이 없습니다.");
    return;
  }

  const selectedItems = shortageList.value.filter((item) =>
    selectedRows.value.includes(item.purchase_order_id),
  );

  // 예: 서버 전송용 변환
  const payload = selectedItems.map((item) => ({
    purchase_order_id: item.purchase_order_id,
    due_date: formatDateForView(item.due_date),
    account_id: item.account_id,
    name: item.name,
  }));

  try {
    for (const item of payload) {
      const res = await axios.put(`/puOrder/${item.purchase_order_id}`, item);
      if (!res.data.isSuccessed) {
        console.warn(`❌ 발주 등록 실패: ${item.purchase_order_id}`);
      }
    }

    alert("발주 등록 완료!");
    selectedRows.value = [];
    fetchOrder();
  } catch (err) {
    console.error("발주 등록 실패:", err);
    alert("서버 오류 발생");
  }
};

const onAccountIdInput = (index: number) => {
  const code = String(shortageList.value[index].account_id);
  const matched = accountList.value.find((a) => String(a.account_id) === code);
  if (matched) {
    shortageList.value[index].account_name = matched.account_name;
  }
};

const onAccountNameInput = (index: number) => {
  const name = shortageList.value[index].account_name;
  const matched = accountList.value.find((a) => a.account_name === name);
  if (matched) {
    shortageList.value[index].account_id = matched.account_id;
  }
};

onMounted(() => {
  fetchPlans();
  fetchOrder();
  fetchAccounts();
});
</script>

<style scoped>
.mrp-page {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.table-section {
  margin-bottom: 2rem;
}

.table-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.button-wrap {
  text-align: right;
  margin-top: 1rem;
}

.input-compact {
  width: 120px;
}
</style>
