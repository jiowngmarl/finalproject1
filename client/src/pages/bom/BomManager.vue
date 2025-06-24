<template>
  <div class="max-w-[1060px] h-[739px] mx-auto p-4 bg-gray-50 overflow-hidden">
    <!-- 상단 타이틀 -->
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">BOM 관리</h1>
    </div>

    <div class="grid grid-cols-2 gap-4 h-[calc(100%-80px)]">
      <!-- 좌측: BOM 리스트 -->
      <div
        class="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div class="mb-4">
          <label class="block text-xs font-medium text-blue-600 mb-2"
            >제품명</label
          >
          <select
            v-model="selectedProduct"
            @change="filterBomList"
            class="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
          >
            <option value="">제품명 선택</option>
            <option
              v-for="prod in uniqueProductOptions"
              :key="prod.base_product_code"
              :value="prod.product_name"
            >
              {{ prod.product_name }}
            </option>
          </select>
        </div>

        <div class="h-[550px] overflow-auto border border-gray-200 rounded">
          <table class="w-full text-sm border-collapse bg-white">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 text-xs"
                >
                  BOM코드
                </th>
                <th
                  class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 text-xs"
                >
                  제품코드
                </th>
                <th
                  class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 text-xs"
                >
                  제품명
                </th>
                <th
                  class="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 text-xs"
                >
                  규격
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="bom in filteredBoms"
                :key="bom.bom_code"
                @click="selectBom(bom)"
                class="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
              >
                <td class="border border-gray-200 px-3 py-2 text-xs">
                  {{ bom.bom_code }}
                </td>
                <td class="border border-gray-200 px-3 py-2 text-xs">
                  {{ bom.product_code }}
                </td>
                <td class="border border-gray-200 px-3 py-2 text-xs">
                  {{ bom.product_name }}
                </td>
                <td class="border border-gray-200 px-3 py-2 text-xs">
                  {{ bom.product_stand }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 우측: BOM 상세 -->
      <div
        class="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <!-- 기본 정보 -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-blue-600 mb-2"
              >BOM 코드</label
            >
            <input
              v-model="form.bom_code"
              class="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs bg-gray-100"
              readonly
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-blue-600 mb-2"
              >제품명</label
            >
            <div class="relative">
              <select
                v-if="!isEditMode"
                v-model="form.product_name"
                class="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
                @change="onProductNameChange"
              >
                <option value="">제품명 선택</option>
                <option
                  v-for="product in uniqueProductNames"
                  :key="product"
                  :value="product"
                >
                  {{ product }}
                </option>
              </select>
              <input
                v-else
                v-model="form.product_name"
                class="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-xs"
                readonly
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-blue-600 mb-2"
              >규격</label
            >
            <select
              v-model="form.product_stand"
              class="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
              @change="updateProductCode"
              :disabled="!form.product_name || isEditMode"
            >
              <option value="">규격 선택</option>
              <option v-for="spec in availableSpecs" :key="spec" :value="spec">
                {{ spec }}
              </option>
            </select>
          </div>
        </div>

        <!-- 투입 자재 -->
        <div class="mb-3 flex flex-col h-60">
          <div class="flex justify-between items-center mb-2">
            <label class="text-xs font-medium text-blue-600">투입 자재</label>
            <button
              @click="removeSelectedMaterials"
              class="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!hasSelectedMaterials"
            >
              제거
            </button>
          </div>
          <div class="flex-1 overflow-auto border border-gray-200 rounded">
            <table class="w-full text-xs border-collapse bg-white">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-center font-medium text-gray-700"
                  >
                    #
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    자재코드
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    자재명
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    분류
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    규격
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    투입량
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    단위
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(mat, index) in form.materials"
                  :key="mat.material_code || index"
                  class="hover:bg-gray-50"
                >
                  <td class="border border-gray-200 px-2 py-0.5 text-center">
                    <input
                      type="checkbox"
                      v-model="mat.selected"
                      class="rounded w-3 h-3"
                    />
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_code }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_name }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_type || "-" }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_stand }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    <input
                      v-model.number="mat.usage_qty"
                      type="number"
                      step="0.01"
                      class="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_unit }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 자재 검색 및 추가 -->
        <div class="mb-3">
          <label class="text-xs font-medium text-blue-600 mb-2 block"
            >자재 검색 및 추가</label
          >
          <div class="flex gap-2 mb-2">
            <input
              v-model="searchMaterial"
              placeholder="자재코드 또는 자재명"
              class="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              @keyup.enter="searchMaterials"
            />
            <button
              @click="addMaterialsToBom"
              class="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors duration-150"
            >
              추가
            </button>
          </div>
          <div class="h-[200px] overflow-y-auto border border-gray-200 rounded">
            <table class="w-full text-xs border-collapse bg-white">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-center font-medium text-gray-700"
                  >
                    #
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    자재코드
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    자재명
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    분류
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    규격
                  </th>
                  <th
                    class="border border-gray-200 px-2 py-0.5 text-left font-medium text-gray-700"
                  >
                    단위
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="mat in filteredMaterials"
                  :key="mat.material_code"
                  class="hover:bg-gray-50"
                >
                  <td class="border border-gray-200 px-2 py-0.5 text-center">
                    <input
                      type="checkbox"
                      :value="mat"
                      v-model="selectedMaterials"
                      class="rounded w-3 h-3"
                    />
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_code }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_name }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_type }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_stand }}
                  </td>
                  <td class="border border-gray-200 px-2 py-0.5">
                    {{ mat.material_unit }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 저장/초기화 버튼 -->
        <div class="flex gap-3 justify-center mt-2">
          <button
            @click="saveBom"
            class="px-5 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            :disabled="!canSave"
          >
            {{ isEditMode ? "수정" : "저장" }}
          </button>
          <button
            @click="resetForm"
            class="px-5 py-1.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors duration-150 font-medium"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const bomList = ref([]);
const productOptions = ref([]);
const materialList = ref([]);

const selectedProduct = ref("");
const selectedMaterials = ref([]);
const searchMaterial = ref("");
const isEditMode = ref(false);

const form = ref({
  bom_code: "",
  product_code: "",
  product_name: "",
  product_stand: "",
  materials: [],
  deletedMaterials: [], // 삭제할 자재 목록
});

// BOM 목록을 고유하게 변환 (중복 제거)
const uniqueBomList = computed(() => {
  const bomMap = new Map();
  bomList.value.forEach((bom) => {
    if (!bomMap.has(bom.bom_code)) {
      bomMap.set(bom.bom_code, {
        bom_code: bom.bom_code,
        product_code: bom.product_code,
        product_name: bom.product_name,
        product_stand: bom.product_stand,
      });
    }
  });
  return Array.from(bomMap.values());
});

// 제품명 중복 제거하여 드롭다운 옵션 생성 (왼쪽 필터용)
// 제품코드 기반으로 그룹핑하되 제품명이 표시되도록
const uniqueProductOptions = computed(() => {
  const productMap = new Map();

  productOptions.value.forEach((product) => {
    // 제품코드에서 규격 부분(-10, -30, -60) 제거
    const baseProductCode = product.product_code.replace(/-\d+$/, "");

    if (!productMap.has(baseProductCode)) {
      productMap.set(baseProductCode, {
        base_product_code: baseProductCode,
        product_name: product.product_name,
        // 해당 베이스 코드의 모든 규격들
        variants: [],
      });
    }

    // 각 베이스 코드별로 규격 정보 저장
    productMap.get(baseProductCode).variants.push({
      product_code: product.product_code,
      product_stand: product.product_stand,
    });
  });

  return Array.from(productMap.values());
});

// 중복 제거된 제품명 목록 (드롭다운용)
const uniqueProductNames = computed(() => {
  const productNames = new Set();
  productOptions.value.forEach((product) => {
    if (product.product_name) {
      productNames.add(product.product_name);
    }
  });
  return Array.from(productNames).sort();
});

// 선택된 제품명에 따른 사용 가능한 규격 목록
const availableSpecs = computed(() => {
  if (!form.value.product_name) return [];

  const specs = new Set();
  productOptions.value
    .filter((product) => product.product_name === form.value.product_name)
    .forEach((product) => {
      if (product.product_stand) {
        specs.add(product.product_stand);
      }
    });

  return Array.from(specs).sort();
});

// 선택된 제품명으로 BOM 목록 필터링 (제품코드 기반)
const filteredBoms = computed(() => {
  if (!selectedProduct.value) return uniqueBomList.value;

  // 선택된 제품명에 해당하는 제품코드들 찾기
  const matchingProductCodes = productOptions.value
    .filter((product) => product.product_name === selectedProduct.value)
    .map((product) => product.product_code);

  // BOM 목록에서 해당 제품코드들과 일치하는 것들만 필터링
  return uniqueBomList.value.filter((bom) =>
    matchingProductCodes.includes(bom.product_code),
  );
});

const filteredMaterials = computed(() => {
  if (!searchMaterial.value) return materialList.value.slice(0, 50);
  const keyword = searchMaterial.value.toLowerCase();
  return materialList.value
    .filter((mat) => {
      return (
        mat.material_code.toLowerCase().includes(keyword) ||
        mat.material_name.toLowerCase().includes(keyword)
      );
    })
    .slice(0, 50);
});

const hasSelectedMaterials = computed(() => {
  return form.value.materials.some((material) => material.selected);
});

const canSave = computed(() => {
  return (
    form.value.bom_code &&
    form.value.product_name &&
    form.value.product_stand &&
    form.value.materials.length > 0
  );
});

// BOM 코드 자동 생성 함수 (BOM-제품코드-YYYYMMDD 형식)
const generateBomCode = () => {
  if (form.value.product_code) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateStr = year + month + day;

    form.value.bom_code = `BOM-${form.value.product_code}-${dateStr}`;
  }
};

// 제품명 선택 시 처리
const onProductNameChange = () => {
  // 제품명이 변경되면 규격 초기화
  form.value.product_stand = "";
  form.value.product_code = "";
  form.value.bom_code = "";
};

// 제품명과 규격 기반으로 제품코드 업데이트 및 BOM 코드 자동 생성
const updateProductCode = async () => {
  if (
    !isEditMode.value &&
    form.value.product_name &&
    form.value.product_stand
  ) {
    // 제품명과 규격이 일치하는 제품 찾기
    const matchingProduct = productOptions.value.find(
      (product) =>
        product.product_name === form.value.product_name &&
        product.product_stand === form.value.product_stand,
    );

    if (matchingProduct) {
      form.value.product_code = matchingProduct.product_code;

      // BOM 코드 자동 생성
      generateBomCode();

      // 동일한 제품코드로 기존 BOM이 있는지 확인
      await checkExistingBom(matchingProduct.product_code);
    } else {
      form.value.product_code = "";
      form.value.bom_code = "";
    }
  }
};

// 기존 BOM 존재 여부 확인
const checkExistingBom = async (productCode) => {
  try {
    // 기존 BOM 목록에서 동일한 제품코드가 있는지 확인
    const existingBom = uniqueBomList.value.find(
      (bom) => bom.product_code === productCode,
    );
    if (existingBom) {
      alert(`${form.value.product_name}의 BOM 코드가 이미 등록되어 있습니다.`);
      form.value.bom_code = "";
      return false;
    }
    return true;
  } catch (err) {
    return true;
  }
};

const filterBomList = () => {
  // 필터링은 computed에서 처리되므로 빈 함수
};

const selectBom = async (bom) => {
  // 중복 호출 방지
  if (isEditMode.value && form.value.bom_code === bom.bom_code) {
    return;
  }

  try {
    const res = await axios.get(`/bom/${bom.bom_code}`);

    if (res.data && res.data.master) {
      const { master, materials } = res.data;

      form.value = {
        bom_code: master.bom_code,
        product_code: master.product_code,
        product_name: master.product_name,
        product_stand: master.product_stand,
        materials: materials.map((item) => ({
          material_code: item.material_code,
          material_name: item.material_name,
          material_type: item.material_type || "",
          material_unit: item.material_unit,
          material_stand: item.material_stand,
          usage_qty: item.usage_qty,
          bom_unit: item.bom_unit,
          selected: false,
          status: "existing",
        })),
        deletedMaterials: [],
      };
      isEditMode.value = true;
    }
  } catch (err) {
    alert("BOM 상세 정보를 불러오는데 실패했습니다.");
  }
};

const addMaterialsToBom = () => {
  selectedMaterials.value.forEach((mat) => {
    if (
      !form.value.materials.find((d) => d.material_code === mat.material_code)
    ) {
      form.value.materials.push({
        material_code: mat.material_code,
        material_name: mat.material_name,
        material_type: mat.material_type || mat.material_category || "",
        material_unit: mat.material_unit,
        material_stand: mat.material_stand,
        usage_qty: 0,
        bom_unit: mat.material_unit,
        selected: false,
        status: "new",
      });
    }
  });
  selectedMaterials.value = [];
};

const removeSelectedMaterials = () => {
  const selectedMaterialsToDelete = form.value.materials.filter(
    (material) => material.selected,
  );

  if (selectedMaterialsToDelete.length === 0) {
    alert("삭제할 자재를 선택해주세요.");
    return;
  }

  // 기존 자재(DB에 있는 자재)는 삭제 목록에 추가
  const existingMaterialsToDelete = selectedMaterialsToDelete.filter(
    (mat) => mat.status === "existing",
  );
  if (existingMaterialsToDelete.length > 0) {
    form.value.deletedMaterials = form.value.deletedMaterials || [];
    existingMaterialsToDelete.forEach((material) => {
      form.value.deletedMaterials.push({
        material_code: material.material_code,
        bom_code: form.value.bom_code,
      });
    });
  }

  // UI에서 선택된 자재들 제거
  form.value.materials = form.value.materials.filter(
    (material) => !material.selected,
  );
};

const saveBom = async () => {
  if (!canSave.value) {
    alert("BOM 코드, 제품명, 규격, 자재를 모두 입력해주세요.");
    return;
  }

  try {
    let finalProductCode = form.value.product_code;

    // 신규 등록 시 제품코드가 없으면 제품명과 규격으로 찾기
    if (!isEditMode.value && !finalProductCode) {
      const matchingProduct = productOptions.value.find(
        (product) =>
          product.product_name === form.value.product_name &&
          product.product_stand === form.value.product_stand,
      );

      if (matchingProduct) {
        finalProductCode = matchingProduct.product_code;
      } else {
        alert("선택한 제품명과 규격에 해당하는 제품을 찾을 수 없습니다.");
        return;
      }
    }

    // 백엔드 서비스와 동일한 구조로 데이터 구성
    const payload = {
      master: {
        bom_code: form.value.bom_code,
        product_code: finalProductCode,
        product_name: form.value.product_name,
        product_stand: form.value.product_stand,
      },
      materials: form.value.materials.map((mat) => ({
        material_code: mat.material_code,
        usage_qty: mat.usage_qty,
        bom_unit: mat.bom_unit || mat.material_unit,
        status: mat.status || "new",
      })),
    };

    if (isEditMode.value) {
      await axios.put("/bom", payload);
      alert("BOM 수정 완료");
    } else {
      await axios.post("/bom", payload);
      alert("BOM 등록 완료");
    }

    await fetchBomList();
    resetForm();
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      alert(`BOM 저장에 실패했습니다: ${err.response.data.error}`);
    } else {
      alert("BOM 저장에 실패했습니다.");
    }
  }
};

const resetForm = () => {
  form.value = {
    bom_code: "",
    product_code: "",
    product_name: "",
    product_stand: "",
    materials: [],
    deletedMaterials: [], // 삭제된 자재 목록 초기화
  };
  isEditMode.value = false;
  selectedMaterials.value = [];
};

const fetchBomList = async () => {
  try {
    const res = await axios.get("/bom/list");
    bomList.value = res.data || [];
  } catch (err) {
    // 오류 처리
  }
};

const fetchProductList = async () => {
  try {
    const res = await axios.get("/bom/products");
    productOptions.value = res.data || [];
  } catch (err) {
    // 오류 처리
  }
};

const fetchMaterialList = async () => {
  try {
    const res = await axios.get("/bom/materials");
    materialList.value = res.data || [];
  } catch (err) {
    // 오류 처리
  }
};

const searchMaterials = () => {
  // Enter 키 입력 시 자동으로 filteredMaterials가 업데이트됨
};

onMounted(() => {
  fetchBomList();
  fetchProductList();
  fetchMaterialList();
});
</script>

<style scoped>
input,
select {
  transition: all 0.15s ease-in-out;
}

input:focus,
select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 스크롤바 스타일링 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
