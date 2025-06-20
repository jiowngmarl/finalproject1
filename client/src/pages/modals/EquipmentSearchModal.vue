<template>
  <va-modal
    :model-value="modelValue"
    size="large"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #title> 설비 검색 </template>

    <!-- 검색 입력 -->
    <div class="va-row va-gap-2 va-mb-4">
      <va-input v-model="searchText" placeholder="설비명 또는 ID 검색" />
    </div>

    <!-- 설비 테이블 -->
    <va-data-table
      :items="filteredEquipments"
      :columns="columns"
      track-by="eq_id"
    >
      <template #cell(action)="{ row }">
        <va-button size="small" @click="selectEquipment(row.rowData)">
          선택
        </va-button>
      </template>
    </va-data-table>
  </va-modal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from "vue";

// Props
const props = defineProps<{
  modelValue: boolean;
  equipmentList: Array<any>;
}>();

const emit = defineEmits(["update:modelValue", "apply"]);

// 검색어 상태
const searchText = ref("");

// 테이블 필터링
const filteredEquipments = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return props.equipmentList;
  return props.equipmentList.filter(
    (e) =>
      e.eq_name?.toLowerCase().includes(keyword) ||
      e.eq_id?.toLowerCase().includes(keyword),
  );
});

// 테이블 컬럼
const columns = [
  { key: "eq_id", label: "설비 ID" },
  { key: "eq_name", label: "설비명" },
  { key: "code_label", label: "상태" },
  { key: "action", label: "선택", width: 100 },
];

// 선택시 emit
const selectEquipment = (item: any) => {
  emit("apply", item);
  emit("update:modelValue", false); // 팝업 닫기
};
</script>
