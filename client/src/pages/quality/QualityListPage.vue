<template>
  <div class="product-form">
    <h3 class="form-title">제품품질검사</h3>
    <br />

    <div class="form-section">
      <h3 class="form-title">조회</h3>
      <br />
      <div class="input-row">
        <!-- 제품명 선택 -->
        <va-select
          v-model="form.productCode"
          :options="productOptions"
          label="제품명"
          class="quarter-width"
          value-by="value"
          text-by="label"
          placeholder="제품을 선택하세요"
          @update:modelValue="onProductChange"
        />

        <!-- 작업지시서 번호 선택 -->
        <va-select
          v-model="form.workOrderNo"
          :options="workOrderOptions"
          label="작업지시서 번호"
          class="quarter-width"
          value-by="value"
          text-by="label"
          placeholder="작업지시서 번호를 선택하세요"
          :disabled="workOrderOptions.length === 0"
        />
      </div>
      <div class="input-row">
        <va-input v-model="resultInfo.processName" label="공정명" readonly />
        <va-input v-model="resultInfo.managerId" label="담당자" readonly />
        <va-input v-model="resultInfo.passQty" label="투입량" readonly />
      </div>
      <div class="input-row">
        <va-input
          v-if="finalResultVisible"
          v-model="form.qualRemark"
          label="불합 판정 상세 사유"
          placeholder="불합 사유를 입력하세요"
          class="half-width"
          :rules="[(v) => !!v || '불합 사유는 필수입니다.']"
        />
      </div>
    </div>
    <div class="form-section">
      <table class="custom-table">
        <thead>
          <tr>
            <th>판정방식</th>
            <th>단위</th>
            <th>기준값</th>
            <th>측정값</th>
            <th>판정결과</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in inspectionStandardList" :key="index">
            <td>{{ item.insp_value_type }}</td>
            <td>{{ item.insp_unit }}</td>
            <td>{{ item.insp_value_qty }}</td>
            <td>
              <va-input
                v-model.number="item.insp_measured_value"
                @input="evaluateResult(item)"
                type="number"
                placeholder="측정값 입력"
              />
            </td>
            <td>
              <va-input
                :model-value="item.insp_result || '판정대기'"
                readonly
                color="primary"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="form-buttons">
        <va-button @click="submitForm" color="primary">등록</va-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";

// 폼 상태
const form = ref({
  productCode: "",
  workOrderNo: "",
  qualRemark: "",
});

// 검사 기준 목록
const inspectionStandardList = ref<
  {
    insp_value_type: string;
    insp_unit: string;
    insp_value_qty: number;
    insp_value_min: number;
    insp_value_max: number;
    insp_measured_value: number;
    insp_result: string;
  }[]
>([]);

// 이거 지워도 되는건지 확인
const finalResult = computed(() => {
  return inspectionStandardList.value.some((item) => item.insp_result !== "합")
    ? "불합"
    : "합";
});

const finalResultVisible = computed(() => {
  return inspectionStandardList.value.some((item) => {
    return (
      item.insp_measured_value !== undefined &&
      item.insp_measured_value !== null &&
      item.insp_result === "불합"
    );
  });
});

// 제품명 옵션 리스트
const productOptions = ref<{ label: string; value: string }[]>([]);

// 작업지시서 번호 옵션 리스트
const workOrderOptions = ref<{ label: string; value: string }[]>([]);

// 페이지 진입 시 제품명 목록 불러오기
onMounted(async () => {
  try {
    const res = await axios.get("/qualitys/productList");
    productOptions.value = res.data.map((item: any) => ({
      label: item.product_name,
      value: item.product_code,
    }));
  } catch (err) {
    console.error("제품명 목록 조회 실패:", err);
  }
});

// 제품 선택 시 작업지시서 번호 목록 불러오기
const onProductChange = async (selectedProductCode: string) => {
  console.log("제품 선택:", selectedProductCode);

  form.value.workOrderNo = "";
  workOrderOptions.value = [];

  if (!selectedProductCode) return;

  try {
    const res = await axios.get("/qualitys/workOrderNoList", {
      params: { productCode: selectedProductCode },
    });
    workOrderOptions.value = res.data.map((item: any) => ({
      label: item.work_order_no,
      value: item.work_order_no,
    }));
  } catch (err) {
    console.error("작업지시서 목록 조회 실패:", err);
  }
};

const resultInfo = ref({
  processName: "",
  managerId: "",
  passQty: 0,
});

// 작업지시서 선택 시 상세 정보 조회
watch(
  () => form.value.workOrderNo,
  async (newVal) => {
    if (!newVal) {
      resultInfo.value = { processName: "", managerId: "", passQty: 0 };
      return;
    }

    try {
      const res = await axios.get("/qualitys/workOrderDetail", {
        params: { workOrderNo: newVal },
      });

      if (res.data.length > 0) {
        const first = res.data[0]; // 여러 개 중 첫 번째만 표시
        resultInfo.value = {
          processName: first.process_name || "",
          managerId: first.manager_id || "",
          passQty: first.pass_qty || 0,
        };
      } else {
        resultInfo.value = { processName: "", managerId: "", passQty: 0 };
      }
    } catch (err) {
      console.error("작업지시서 상세 조회 실패:", err);
    }
  },
);

watch(
  () => resultInfo.value.processName,
  async (processName) => {
    if (!processName) {
      inspectionStandardList.value = [];
      return;
    }

    try {
      const res = await axios.get("/qualitys/inspectionStandard", {
        params: { processName },
      });
      console.log("검사 기준 응답:", res.data); // ← 디버깅용
      inspectionStandardList.value = res.data;
    } catch (err) {
      console.error("검사 기준 조회 실패:", err);
      inspectionStandardList.value = [];
    }
  },
);

const evaluateResult = (item: any) => {
  const value = item.insp_measured_value;

  if (value === null || value === undefined || value === "") {
    item.insp_result = "판정대기";
    return;
  }

  const min = item.insp_value_min;
  const max = item.insp_value_max;

  if (value >= min && value <= max) {
    item.insp_result = "합";
  } else {
    item.insp_result = "불합";
  }
};

const submitForm = async () => {
  if (!form.value.productCode || !form.value.workOrderNo) {
    alert("제품명과 작업지시서 번호를 선택하세요.");
    return;
  }

  const totalMeasured = inspectionStandardList.value
    .map((item) => item.insp_measured_value)
    .filter((v) => v !== null && v !== undefined);

  const averageMeasuredValue =
    totalMeasured.length > 0
      ? totalMeasured.reduce((a, b) => a + b, 0) / totalMeasured.length
      : null;

  if (averageMeasuredValue === null) {
    alert("측정값을 입력해주세요.");
    return;
  }

  if (finalResultVisible.value && !form.value.qualRemark) {
    alert("불합 사유를 입력해주세요.");
    return;
  }

  const inspValueQty =
    finalResult.value === "불합" ? resultInfo.value.passQty : 0;

  try {
    const res = await axios.post("/qualitys/registerTest", {
      productCode: form.value.productCode,
      workOrderNo: form.value.workOrderNo,
      qual_measured_value: averageMeasuredValue,
      qual_result: finalResult.value,
      process_name: resultInfo.value.processName,
      pass_qty: resultInfo.value.passQty, // 전체 투입량
      insp_value_qty: inspValueQty, // 여기 새로 추가됨
      qual_remark: finalResultVisible.value ? form.value.qualRemark : null,
    });

    if (res.data.success) {
      alert("검사 결과 등록 완료");
      form.value.qualRemark = "";
    } else {
      alert("등록 실패");
    }
  } catch (err) {
    console.error("등록 오류:", err);
    alert("서버 오류로 등록 실패");
  }
};
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
  table-layout: fixed; /* 추가: 고정된 열 너비를 적용하려면 필요 */
}

.custom-table th,
.custom-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  width: 25%; /* ✅ 추가된 부분 */
  box-sizing: border-box; /* ✅ 패딩 포함한 계산을 위해 추가 */
}

.custom-table th {
  background-color: #ffffff;
  font-weight: bold;
}
</style>
