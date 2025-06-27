<template>
  <!-- 제품 등록 폼 -->
  <div class="product-form">
    <h3 class="form-title">불량품폐기 등록</h3>
    <br />

    <!-- 상단 폼 -->
    <div class="form-section">
      <h3 class="form-title">불량이력 조회</h3>
      <div class="input-row">
        <va-select
          v-model="form.name"
          :options="productOptions"
          label="제품명"
          placeholder="제품을 선택하세요"
          value-by="value"
          text-by="label"
        />
        <va-select
          v-model="form.code"
          :options="workOrderOptions"
          label="작업지시서번호"
          placeholder="작업지시서를 선택하세요"
          value-by="value"
          text-by="label"
          :disabled="workOrderOptions.length === 0"
        />
      </div>
      <div class="input-row">
        <va-input v-model="form.processStage" label="공정단계" />
        <va-input v-model="form.occurDate" label="발생일자" type="date" />
      </div>
      <div class="input-row">
        <va-input v-model="form.faultyQuantity" label="불량수량" />
        <va-input v-model="form.faultyType" label="불량유형" />
      </div>
    </div>

    <!-- 하단 폼 -->
    <div class="form-section">
      <h3 class="form-title">폐기정보 등록</h3>
      <div class="input-row">
        <va-input v-model="form.faultyQuantity" label="폐기수량" />
        <va-input v-model="form.Representative" label="담당자" />
      </div>
      <div class="input-row">
        <va-input v-model="form.disuseReson" label="폐기사유" />
        <va-input v-model="form.disuseState" label="처리상태" />
      </div>
    </div>

    <!-- 버튼 -->
    <div class="form-buttons">
      <va-button @click="registerProduct" color="primary">등록</va-button>
      <va-button @click="resetForm" color="seconderys">초기화</va-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";

const productOptions = ref<{ label: string; value: string }[]>([]);
const workOrderOptions = ref<{ label: string; value: string }[]>([]);

const form = ref({
  faultyCode: "",
  occurDate: "",
  name: "", // 제품코드 저장 (제품명 아닌 코드)
  code: "", // 작업지시서 번호 저장
  processStage: "",
  faultyType: "",
  faultyResult: "",
  faultyQuantity: "",
  disuseCompany: "",
  Representative: "",
  disuseReson: "",
  disuseState: "",
});

// 제품 리스트 로드
onMounted(async () => {
  try {
    const res = await axios.get("/faultyDisuses/productList");
    productOptions.value = res.data.map((item: any) => ({
      label: item.product_name,
      value: item.product_code,
    }));
  } catch (err) {
    console.error("제품명 목록 조회 실패:", err);
  }
});

// 제품 선택 시 작업지시서 목록 불러오기
watch(
  () => form.value.name,
  async (newProductCode) => {
    if (!newProductCode) {
      workOrderOptions.value = [];
      form.value.code = "";
      return;
    }
    try {
<<<<<<< HEAD
      const res = await axios.get("faultyDisuses/workOrderList", {
=======
      const res = await axios.get("/faultyDisuses/workOrderList", {
>>>>>>> main
        params: { productCode: newProductCode },
      });
      workOrderOptions.value = res.data.map((item: any) => ({
        label: item.work_order_no,
        value: item.work_order_no,
      }));
    } catch (err) {
      console.error("작업지시서 목록 조회 실패:", err);
      workOrderOptions.value = [];
      form.value.code = "";
    }
  },
);

watch(
  () => form.value.code,
  async (newWorkOrderNo) => {
    if (!form.value.name || !newWorkOrderNo) return;

    try {
      const res = await axios.get("/faultyDisuses/faultyInfo", {
        params: {
          productCode: form.value.name,
          workOrderNo: newWorkOrderNo,
        },
      });

      const data = res.data;
      form.value.processStage = data.process_name || "";
      form.value.occurDate = data.created_at || "";
      form.value.faultyQuantity = data.quantity || "";
      form.value.faultyType = data.defect_type || "";
    } catch (err) {
      console.error("불량 정보 조회 실패:", err);
      form.value.processStage = "";
      form.value.occurDate = "";
      form.value.faultyQuantity = "";
      form.value.faultyType = "";
    }
  },
);

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
    disuseCompany: "",
    Representative: "",
    disuseReson: "",
    disuseState: "",
  };
}

async function registerProduct() {
  if (!form.value.name || !form.value.code) {
    return alert("제품명과 작업지시서는 필수입니다.");
  }

  try {
    const payload = {
      product_code: form.value.name,
      work_order_no: form.value.code,
      process_name: form.value.processStage,
      occur_date: form.value.occurDate,
      defect_type: form.value.faultyType,
      faulty_quantity: Number(form.value.faultyQuantity),
      representative: form.value.Representative,
      disuse_reason: form.value.disuseReson,
      disuse_state: form.value.disuseState,
    };

    await axios.post("/faultyDisuses/register", payload);
    alert("폐기정보 등록이 완료되었습니다.");
    resetForm();
  } catch (err) {
    console.error("등록 실패:", err);
    alert("등록 중 오류가 발생했습니다.");
  }
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
