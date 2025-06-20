<template>
  <!-- 제품 등록 폼 -->
  <div class="product-form">
    <h3 class="form-title">불량품폐기 등록</h3>
    <br />

    <!-- 상단 폼 -->
    <div class="form-section">
      <h3 class="form-title">불량이력 조회</h3>
      <div class="input-row">
        <va-input v-model="form.faultyCode" label="불량이력코드" />
        <va-input v-model="form.occurDate" label="발생일자" type="date" />
      </div>
      <div class="input-row">
        <va-input v-model="form.name" label="제품명" />
        <va-input v-model="form.code" label="작업지시서번호" />
      </div>
      <div class="input-row">
        <va-input v-model="form.processStage" label="공정단계" />
        <va-input v-model="form.faultyType" label="불량유형" />
      </div>
      <div class="input-row">
        <va-input v-model="form.faultyResult" label="판정결과" />
        <va-input v-model="form.faultyQuantity" label="불량수량" />
      </div>
    </div>

    <!-- 하단 폼 -->
    <div class="form-section">
      <h3 class="form-title">폐기정보 등록</h3>
      <div class="input-row">
        <va-input v-model="form.disuseDate" label="폐기일자" />
        <va-input v-model="form.disuseCompany" label="수거업체" />
      </div>
      <div class="input-row">
        <va-input v-model="form.disuseQuantity" label="폐기수량" />
        <va-input v-model="form.Representative" label="담당자" />
      </div>
      <div class="input-row">
        <va-input v-model="form.disuseReson" label="폐기사유" />
        <va-input v-model="form.disuseState" label="처리상태" />
      </div>
    </div>

    <!-- 버튼 -->
    <div class="form-buttons">
      <va-button color="primary" @click="registerProduct"> 등록 </va-button>
      <va-button color="seconderys" @click="resetForm"> 초기화 </va-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const form = ref({
  faultyCode: "",
  occurDate: "",
  name: "",
  code: "",
  processStage: "",
  faultyType: "",
  faultyResult: "",
  faultyQuantity: "",
  disuseDate: "",
  disuseCompany: "",
  disuseQuantity: "",
  Representative: "",
  disuseReson: "",
  disuseState: "",
});

function resetForm() {
  form.value = {
    faultyCode: "",
    occurDate: "",
    name: "",
    code: "",
    processStage: "",
    faultyType: "",
    faultyResult: "",
    faultyQuantity: "",
    disuseDate: "",
    disuseCompany: "",
    disuseQuantity: "",
    Representative: "",
    disuseReson: "",
    disuseState: "",
  };
}

function registerProduct() {
  if (!form.value.code || !form.value.name) return alert("필수값 누락");
  alert(`등록된 제품: ${form.value.name} (${form.value.code})`);
  resetForm();
}

function updateProduct() {
  alert("수정 기능은 아직 구현되지 않았습니다.");
}

function deleteProduct() {
  alert("삭제 기능은 아직 구현되지 않았습니다.");
}
</script>

<style scoped>
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
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

.form-section {
  border: 1px solid #ccc; /* 테두리 회색 */
  border-radius: 0.5rem; /* 모서리 둥글게 */
  padding: 1rem; /* 안쪽 여백 */
  margin-bottom: 1rem; /* 아래 여백 */
  background-color: #f9f9f9; /* 살짝 밝은 배경색 (선택) */
}

.form-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.input-row {
  display: flex;
  gap: 1rem; /* 두 박스 간 여백 */
  margin-bottom: 0.5rem;
}

.half-width {
  width: 50%;
}

.va-input {
  margin-bottom: 0.5rem;
}

.form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}
</style>
