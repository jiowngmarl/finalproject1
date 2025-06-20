<template>
  <div class="material-inquiry-page">
    <h2 class="page-title">자재 입고 조회</h2>

    <!-- 검색 필터 -->
    <div class="search-form">
      <va-input v-model="filters.material_code" label="자재코드" />
      <va-input v-model="filters.material_name" label="자재명" />
      <va-input v-model="filters.lot_number" label="LOT번호" />
      <va-date-input
        v-model="filters.received_date"
        label="입고일자"
        :manual-input="false"
        :clearable="true"
      />
      <va-input v-model="filters.material_unit" label="단위" />
      <va-input v-model="filters.material_cls" label="분류" />

      <div class="button-group">
        <va-button @click="searchMaterials"> 검색 </va-button>
        <va-button color="secondary" @click="resetFilters"> 초기화 </va-button>
      </div>
    </div>

    <!-- 입고 내역 테이블 -->
    <va-data-table
      v-model:current-page="page"
      :items="filteredList"
      :columns="columns"
      :per-page="10"
      track-by="lot_number"
    >
      <template #cell(received_date)="{ row }">
        {{ formatToKST(row.source.received_date) }}
      </template>
    </va-data-table>

    <va-pagination
      v-model="page"
      :pages="Math.ceil(filteredList.length / 10)"
      class="mt-4"
    />
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, computed, onMounted } from "vue";

interface MaterialLot {
  lot_number: string;
  material_code: string;
  material_name: string;
  quantity: number;
  material_unit: string;
  material_cls: string;
  received_date: string;
}

const lotList = ref<MaterialLot[]>([]);
const filteredList = ref<MaterialLot[]>([]);
const page = ref(1);

const filters = ref({
  material_code: "",
  material_name: "",
  lot_number: "",
  received_date: null as Date | null,
  material_unit: "",
  material_cls: "",
});

const columns = [
  { key: "lot_number", label: "LOT번호" },
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "quantity", label: "입고 수량" },
  { key: "material_unit", label: "단위" },
  { key: "material_cls", label: "분류" },
  { key: "received_date", label: "입고일자" },
];

const formatToKST = (isoDate: string): string => {
  const date = new Date(isoDate);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  const hh = String(kst.getHours()).padStart(2, "0");
  const mi = String(kst.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

const isSameDate = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const searchMaterials = () => {
  const {
    material_code,
    material_name,
    lot_number,
    received_date,
    material_unit,
    material_cls,
  } = filters.value;

  filteredList.value = lotList.value.filter((item) => {
    const matchesCode =
      !material_code || item.material_code.includes(material_code);
    const matchesName =
      !material_name || item.material_name.includes(material_name);
    const matchesLot = !lot_number || item.lot_number.includes(lot_number);
    const matchesDate =
      !received_date ||
      isSameDate(new Date(item.received_date), new Date(received_date));
    const matchesUnit =
      !material_unit || item.material_unit.includes(material_unit);
    const matchesCls =
      !material_cls || item.material_cls.includes(material_cls);

    return (
      matchesCode &&
      matchesName &&
      matchesLot &&
      matchesDate &&
      matchesUnit &&
      matchesCls
    );
  });

  page.value = 1;
};

const resetFilters = () => {
  filters.value = {
    material_code: "",
    material_name: "",
    lot_number: "",
    received_date: null,
    material_unit: "",
    material_cls: "",
  };
  filteredList.value = [...lotList.value];
  page.value = 1;
};

const fetchMaterialsLot = async () => {
  try {
    const res = await axios.get("/materialLotList");
    lotList.value = res.data;
    filteredList.value = [...res.data];
  } catch (err) {
    console.error("❌ 입고 내역 조회 실패:", err);
  }
};

onMounted(() => {
  fetchMaterialsLot();
});
</script>

<style scoped>
.material-inquiry-page {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.search-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
  row-gap: 16px;
  margin-bottom: 1.5rem;
}

.button-group {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
