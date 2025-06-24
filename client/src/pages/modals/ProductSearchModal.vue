<template>
  <va-modal v-model="visible" title="제품 검색" size="large">
    <div class="va-mb-4 va-row va-gap-2">
      <va-input v-model="search.product_name" label="제품명" />
      <va-input v-model="search.product_stand" label="제품규격" />
      <va-input v-model="search.result_id" label="실적ID" />
      <va-button @click="searchProducts">검색</va-button>
    </div>

    <va-data-table
      :items="productList"
      :columns="columns"
      track-by="product_code"
    >
      <template #cell(select)="{ row }">
        <va-checkbox
          :model-value="row.rowData.selected"
          @update:modelValue="(val) => handleSelect(row.rowData, val)"
        />
      </template>
    </va-data-table>

    <div class="va-mt-4 va-row va-justify-end va-gap-2">
      <va-button color="primary" @click="applySelection">선택</va-button>
    </div>
  </va-modal>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from "vue";
import axios from "axios";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(["update:visible", "apply"]);

const visible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const search = ref({
  product_name: "",
  product_stand: "",
  result_id: "",
});

const productList = ref<any[]>([]);

const columns = [
  { key: "select", label: "선택", width: 60 },
  { key: "work_order_no", label: "작업지시 코드" },
  { key: "product_name", label: "제품명" },
  { key: "product_stand", label: "제품규격" },
  { key: "result_id", label: "실적 ID" },
];

const searchProducts = async () => {
  try {
    const res = await axios.get("/prodResult");
    productList.value = res.data
      .filter((item: any) => {
        return (
          (!search.value.product_name ||
            item.product_name.includes(search.value.product_name)) &&
          (!search.value.product_stand ||
            item.product_stand.includes(search.value.product_stand))
        );
      })
      .map((item: any) => ({ ...item, selected: false }));
  } catch (err) {
    alert("제품 목록 조회 실패");
  }
};

const handleSelect = (target: any, val: boolean) => {
  productList.value.forEach((item) => (item.selected = false));
  if (val) target.selected = true;
};

const applySelection = () => {
  const selected = productList.value.find((p) => p.selected);
  if (selected) {
    emit("apply", selected);
    visible.value = false;
  } else {
    alert("선택된 제품이 없습니다.");
  }
};
</script>
