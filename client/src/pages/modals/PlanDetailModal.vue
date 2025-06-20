<template>
  <va-modal
    :model-value="isOpen"
    no-actions
    @update:model-value="$emit('close')"
  >
    <h3 class="mb-2">생산 계획 상세</h3>

    <div class="mb-3">
      <div><strong>계획 ID:</strong> {{ products[0]?.plan_id }}</div>
      <div><strong>계획명:</strong> {{ products[0]?.plan_name }}</div>
      <div>
        <strong>등록일:</strong> {{ formatToKST(products[0]?.plan_reg_dt) }}
      </div>
    </div>

    <va-data-table :items="products" :columns="columns" class="mb-4" />

    <div class="custom-footer">
      <va-button color="primary" @click="$emit('close')"> 닫기 </va-button>
    </div>
  </va-modal>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  products: Array<any>;
}>();

const columns = [
  { key: "product_code", label: "제품 코드" },
  { key: "product_name", label: "제품명" },
  { key: "plan_qty", label: "계획 수량" },
  { key: "product_safty", label: "안전 재고" },
];

const formatToKST = (isoDate?: string): string => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(kst.getDate()).padStart(2, "0")} ${String(
    kst.getHours(),
  ).padStart(2, "0")}:${String(kst.getMinutes()).padStart(2, "0")}`;
};
</script>

<style scoped>
::v-deep(.va-modal__footer),
::v-deep(.va-modal__actions),
::v-deep(.va-dialog__footer),
::v-deep(.va-dialog__actions) {
  display: none !important;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  row-gap: 0.5rem;
  column-gap: 1rem;
}

.custom-footer {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
</style>
