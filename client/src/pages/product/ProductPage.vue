<template>
  <div class="product-page">
    <div class="product-container">
      <h2 class="product-title">제품 관리</h2>
      <div class="product-grid">
        <!-- 제품 검색 필터 및 테이블 -->
        <div class="product-table">
          <div class="product-filters">
            <va-input
              v-model="filters.product_code"
              label="제품코드"
              class="filter-input"
            />
            <va-input
              v-model="filters.product_name"
              label="제품명"
              class="filter-input"
            />
            <va-input
              v-model="filters.product_stand"
              label="규격"
              class="filter-spec-input"
            />
          </div>
          <va-data-table
            :items="filteredProducts"
            :columns="columns"
            :per-page="10"
            :current-page.sync="page"
            track-by="product_code"
          >
            <template #cell(select)="{ row }">
              <va-checkbox
                :model-value="selectedProductCode === row.source.product_code"
                @update:modelValue="
                  (checked: boolean) => onCheckboxToggle(checked, row.source)
                "
                :disabled="
                  selectedProductCode !== null &&
                  selectedProductCode !== row.source.product_code
                "
              />
            </template>
          </va-data-table>
        </div>

        <!-- 제품 등록 폼 -->
        <div class="product-form">
          <div class="form-header">
            <h3 class="form-title">제품 등록</h3>
            <input type="file" accept="image/*" @change="onImageChange" />
          </div>

          <!-- 미리보기 이미지 -->
          <div v-if="previewImage" class="image-preview">
            <img :src="previewImage" alt="첨부 이미지 미리보기" />
          </div>

          <va-input v-model="form.product_code" label="제품코드" />
          <va-input v-model="form.product_name" label="제품명" />
          <va-input v-model="form.product_pay" label="판매가" />
          <va-input v-model="form.product_atc" label="ATC코드" />
          <va-input v-model="form.product_gred" label="주요성분" />
          <va-input v-model="form.product_stand" label="규격" />
          <va-input v-model="form.product_perdt" label="허가일" type="date" />
          <va-input v-model="form.product_unit" label="단위" />
          <va-input v-model="form.product_safty" label="안전재고" />
          <va-input v-model="form.product_packge" label="포장유형" />

          <div class="form-buttons">
            <va-button @click="registerProduct" color="primary">등록</va-button>
            <va-button @click="resetForm" color="secondary">초기화</va-button>
            <va-button @click="updateProduct" color="warning">수정</va-button>
            <va-button @click="deleteProduct" color="danger">삭제</va-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, computed, onMounted } from "vue";

interface Product {
  product_code: string
  product_name: string
  product_pay: string
  product_atc: string
  product_gred: string
  product_stand: string
  product_perdt: string
  product_unit: string
  product_safty: string
  product_img: string
}

const products = ref<Product[]>([]);

const fetchProducts = async () => {
  try {
    const res = await axios.get("/product");
    products.value = res.data;
  } catch (err) {
    console.log("❌ 제품 목록 조회 실패:", err);
  }
};

const columns = [
  { key: "select", label: "선택" },
  { key: "product_code", label: "제품코드" },
  { key: "product_name", label: "제품명" },
  { key: "product_unit", label: "단위" },
  { key: "product_stand", label: "규격" },
];

const filters = ref({
  product_code: "",
  product_name: "",
  product_stand: "",
});

const page = ref(1);

const filteredProducts = computed(() => {
  return products.value.filter(
    (p) =>
      (!filters.value.product_code ||
        p.product_code.includes(filters.value.product_code)) &&
      (!filters.value.product_name ||
        p.product_name.includes(filters.value.product_name)) &&
      (!filters.value.product_stand ||
        p.product_stand.includes(filters.value.product_stand)),
  );
});

const form = ref({
  product_code: '',
  product_name: '',
  product_pay: '',
  product_atc: '',
  product_gred: '',
  product_stand: '',
  product_perdt: '',
  product_unit: '',
  product_safty: '',
  product_img: '', // 이미지 이름 저장
})

const previewImage = ref<string | null>(null);
const imageFile = ref<File | null>(null);

function resetForm() {
  form.value = {
    product_code: '', product_name: '', product_pay: '', product_atc: '', product_gred: '', product_stand: '',
    product_perdt: '', product_unit: '', product_safty: '', product_img: ''
  };
  previewImage.value = null;
  imageFile.value = null;
}

function onImageChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  imageFile.value = file;
  form.value.product_img = file.name; // ✅ 이름을 form에 저장 (중요)

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.value = reader.result as string;
  };
  reader.readAsDataURL(file);
}

async function registerProduct() {
  if (!form.value.product_code || !form.value.product_name) {
    alert("필수값 누락");
    return;
  }

  const formData = new FormData();

  for (const key in form.value) {
    formData.append(key, (form.value as any)[key]);
  }

  if (imageFile.value) {
    formData.append("image", imageFile.value);
  }

  try {
    const res = await axios.post("/product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.isSuccessed == true) {
      alert("등록완료!");
      await fetchProducts();
      resetForm();
    } else {
      alert("등록 실패!");
    }
  } catch (err) {
    console.log("오류 발생:", err);
    alert("서버 오류!");
  }
}

async function updateProduct() {
  const code = form.value.product_code.trim();
  if (!code) {
    alert("제품코드가 없습니다. 수정할 수 없습니다.");
    return;
  }

  const formData = new FormData();

  for (const key in form.value) {
    formData.append(key, (form.value as any)[key]);
  }

  if (imageFile.value) {
    formData.append("image", imageFile.value);
  }

  try {
    const res = await axios.put(`/product/${code}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.isUpdated === true) {
      alert("수정 완료!");
      await fetchProducts();
      resetForm();
    } else {
      alert("수정 실패!");
    }
  } catch (err) {
    console.error("❌ 수정 오류:", err);
    alert("서버 오류!");
  }
}

async function deleteProduct() {
  const trimmedCode = form.value.product_code.trim();

  if (!trimmedCode) {
    alert("제품코드가 없습니다. 삭제할 수 없습니다.");
    return;
  }

  if (!confirm(`정말로 ${trimmedCode} 제품을 삭제하시겠습니까?`)) {
    return;
  }

  try {
    const res = await axios.delete(`/product/${trimmedCode}`);

    if (res.data.isDeleted == true) {
      alert("삭제 완료!");
      await fetchProducts();
      resetForm();
    } else {
      alert("삭제 실패! (해당 제품이 존재하지 않거나 이미 삭제됨)");
    }
  } catch (err) {
    console.error("❌ 삭제 중 오류 발생:", err);
    alert("서버 오류!");
  }
}

const selectedProductCode = ref<string | null>(null);

function onCheckboxToggle(checked: boolean, row: Product) {
  if (checked) {
    selectedProductCode.value = row.product_code;
    form.value = { ...row };
  } else {
    selectedProductCode.value = null;
    resetForm();
  }
}

onMounted(() => {
  fetchProducts();
});
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

.product-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 2.5rem;
}

.product-table {
  grid-column: span 2 / span 2;
}

.product-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-input {
  width: 33.333%;
}

.filter-spec-input {
  width: 25%;
}

.product-form {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

.form-title {
  font-size: 1.125rem;
  font-weight: 1000;
  width: 100px;
  margin-bottom: 1rem;
}

.va-input {
  margin-bottom: 0.5rem;
}

.form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.image-preview img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  border: 1px solid #ccc;
  padding: 4px;
  border-radius: 4px;
}
</style>
