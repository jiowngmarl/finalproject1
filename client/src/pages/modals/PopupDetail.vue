<template>
  <div class="popup-overlay" v-if="visible">
    <div class="popup-content wide">
      <div class="popup-header">
        <div>
          <button class="btn add" @click="materialSearchVisible = true">
            재료추가
          </button>
          <button class="btn delete" @click="$emit('deleteSelectedMaterials')">
            재료삭제
          </button>
        </div>
      </div>

      <table class="material-table">
        <thead>
          <tr>
            <th><input type="checkbox" disabled /></th>
            <th>자재코드</th>
            <th>자재명</th>
            <th>단위</th>
            <th>투입량</th>
            <th>담당자</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in materialList" :key="index">
            <td><input type="checkbox" v-model="row.selected" /></td>
            <td>
              <select
                v-model="row.material_code"
                @change="$emit('materialCodeChange', row)"
              >
                <option disabled value="">자재 선택</option>
                <option
                  v-for="item in materialOptions"
                  :key="item.material_code"
                  :value="item.material_code"
                >
                  {{ item.material_code }}
                </option>
              </select>
            </td>
            <td>{{ row.material_name }}</td>
            <td>{{ row.material_unit }}</td>
            <td>{{ row.usage_qty }}</td>
            <td><input type="text" v-model="row.responsible" /></td>
          </tr>
        </tbody>
      </table>

      <div class="popup-footer">
        <button class="btn save" @click="$emit('save')">저장</button>
        <button class="btn" @click="$emit('update:visible', false)">
          취소
        </button>
      </div>

      <MaterialAddPopup
        v-if="materialSearchVisible"
        :visible="materialSearchVisible"
        :materials="materialOptions"
        @update:visible="materialSearchVisible = $event"
        @add="handleMaterialAdd"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import MaterialAddPopup from "../modals/MaterialAddPopup.vue";
import type { MaterialRow, MaterialOption } from "@/types";

const props = defineProps<{
  visible: boolean;
  processCode: string;
  productCode: string;
  materialOptions: MaterialOption[];
  materialList: MaterialRow[];
  bomCode: string;
}>();

const emit = defineEmits([
  "update:visible",
  "save",
  "materialCodeChange",
  "addMaterial",
  "deleteSelectedMaterials",
]);

const materialSearchVisible = ref(false);

function handleMaterialAdd(selected: MaterialOption[]) {
  for (const item of selected) {
    props.materialList.push({
      process_code: props.processCode,
      material_code: item.material_code,
      material_name: item.material_name,
      material_unit: item.material_unit,
      BOM_code: props.bomCode,
      usage_qty: item.usage_qty ?? 0,
      responsible: "",
      selected: false,
    });
  }
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
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  min-width: 300px;
}

.popup-content.wide {
  min-width: 60%;
  max-width: 800px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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
  text-align: center;
}

.btn {
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn.save {
  background-color: #2f80ed;
  color: white;
}

.btn.delete {
  background-color: #eb5757;
  color: white;
}

.btn.add {
  background-color: #2f80ed;
  color: white;
}
</style>
