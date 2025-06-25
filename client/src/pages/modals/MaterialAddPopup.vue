<template>
  <div class="popup-overlay" v-if="visible">
    <div class="popup-content">
      <div class="popup-header">
        <h3>자재 선택</h3>
        <input
          v-model="searchText"
          placeholder="자재코드 또는 자재명 검색"
          class="search-input"
        />
      </div>

      <table class="material-table">
        <thead>
          <tr>
            <th></th>
            <th>자재코드</th>
            <th>자재명</th>
            <th>분류</th>
            <th>단위</th>
            <th>규격</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.material_code">
            <td>
              <input
                type="checkbox"
                v-model="selectedCodes"
                :value="item.material_code"
              />
            </td>
            <td>{{ item.material_code }}</td>
            <td>{{ item.material_name }}</td>
            <td>{{ item.material_cls }}</td>
            <td>{{ item.material_unit }}</td>
            <td>{{ item.material_stand }}</td>
          </tr>
        </tbody>
      </table>

      <div class="popup-footer">
        <button class="btn save" @click="addSelected">추가</button>
        <button class="btn" @click="$emit('update:visible', false)">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from "vue";
import type { MaterialOption } from "@/types";

const props = defineProps<{
  visible: boolean;
  materials: MaterialOption[];
}>();

const emit = defineEmits(["update:visible", "add"]);

const searchText = ref("");
const selectedCodes = ref<string[]>([]);

const filtered = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return props.materials;
  return props.materials.filter(
    (m) =>
      m.material_code.toLowerCase().includes(keyword) ||
      m.material_name.toLowerCase().includes(keyword),
  );
});

function addSelected() {
  const selected = props.materials.filter((m) =>
    selectedCodes.value.includes(m.material_code),
  );
  emit("add", selected);
  emit("update:visible", false);
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.popup-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow: auto;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.search-input {
  width: 300px;
  padding: 6px;
  font-size: 14px;
}
.material-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
.material-table th,
.material-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}
.popup-footer {
  text-align: right;
  margin-top: 10px;
}
.btn {
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}
.btn.save {
  background-color: #2f80ed;
  color: white;
}
</style>
