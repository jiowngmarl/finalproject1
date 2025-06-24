<template>
  <div class="process-page">
    <h2 class="title">공정 흐름도 관리</h2>

    <!-- 제품 검색 -->
    <div class="product-search va-row va-gap-2 va-items-center">
      <label>제품코드: </label>
      <input v-model="search.product_code" placeholder="제품코드 입력" />

      <label>제품명: </label>
      <input v-model="search.product_name" placeholder="제품명 입력" />

      <label>규격:</label>
      <input v-model="search.product_stand" placeholder="규격 입력" />

      <button class="btn search" @click="handleProductSearch">검색</button>
      <button class="btn reset" @click="resetSearch">초기화</button>
      <button class="btn save" @click="saveProcesses">저장</button>
    </div>

    <div class="times">
      <span class="product-label">총 소요시간: {{ totalProcessTime }}분</span>
    </div>

    <!-- 공정 목록 -->
    <div class="process-table">
      <div class="table-header">
        <h3>공정순서</h3>
        <div>
          <button class="btn add" @click="addProcess">공정추가</button>
          <button class="btn delete" @click="deleteSelectedProcesses">
            공정삭제
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" disabled /></th>
            <th>순번</th>
            <th>예상소요시간</th>
            <th>시험작업</th>
            <th>설비유형</th>
            <th>상세추가</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(process, index) in processes" :key="index">
            <td><input type="checkbox" v-model="process.selected" /></td>
            <td>{{ index + 1 }}</td>
            <td>
              <input
                class="time-input"
                v-model="process.process_time"
                placeholder="예: 60분"
              />
            </td>
            <td>
              <select class="name-input" v-model="process.process_int">
                <option disabled value="">공정 명</option>
                <option
                  v-for="item in processIntList"
                  :key="item.process_int"
                  :value="item.process_int"
                >
                  {{ item.process_name }}
                </option>
              </select>
            </td>
            <td>
              <select
                v-if="equipmentCodes.length"
                class="equipment-select"
                v-model="process.code_value"
              >
                <option disabled value="">선택</option>
                <option
                  v-for="item in equipmentCodes"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </select>
              <span v-else style="color: red">🚫 설비 코드 없음</span>
            </td>
            <td>
              <button
                class="btn save"
                @click="handlePopupOpen(process.process_code, index)"
              >
                상세추가
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 팝업 컴포넌트 -->
    <PopupDetail
      v-if="popupVisible"
      :visible="popupVisible"
      :processCode="popupProcessCode"
      :productCode="popupProductCode"
      :materialOptions="materialOptions"
      :materialList="materialList"
      :bomCode="bomCode"
      @update:visible="popupVisible = $event"
      @save="saveMaterial"
      @materialCodeChange="onMaterialCodeChange"
      @addMaterial="addMaterial"
      @deleteSelectedMaterials="deleteSelectedMaterials"
    />
  </div>
</template>

<script lang="ts" setup>
import PopupDetail from "../modals/PopupDetail.vue";
import axios from "axios";
import { onMounted, computed, ref, watch } from "vue";

interface Product {
  product_code: string;
  product_name: string;
  product_stand: string;
}

interface Process {
  process_code: string;
  process_time: string;
  process_name: string;
  code_value: string;
  process_int: string;
  selected?: boolean;
}

interface ProcessPayload {
  process_code: string;
  process_name: string;
  process_time: string;
  process_seq: number;
  product_code: string;
  code_value: string;
  process_group_code: string;
  process_int: string;
}

interface EquipmentCode {
  value: string;
  label: string;
}

interface MaterialRow {
  process_code: string;
  material_code: string;
  material_name: string;
  material_unit: string;
  BOM_code: string;
  usage_qty: number;
  responsible: string;
  selected?: boolean;
}

interface MaterialOption {
  material_code: string;
  material_name: string;
  material_unit: string;
  usage_qty: number;
}

interface ProcessGroupPayload {
  process_group_code: string;
  product_code: string;
}

const selectedProductCode = ref<string>("");
const products = ref<Product[]>([]);
const processes = ref<Process[]>([]);
const equipmentCodes = ref<EquipmentCode[]>([]);
const popupVisible = ref(false);
const popupProcessCode = ref("");
const materialList = ref<MaterialRow[]>([]);
const materialOptions = ref<MaterialOption[]>([]);
const popupProductCode = ref<string>("");
const bomCode = ref("");

const search = ref({
  product_code: "",
  product_name: "",
  product_stand: "",
});

const handleProductSearch = () => {
  let found: Product | null = null;

  // 우선 제품코드로 찾기
  if (search.value.product_code) {
    found =
      products.value.find(
        (p) => p.product_code === search.value.product_code,
      ) ?? null;
  }

  // 아니면 제품명 + 규격으로 찾기
  if (!found && search.value.product_name && search.value.product_stand) {
    found =
      products.value.find(
        (p) =>
          p.product_name === search.value.product_name &&
          p.product_stand === search.value.product_stand,
      ) ?? null;
  }

  if (!found) {
    alert("해당 제품을 찾을 수 없습니다.");
    return;
  }

  // ✅ 작성 중 공정이 있고, 선택된 제품과 다른 경우 확인 알림
  const isEditing = processes.value.length > 0;
  const isDifferentProduct =
    selectedProductCode.value &&
    selectedProductCode.value !== found.product_code;

  if (isEditing && isDifferentProduct) {
    const confirmed = confirm(
      "현재 공정 정보를 작성 중입니다.\n제품을 변경하시겠습니까?",
    );
    if (!confirmed) {
      return;
    }
  }

  // ✅ 제품 변경 실행
  selectedProductCode.value = found.product_code;
};

const resetSearch = () => {
  search.value = {
    product_code: "",
    product_name: "",
    product_stand: "",
  };
  selectedProductCode.value = "";
  processes.value = [];
};

const processIntList = ref<{ process_int: string; process_name: string }[]>([]);

const fetchProcessInt = async () => {
  try {
    const res = await axios.get("/processInit"); // 공정명 리스트 API
    processIntList.value = res.data; // 👈 객체 배열 유지
  } catch (err) {
    console.error("❌ 공정 기본 목록 불러오기 실패:", err);
  }
};

const fetchProducts = async () => {
  try {
    const res = await axios.get("/product");
    products.value = res.data;
  } catch (err) {
    console.log("❌ 제품 목록 조회 실패:", err);
  }
};

const fetchEquipmentCodes = async () => {
  try {
    const res = await axios.get("/common-codes/?groups=0T");
    equipmentCodes.value = res.data["0T"] || [];
  } catch (err) {
    console.error("❌ 설비유형 불러오기 실패:", err);
  }
};

const fetchMaterials = async () => {
  try {
    const res = await axios.get(`/bom/processList/${popupProductCode.value}`);

    materialOptions.value = res.data;
    bomCode.value = res.data[0].bom_code;
    console.log("자재:", res.data);
  } catch (err) {
    console.log("❌ 자재 목록 조회 실패:", err);
  }
};

const fetchProcess = async () => {
  try {
    const res = await axios.get(`/process/${selectedProductCode.value}`);
    const fetched = res.data;

    // process_int 역추적
    processes.value = fetched.map((item: any) => {
      const match = processIntList.value.find(
        (pi) => pi.process_name === item.process_name,
      );
      return {
        process_code: item.process_code,
        process_time: item.process_time,
        process_name: item.process_name,
        code_value: item.code_value,
        process_int: match?.process_int || "", // 없으면 빈값 처리
        selected: false,
      };
    });
  } catch (err) {
    console.log("❌ 공정정보 조회 실패:", err);
  }
};

const fetchProcessDetail = async () => {
  try {
    const res = await axios.get(`/processDetail/${popupProcessCode.value}`);
    const fetchedDetails = res.data;

    // material_code 기준으로 name, unit 채워 넣기
    materialList.value = fetchedDetails.map((item: any) => {
      const matched = materialOptions.value.find(
        (opt) => opt.material_code === item.material_code,
      );

      return {
        process_code: item.process_code || popupProcessCode.value,
        material_code: item.material_code,
        BOM_code: item.BOM_code || "", // 필요 시
        usage_qty: item.usage_qty,
        responsible: item.name,
        material_name: matched?.material_name || "",
        material_unit: matched?.material_unit || "",
        selected: false,
      };
    });
  } catch (err) {
    console.log("❌ 상세정보 조회 실패:", err);
  }
};

watch(popupProcessCode, (newCode) => {
  if (newCode) {
    fetchProcessDetail();
  }
});

watch(selectedProductCode, (newCode) => {
  if (newCode) {
    fetchProcess();
  }
});

const onMaterialCodeChange = (row: MaterialRow) => {
  const selected = materialOptions.value.find(
    (m) => m.material_code === row.material_code,
  );
  if (selected) {
    row.material_name = selected.material_name;
    row.material_unit = selected.material_unit;
    row.usage_qty = selected.usage_qty;
  }
};

const totalProcessTime = computed(() => {
  return processes.value.reduce((sum, p) => {
    const time = parseInt(p.process_time.replace(/[^\d]/g, ""));
    return sum + (isNaN(time) ? 0 : time);
  }, 0);
});

const addProcess = () => {
  processes.value.push({
    process_code: "",
    process_time: "",
    process_name: "",
    code_value: "",
    process_int: "",
    selected: false,
  });
};

const deleteSelectedProcesses = async () => {
  for (const p of processes.value) {
    if (p.selected && p.process_code) {
      try {
        await axios.delete(`/process/${p.process_code}`);
        console.log(`🗑️ 서버에서 공정 삭제 완료: ${p.process_code}`);
      } catch (err) {
        console.error(`❌ 공정 삭제 실패: ${p.process_code}`, err);
        alert(`공정 ${p.process_code} 삭제 실패!`);
      }
    }
  }
  // ✅ 선택된 항목은 모두 제거 (등록 전/후 상관없이)
  processes.value = processes.value.filter((p) => !p.selected);
};

const addMaterial = () => {
  materialList.value.push({
    process_code: "",
    material_code: "",
    material_name: "",
    material_unit: "",
    BOM_code: "",
    usage_qty: 0,
    responsible: "",
    selected: false,
  });
};

const deleteSelectedMaterials = async () => {
  for (const row of materialList.value) {
    console.log("✅ 삭제 후보:", row); // 이 로그로 값 제대로 들어오는지 확인
    if (row.selected && row.process_code && row.material_code) {
      try {
        await axios.delete(
          `/processDetail/${row.process_code}/${row.material_code}`,
        );
      } catch (err) {}
    }
  }
  materialList.value = materialList.value.filter((row) => !row.selected);
};

const saveMaterial = async (): Promise<void> => {
  // 현재 공정에 해당하는 모든 자재 먼저 삭제
  try {
    await axios.delete(`/processDetail/${popupProcessCode.value}`);
    console.log(`✅ ${popupProcessCode.value} 에 해당하는 기존 자재 삭제 완료`);
  } catch (err) {
    console.error("❌ 기존 자재 삭제 실패:", err);
    alert("기존 자재 삭제 중 오류 발생!");
    return;
  }

  // 새로운 자재 저장 (삭제 후 insert)
  const payload = materialList.value.map((p) => ({
    process_code: popupProcessCode.value,
    material_code: p.material_code,
    BOM_code: bomCode.value,
    name: p.responsible,
  }));

  console.log("📦 저장할 재료 데이터:", payload);

  try {
    const res = await axios.post(`/process/${popupProcessCode.value}`, payload);
    if (res.data.isSuccessed === true) {
      alert("모든 재료 등록 완료!");
      await fetchProcessDetail();
    } else {
      alert("등록 실패!");
    }
  } catch (err) {
    console.error("❌ 자재 등록 실패:", err);
    alert("서버 오류 발생!");
  }
};

const saveProcesses = async (): Promise<void> => {
  const insertList: ProcessPayload[] = [];
  const updateList: ProcessPayload[] = [];

  const group_code = `${selectedProductCode.value}-Process`;
  const groupItem: ProcessGroupPayload = {
    process_group_code: group_code,
    product_code: selectedProductCode.value,
  };

  processes.value.forEach((p, idx) => {
    const code = `${selectedProductCode.value}Process${idx + 1}`;

    // 🧠 process_int로부터 process_name 동기화
    const matched = processIntList.value.find(
      (item) => item.process_int === p.process_int,
    );
    const name = matched?.process_name || "";

    const payload: ProcessPayload = {
      process_code: code,
      process_name: name,
      process_time: p.process_time,
      process_seq: idx + 1,
      code_value: p.code_value,
      product_code: selectedProductCode.value,
      process_group_code: group_code,
      process_int: p.process_int,
    };

    if (!p.process_code) {
      insertList.push(payload);
    } else {
      updateList.push(payload);
    }
  });

  try {
    const groupCheckRes = await axios.get(`/processG/${group_code}`);
    const groupExists =
      Array.isArray(groupCheckRes.data) && groupCheckRes.data.length > 0;

    if (insertList.length > 0) {
      if (!groupExists) {
        const groupRes = await axios.post("/processG", groupItem);
        if (!groupRes.data.isSuccessed) throw new Error("공정 그룹 등록 실패");
      }

      const processRes = await axios.post("/process", insertList);
      if (!processRes.data.isSuccessed) throw new Error("공정 등록 실패");
    }

    for (const payload of updateList) {
      try {
        const res = await axios.put(`/process/${payload.process_code}`, [
          payload,
        ]);
        if (!res.data.isSuccessed) {
          console.warn(`⚠️ 수정 실패: ${payload.process_code}`);
        }
      } catch (err) {
        console.error(`❌ 수정 중 오류: ${payload.process_code}`, err);
        alert(`공정 수정 중 오류 발생: ${payload.process_code}`);
      }
    }

    alert("공정 저장 완료!");
    await fetchProcess();
  } catch (err) {
    console.error("❌ 저장 실패:", err);
    alert("저장 중 오류 발생!");
  }
};

const openPopup = (processCode: string, productCode: string): void => {
  popupProcessCode.value = processCode;
  popupProductCode.value = productCode;
  popupVisible.value = true;
  fetchMaterials();
};

const handlePopupOpen = (processCode: string, index: number): void => {
  if (!processCode) {
    alert("공정을 먼저 저장해야 상세정보를 추가할 수 있습니다.");
    return;
  }

  const fullCode = `${selectedProductCode.value}Process${index + 1}`;
  openPopup(fullCode, selectedProductCode.value);
};

onMounted(() => {
  fetchProducts();
  fetchEquipmentCodes();
  fetchMaterials();
  fetchProcess();
  fetchProcessInt();
});
</script>

<style scoped>
.process-page {
  padding: 30px;
  font-family: "Pretendard", sans-serif;
  background: #fff;
}

.times {
  text-align: center;
}

h3 {
  font-size: 24px;
  font-weight: bold;
}

h2.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.product-select {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.product-label {
  font-size: 14px;
  color: #333;
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

.btn.let {
  background-color: #535658;
  color: white;
}

.btn.delete {
  background-color: #eb5757;
  color: white;
}

.btn.add {
  background-color: #2f80ed;
  color: white;
  font-weight: 500;
}

.process-table .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.process-table table {
  width: 100%;
  border-collapse: collapse;
}

.process-table th,
.process-table td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: center;
  font-size: 14px;
}

.time-input,
.name-input,
.equipment-select {
  width: 100%;
  padding: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.btn.search {
  background-color: #27ae60;
  color: white;
}

.btn.reset {
  background-color: #7f8c8d;
  color: white;
}
</style>
