<template>
  <div class="product-form">
    <h3 class="form-title">제품검사항목 등록</h3>
    <br />
    <div class="form-section">
      <h3 class="form-title">기본정보</h3>
      <br />
      <div class="input-row">
        <va-select
          v-model="form.materialName"
          :options="materialOptions"
          label="자재명"
          class="quarter-width"
          placeholder="자재를 선택하세요"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

interface MaterialInspectionItem {
  material_name: string;
}

// 자재 리스트
const MaterialInspectionList = ref<MaterialInspectionItem[]>([]);

// 사용자 입력 폼
const form = ref({
  materialName: "",
});

// 드롭다운 옵션 구성
const materialOptions = computed(() =>
  MaterialInspectionList.value.map((item) => item.material_name),
);

// 자재 리스트 가져오기
const fetchMaterialList = async () => {
  try {
    const res = await axios.get("/materialInspections/materialList");
    MaterialInspectionList.value = res.data; // 받아온 리스트 저장
  } catch (err) {
    console.error("❌ 자재명 리스트 조회 실패:", err);
  }
};

// 마운트 시 자재 리스트 불러오기
onMounted(() => {
  fetchMaterialList();
});
</script>
<style scoped>
/* 전체 레이아웃 */
.product-page {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  height: 739px;
}

.product-container {
  width: 1060px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-form {
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

/* 섹션 스타일 */
.form-section {
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: white;
}

.form-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* 입력 행 정렬 */
.input-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

/* 셀렉트 박스 기본 스타일 */
select {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
}

/* 너비 클래스 */
.quarter-width {
  flex: 1;
}

.half-width {
  flex: 2;
}

/* 버튼 정렬 */
.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* 테이블 스타일 */
.custom-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
}

.custom-table th,
.custom-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}

.custom-table th {
  background-color: #ffffff;
  font-weight: bold;
}
</style>
