<template>
  <div class="product-form">
    <h3 class="form-title">제품품질검사 조회</h3>
    <br />

    <!-- 검사 유형 등록 폼 -->
    <div class="form-section">
      <h3 class="form-title">검색 조건 입력</h3>
      <br />

      <div class="input-row">
        <va-select
          v-model="selected.productCode"
          :options="filteredProducts"
          label="제품명"
          class="quarter-width"
          value-by="value"
          text-by="label"
          placeholder="제품명 선택"
        />

        <va-select
          v-model="selected.workOrderNo"
          :options="filteredWorkOrders"
          label="작업지시번호"
          class="quarter-width"
          value-by="value"
          text-by="label"
          placeholder="작업지시 선택"
        />

        <va-select
          v-model="selected.processName"
          :options="filteredProcesses"
          label="공정명"
          class="quarter-width"
          value-by="value"
          text-by="label"
          placeholder="공정명 선택"
        />
      </div>

      <br />
      <div class="form-buttons">
        <va-button @click="searchForm" color="primary">검색</va-button>
      </div>
    </div>

    <!-- 검사 리스트 테이블 -->
    <div class="form-section">
      <table class="custom-table">
        <thead>
          <tr>
            <th>제품명</th>
            <th>작업지시번호</th>
            <th>공정명</th>
            <th>판정결과</th>
            <th>불합판정수량</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in resultList" :key="item.id">
            <td>{{ item.product_name }}</td>
            <td>{{ item.work_order_no }}</td>
            <td>{{ item.process_name }}</td>
            <td>{{ item.qual_result }}</td>
            <td>{{ item.insp_value_qty }}</td>
            <td>{{ item.qual_remark }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const rawFilterData = ref<any[]>([])
const resultList = ref<any[]>([])
const selected = ref({
  productCode: '',
  workOrderNo: '',
  processName: ''
})

onMounted(async () => {
  try {
    const res = await axios.get('/qualityInsertLists/filterOptions')
    rawFilterData.value = res.data
  } catch (err) {
    console.error('필터 옵션 불러오기 실패:', err)
  }
})

const filteredProducts = computed(() => {
  return rawFilterData.value
    .filter(item =>
      (!selected.value.workOrderNo || item.work_order_no === selected.value.workOrderNo) &&
      (!selected.value.processName || item.process_name === selected.value.processName)
    )
    .map(item => ({ label: item.product_name, value: item.product_code }))
    .filter((item, idx, arr) => arr.findIndex(i => i.value === item.value) === idx)
})

const filteredWorkOrders = computed(() => {
  return rawFilterData.value
    .filter(item =>
      (!selected.value.productCode || item.product_code === selected.value.productCode) &&
      (!selected.value.processName || item.process_name === selected.value.processName)
    )
    .map(item => ({ label: item.work_order_no, value: item.work_order_no }))
    .filter((item, idx, arr) => arr.findIndex(i => i.value === item.value) === idx)
})

const filteredProcesses = computed(() => {
  return rawFilterData.value
    .filter(item =>
      (!selected.value.productCode || item.product_code === selected.value.productCode) &&
      (!selected.value.workOrderNo || item.work_order_no === selected.value.workOrderNo)
    )
    .map(item => ({ label: item.process_name, value: item.process_name }))
    .filter((item, idx, arr) => arr.findIndex(i => i.value === item.value) === idx)
})

const searchForm = async () => {
  try {
    const { productCode, workOrderNo, processName } = selected.value
    const res = await axios.get('/qualityInsertLists/search', {
      params: { productCode, workOrderNo, processName }
    })
    resultList.value = res.data
  } catch (err) {
    console.error('검색 실패:', err)
  }
}
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