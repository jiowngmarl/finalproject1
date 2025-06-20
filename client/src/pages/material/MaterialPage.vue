<template>
  <div class="material-page">
    <div class="material-container">
      <h2 class="material-title">자재 관리</h2>
      <div class="material-grid">
        <!-- 자재 검색 필터 및 테이블 -->
        <div class="material-table">
          <div class="material-filters">
            <va-input
              v-model="filters.material_code"
              label="자재코드"
              class="filter-input"
            />
            <va-input
              v-model="filters.material_name"
              label="자재명"
              class="filter-input"
            />
            <va-input
              v-model="filters.material_cls"
              label="분류"
              class="filter-spec-input"
            />
          </div>
          <va-data-table
            v-model:current-page="page"
            :items="filteredMaterials"
            :columns="columns"
            :per-page="10"
            track-by="material_code"
          >
            <template #cell(select)="{ row }">
              <va-checkbox
                :model-value="selectedMaterialCode === row.source.material_code"
                :disabled="
                  selectedMaterialCode !== null &&
                  selectedMaterialCode !== row.source.material_code
                "
                @update:model-value="
                  (checked: boolean) => onCheckboxToggle(checked, row.source)
                "
              />
            </template>
          </va-data-table>
        </div>

        <!-- 자재 등록 폼 -->
        <div class="material-form">
          <div class="form-header">
            <h3 class="form-title">자재 등록</h3>
            <input type="file" accept="image/*" @change="onImageChange" />
          </div>

          <!-- 미리보기 이미지 -->
          <div v-if="previewImage" class="image-preview">
            <img :src="previewImage" alt="첨부 이미지 미리보기" />
          </div>

          <va-input v-model="form.material_code" label="자재코드" />
          <va-input v-model="form.material_name" label="자재명" />
          <va-input v-model="form.material_pay" label="단가" />
          <va-input v-model="form.material_cls" label="분류" />
          <va-input v-model="form.material_stand" label="규격" />
          <va-input v-model="form.material_unit" label="단위" />
          <va-input v-model="form.material_safty" label="안전재고" />

          <div class="form-buttons">
            <va-button color="primary" @click="registerMaterial">
              등록
            </va-button>
            <va-button color="secondary" @click="resetForm"> 초기화 </va-button>
            <va-button color="warning" @click="updateMaterial">
              수정
            </va-button>
            <va-button color="danger" @click="deleteMaterial"> 삭제 </va-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, computed, onMounted } from "vue";

interface Material {
  material_code: string;
  material_name: string;
  material_pay: string;
  material_cls: string;
  material_stand: string;
  material_unit: string;
  material_safty: string;
  material_img: string;
}

const materials = ref<Material[]>([]);

const fetchMaterials = async () => {
  try {
    const res = await axios.get("/material");
    materials.value = res.data;
  } catch (err) {
    console.log("❌ 자재 목록 조회 실패:", err);
  }
};

const columns = [
  { key: "select", label: "선택" },
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "material_cls", label: "분류" },
  { key: "material_unit", label: "단위" },
  { key: "material_stand", label: "규격" },
];

const filters = ref({
  material_code: "",
  material_name: "",
  material_cls: "",
});

const page = ref(1);

const filteredMaterials = computed(() => {
  return materials.value.filter(
    (p) =>
      (!filters.value.material_code ||
        p.material_code.includes(filters.value.material_code)) &&
      (!filters.value.material_name ||
        p.material_name.includes(filters.value.material_name)) &&
      (!filters.value.material_cls ||
        p.material_cls.includes(filters.value.material_cls)),
  );
});

const form = ref({
  material_code: "",
  material_name: "",
  material_pay: "",
  material_cls: "",
  material_stand: "",
  material_unit: "",
  material_safty: "",
  material_img: "",
});

const previewImage = ref<string | null>(null);
const imageFile = ref<File | null>(null);

function resetForm() {
  form.value = {
    material_code: "",
    material_name: "",
    material_pay: "",
    material_cls: "",
    material_stand: "",
    material_unit: "",
    material_safty: "",
    material_img: "",
  };
  previewImage.value = null;
  imageFile.value = null;
}

async function registerMaterial() {
  if (!form.value.material_code || !form.value.material_name) {
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
    const res = await axios.post("/material", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.isSuccessed == true) {
      alert("등록완료!");
      await fetchMaterials();
      resetForm();
    } else {
      alert("등록 실패!");
    }
  } catch (err) {
    console.log("오류 발생:", err);
    alert("서버 오류!");
  }
}

async function updateMaterial() {
  const code = form.value.material_code.trim();
  if (!code) {
    alert("자재코드가 없습니다. 수정할 수 없습니다.");
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
    const res = await axios.put(`/material/${code}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.isUpdated == true) {
      alert("수정 완료!");
      await fetchMaterials();
      resetForm();
    } else {
      alert("수정 실패!");
    }
  } catch (err) {
    console.error("❌ 수정 중 오류 발생:", err);
    alert("서버 오류!");
  }
}

async function deleteMaterial() {
  const trimmedCode = form.value.material_code.trim();

  if (!trimmedCode) {
    alert("자재코드가 없습니다. 삭제할 수 없습니다.");
    return;
  }

  if (!confirm(`정말로 ${trimmedCode} 자재을 삭제하시겠습니까?`)) {
    return;
  }

  try {
    const res = await axios.delete(`/material/${trimmedCode}`);

    if (res.data) {
      alert("삭제 완료!");
      await fetchMaterials();
      resetForm();
    } else {
      alert("삭제 실패! (해당 자재이 존재하지 않거나 이미 삭제됨)");
    }
  } catch (err) {
    console.error("❌ 삭제 중 오류 발생:", err);
    alert("서버 오류!");
  }
}

const selectedMaterialCode = ref<string | null>(null);

function onCheckboxToggle(checked: boolean, row: Material) {
  if (checked) {
    selectedMaterialCode.value = row.material_code;
    form.value = { ...row };
  } else {
    if (selectedMaterialCode.value === row.material_code) {
      selectedMaterialCode.value = null;
      resetForm();
    }
  }
}

function onImageChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  imageFile.value = file;
  form.value.material_img = file.name; // ✅ 이름을 form에 저장 (중요)

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.value = reader.result as string;
  };
  reader.readAsDataURL(file);
}

onMounted(() => {
  fetchMaterials();
});
</script>

<style scoped>
.material-page {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  height: 739px;
}

.material-container {
  width: 1060px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.material-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 2.5rem;
}

.material-table {
  grid-column: span 2 / span 2;
}

.material-filters {
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

.material-form {
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
