<template>
  <div class="product-page">
    <div class="product-container">
      <div>
        <!-- 제품 등록 폼 -->
        <div class="product-form">
          <h3 class="form-title">불량품검사 등록</h3>
          <va-select
            v-model="form.productCode"
            :options="productOptions"
            label="제품명"
            class="quarter-width"
            value-by="value"
            text-by="label"
            placeholder="제품을 선택하세요"
          />
          <va-select
            v-model="form.code"
            :options="workOrderOptions"
            label="작업지시서번호"
            class="quarter-width"
            value-by="value"
            text-by="label"
            placeholder="작업지시서를 선택하세요"
          />
          <va-input v-model="form.processStage" label="공정단계" readonly />
          <va-select
            v-model="form.faultyType"
            :options="defectTypeOptions"
            label="불량유형"
            class="quarter-width"
            value-by="value"
            text-by="label"
            placeholder="불량유형 선택하세요"
          />

          <!-- 불량상세 자동입력 -->
          <va-input v-model="form.faultyDetail" label="불량상세" readonly />
          <va-input v-model="form.faultyQuantity" label="불량수량" readonly />
          <va-input
            v-model="form.occurDate"
            label="불합판정일자"
            type="date"
            readonly
          />
          <va-input v-model="form.detail" label="상세설명" readonly />

          <div class="form-buttons">
            <va-button @click="registerProduct" color="primary">등록</va-button>
            <va-button @click="resetForm" color="secondary">초기화</va-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";

const form = ref({
  productCode: "",
  code: "",
  processStage: "",
  faultyType: "",
  faultyDetail: "",
  faultyQuantity: "",
  occurDate: "",
  detail: "",
});

const productOptions = ref<{ label: string; value: string }[]>([]);
const workOrderOptions = ref<{ label: string; value: string }[]>([]);

const resetForm = () => {
  form.value = {
    productCode: "",
    code: "",
    processStage: "",
    faultyType: "",
    faultyDetail: "",
    faultyQuantity: "",
    occurDate: "",
    detail: "",
  };
  workOrderOptions.value = []; // 제품명 변경 시 작업지시서도 초기화
};

// 제품명 목록 불러오기
onMounted(async () => {
  try {
    const res = await axios.get("/faultys/productList");
    productOptions.value = res.data.map((item: any) => ({
      label: item.product_name,
      value: item.product_code,
    }));
  } catch (err) {
    console.error("제품명 목록 조회 실패:", err);
  }
});

// ✅ 제품명이 선택되었을 때 작업지시서 목록 가져오기
watch(
  () => form.value.productCode,
  async (newCode) => {
    if (!newCode) return;
    try {
      const res = await axios.get("/faultys/faultyOrderNoList", {
        params: { productCode: newCode },
      });
      workOrderOptions.value = res.data.map((item: any) => ({
        label: item.work_order_no,
        value: item.work_order_no,
      }));
    } catch (err) {
      console.error("작업지시서 번호 조회 실패:", err);
    }
  },
);

watch(
  () => form.value.code,
  async (newCode) => {
    if (!newCode) return;

    try {
      const res = await axios.get("/faultys/faultyDetail", {
        params: { workOrderNo: newCode },
      });

      if (res.data.length > 0) {
        const detail = res.data[0];
        form.value.processStage = detail.process_name || "";
        form.value.faultyQuantity = detail.insp_value_qty || "";
        form.value.occurDate = detail.created_at || "";
        form.value.detail = detail.qual_remark || "";
      }
    } catch (err) {
      console.error("불량 상세 정보 조회 실패:", err);
    }
  },
);

const defectTypeOptions = ref<
  { label: string; value: string; remark: string }[]
>([]);

onMounted(async () => {
  try {
    const res = await axios.get("/faultys/defectTypeList");
    defectTypeOptions.value = res.data.map((item: any) => ({
      label: item.defect_type_name,
      value: item.defect_type_name,
      remark: item.defect_type_remark,
    }));
  } catch (err) {
    console.error("불량유형 목록 조회 실패:", err);
  }
});

watch(
  () => form.value.faultyType,
  (selectedType) => {
    const match = defectTypeOptions.value.find(
      (item) => item.value === selectedType,
    );
    form.value.faultyDetail = match ? match.remark : "";
  },
);

const registerProduct = async () => {
  try {
    const payload = {
      product_code: form.value.productCode,
      work_order_no: form.value.code,
      process_name: form.value.processStage,
      defect_type: form.value.faultyType,
      defect_detail: form.value.faultyDetail,
      quantity: Number(form.value.faultyQuantity),
      occur_date: form.value.occurDate,
      qual_remark: form.value.detail,
    };

    const res = await axios.post("/faultys/register", payload);

    if (res.status === 200) {
      alert("불량품검사 등록 성공");
      resetForm();
    } else {
      alert("등록 실패");
    }
  } catch (err) {
    console.error("등록 오류:", err);
    alert("등록 중 오류가 발생했습니다.");
  }
};
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

.form-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.va-input {
  margin-bottom: 0.5rem;
}

.form-buttons {
  display: flex;
  justify-content: flex-end; /* 오른쪽 정렬 */
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.judgment-radio-group {
  display: flex;
  justify-content: center; /* 가운데 정렬 */
  margin-bottom: 0.5rem;
}
</style>
