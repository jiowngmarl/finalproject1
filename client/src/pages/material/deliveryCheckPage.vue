<template>
  <div class="order-search-page">
    <!-- 출고 조회 -->
    <div class="search-section">
      <h3 class="section-title">출고 조회</h3>
      <div class="search-form">
        <va-input v-model="filters.outbound_id" label="출고코드" />
        <va-date-input
          v-model="filters.outbound_date"
          label="출고일자"
          :manual-input="false"
          :clearable="true"
        />
        <va-input v-model="filters.material_code" label="자재코드" />
        <va-input v-model="filters.material_name" label="자재명" />
        <va-input v-model="filters.material_cls" label="분류" />
        <va-input v-model="filters.lot_number" label="LOT번호" />

        <div class="button-group">
          <va-button @click="searchOrders">조회</va-button>
          <va-button color="secondary" @click="resetFilters">초기화</va-button>
        </div>
      </div>
    </div>

    <!-- 발주 요청 리스트 -->
    <div class="result-section">
      <h3 class="section-title">출고 리스트</h3>
      <div class="table-wrapper">
        <va-data-table
          :items="outboundList"
          :columns="columns"
          :per-page="perPage"
          :current-page.sync="page"
        >
          <template #cell(outbound_date)="{ row }">
            {{ formatDateForView(row.source.outbound_date) }}
          </template>
        </va-data-table>

        <va-pagination
          v-model="page"
          :pages="Math.max(1, Math.ceil(outboundList.length / perPage))"
          class="mt-2"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, onMounted } from "vue";

interface Outbound {
  outbound_id: string;
  material_code: string;
  material_name: string;
  material_unit: number;
  material_cls: string;
  outbound_date: string;
  outbound_qty: number;
  lot_number: string;
}

const filters = ref({
  outbound_id: "",
  material_code: "",
  material_name: "",
  material_unit: "",
  material_cls: "",
  outbound_date: null as Date | null,
  outbound_qty: "",
  lot_number: "",
});

const outboundList = ref<Outbound[]>([]);
const allOutbounds = ref<Outbound[]>([]);
const perPage = 5;

const page = ref(1);

const formatDateForView = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const columns = [
  { key: "outbound_id", label: "발주코드" },
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "material_unit", label: "단위" },
  { key: "material_cls", label: "분류" },
  { key: "outbound_date", label: "출고 일자" },
  { key: "outbound_qty", label: "출고 수량" },
  { key: "lot_number", label: "LOT 번호" },
];

const fetchPurchase = async () => {
  try {
    const res = await axios.get("/deliveryCheck");
    allOutbounds.value = Array.isArray(res.data) ? res.data : [];
    outboundList.value = [...allOutbounds.value];
    console.log("allOrders: ", res.data);
    console.log("order: ", outboundList.value);
  } catch (err) {
    console.error("계획 조회 실패", err);
    allOutbounds.value = [];
  }
};

function isSameDate(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function searchOrders() {
  const {
    outbound_id,
    material_code,
    material_name,
    outbound_date,
    material_cls,
    lot_number,
  } = filters.value;

  outboundList.value = allOutbounds.value.filter((outbound) => {
    const matchesOutboundId =
      !outbound_id || outbound.outbound_id.includes(outbound_id);
    const matchesMaterialId =
      !material_code || outbound.material_code.includes(material_code);
    const matchesMaterialName =
      !material_name || outbound.material_name.includes(material_name);
    const matchesMaterialCls =
      !material_cls || outbound.material_cls.includes(material_cls);
    const matchesMaterialLotNumber =
      !lot_number || outbound.lot_number.includes(lot_number);

    const matchesOutboundDate =
      !outbound_date ||
      isSameDate(new Date(outbound.outbound_date), new Date(outbound_date));

    return (
      matchesOutboundId &&
      matchesMaterialId &&
      matchesMaterialName &&
      matchesMaterialCls &&
      matchesOutboundDate &&
      matchesMaterialLotNumber
    );
  });
  page.value = 1;
}

function resetFilters() {
  filters.value = {
    outbound_id: "",
    material_code: "",
    material_name: "",
    material_unit: "",
    material_cls: "",
    outbound_date: null,
    outbound_qty: "",
    lot_number: "",
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
