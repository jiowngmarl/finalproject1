<template>
  <div class="order-search-page">
    <!-- 출고 조회 -->
    <div class="search-section">
      <h3 class="section-title">자재 조회</h3>
      <div class="search-form">
        <va-input v-model="filters.material_code" label="자재코드" />
        <va-date-input
          v-model="filters.expiry_date"
          label="유통기한"
          :manual-input="false"
          :clearable="true"
        />
        <va-input v-model="filters.material_name" label="자재명" />
        <va-input v-model="filters.material_unit" label="단위" />
        <va-input v-model="filters.material_cls" label="분류" />
        <va-input v-model="filters.material_stand" label="규격" />

        <div class="button-group">
          <va-button @click="searchOrders"> 조회 </va-button>
          <va-button color="secondary" @click="resetFilters">
            초기화
          </va-button>
        </div>
      </div>
    </div>

    <!-- 발주 요청 리스트 -->
    <div class="result-section">
      <h3 class="section-title">자재 리스트</h3>
      <div class="table-wrapper">
        <va-data-table
          v-model:current-page="page"
          :items="materialChekck"
          :columns="columns"
          :per-page="perPage"
        >
          <template #cell(received_date)="{ row }">
            {{ formatDateForView(row.source.received_date) }}
          </template>

          <template #cell(expiry_date)="{ row }">
            {{ formatDateForView(row.source.expiry_date) }}
          </template>
        </va-data-table>

        <va-pagination
          v-model="page"
          :pages="Math.max(1, Math.ceil(materialChekck.length / perPage))"
          class="mt-2"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, onMounted } from "vue";

interface MaterialChekck {
  material_code: string;
  material_name: string;
  quantity: number;
  material_unit: string;
  material_stand: string;
  received_date: string;
  expiry_date: string;
  material_cls: string;
}

const filters = ref({
  material_code: "",
  material_name: "",
  material_unit: "",
  material_cls: "",
  expiry_date: null as Date | null,
  material_stand: "",
});

const materialChekck = ref<MaterialChekck[]>([]);
const allMaterialChekck = ref<MaterialChekck[]>([]);
const perPage = 5;

const page = ref(1);

const formatDateForView = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const columns = [
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "quantity", label: "재고" },
  { key: "material_unit", label: "단위" },
  { key: "material_stand", label: "규격" },
  { key: "received_date", label: "입고 일자" },
  { key: "expiry_date", label: "유통기한" },
  { key: "material_cls", label: "분류" },
];

const fetchPurchase = async () => {
  try {
    const res = await axios.get("/materialCheck");
    allMaterialChekck.value = Array.isArray(res.data) ? res.data : [];
    materialChekck.value = [...allMaterialChekck.value];
    console.log("allOrders: ", res.data);
    console.log("order: ", materialChekck.value);
  } catch (err) {
    console.error("계획 조회 실패", err);
    allMaterialChekck.value = [];
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
    material_code,
    material_name,
    material_unit,
    material_stand,
    expiry_date,
    material_cls,
  } = filters.value;

  materialChekck.value = allMaterialChekck.value.filter((materialChekck) => {
    const matchesMaterialCode =
      !material_code || materialChekck.material_code.includes(material_code);
    const matchesMaterialName =
      !material_name || materialChekck.material_name.includes(material_name);
    const matchesMaterialUnit =
      !material_unit || materialChekck.material_unit.includes(material_unit);
    const matchesMaterialStand =
      !material_stand || materialChekck.material_stand.includes(material_stand);
    const matchesMaterialCls =
      !material_cls || materialChekck.material_cls.includes(material_cls);

    const matchesOutboundDate =
      !expiry_date ||
      isSameDate(new Date(materialChekck.expiry_date), new Date(expiry_date));

    return (
      matchesMaterialCode &&
      matchesMaterialName &&
      matchesMaterialUnit &&
      matchesMaterialStand &&
      matchesMaterialCls &&
      matchesOutboundDate
    );
  });
  page.value = 1;
}

function resetFilters() {
  filters.value = {
    material_code: "",
    material_name: "",
    material_unit: "",
    material_stand: "",
    expiry_date: null,
    material_cls: "",
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
