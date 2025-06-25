<template>
  <div class="equipment-detail-page p-6">
    <!-- 제목 -->
    <h1 class="va-h3 mb-4">설비 상세 정보</h1>

    <!-- 버튼 오른쪽 정렬 -->
    <div class="flex justify-end mb-6">
      <div class="flex gap-2">
        <VaButton @click="goBack" color="secondary" class="w-32">목록</VaButton>
        <VaButton color="info" @click="goToFullHistory"
          >점검 이력 조회</VaButton
        >
      </div>
    </div>

    <!-- 이미지 중앙 정렬 -->
    <div class="flex justify-center mb-6">
      <div class="w-full max-w-sm">
        <img
          v-if="equipment.imageUrl"
          :src="equipment.imageUrl"
          class="w-full rounded border"
          @error="onImageError"
        />
        <div
          v-else
          class="w-full h-[300px] flex items-center justify-center rounded border border-gray-300 text-gray-500"
        >
          이미지 없음
        </div>
      </div>
    </div>

    <!-- 정보 카드 중앙 정렬 -->
    <div class="flex justify-center mb-6">
      <div class="w-full max-w-screen-lg grid grid-cols-2 gap-6">
        <div class="col-span-2 flex flex-col gap-6">
          <VaCard>
            <VaCardTitle>설비 기본 정보</VaCardTitle>
            <VaCardContent class="grid grid-cols-2 gap-4">
              <VaInput
                :model-value="equipment.code"
                label="설비번호"
                readonly
              />
              <VaInput :model-value="equipment.name" label="설비명" readonly />

              <!-- 설비 분류 + 설비 유형 -->
              <VaInput
                :model-value="equipment.category"
                label="설비 분류"
                readonly
              />
              <VaInput
                :model-value="equipment.type"
                label="설비 유형"
                readonly
              />

              <!-- 생산 라인 전체 -->
              <VaInput
                :model-value="equipment.line"
                label="생산 라인"
                readonly
                class="col-span-2"
              />

              <!-- 도입 유형 전체 -->
              <VaInput
                :model-value="equipment.installType"
                label="도입 유형"
                readonly
                class="col-span-2"
              />

              <!-- 위치 전체 -->
              <VaInput
                :model-value="equipment.location"
                label="설비 위치"
                readonly
                class="col-span-2"
              />

              <!-- 제조일 + 등록일 -->
              <VaInput
                :model-value="equipment.manufactureDate"
                label="설비 제조일"
                readonly
              />
              <VaInput
                :model-value="equipment.registerDate"
                label="설비 등록일"
                readonly
              />
            </VaCardContent>
          </VaCard>

          <VaCard>
            <VaCardTitle>설비 기술 사양</VaCardTitle>
            <VaCardContent class="grid grid-cols-2 gap-4">
              <VaInput :model-value="equipment.maker" label="제조사" readonly />
              <VaInput
                :model-value="equipment.serial"
                label="제조번호"
                readonly
              />
              <VaInput :model-value="equipment.model" label="모델명" readonly />
              <VaInput
                :model-value="equipment.power"
                label="정격 전력"
                readonly
              />
              <VaInput
                :model-value="equipment.maxRuntime"
                label="최대 가동 시간"
                readonly
              />
              <VaInput
                :model-value="equipment.maintenanceCycle"
                label="정기 점검 주기"
                readonly
              />
            </VaCardContent>
          </VaCard>

          <VaTextarea :model-value="equipment.note" label="비고" readonly />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

interface Equipment {
  code: string;
  name: string;
  category: string;
  line: string;
  type: string;
  location: string;
  installType: string;
  manufactureDate: string;
  registerDate: string;
  maker: string;
  model: string;
  serial: string;
  power: string;
  maxRuntime: string;
  maintenanceCycle: string;
  note: string;
  imageUrl: string;
}

interface CommonCodeItem {
  value: string;
  label: string;
}

interface CommonCodes {
  [key: string]: {
    [key: string]: string;
  };
}

interface EquipmentData {
  eq_id: string;
  eq_name: string;
  eq_group_code: string;
  eq_type_code: string;
  eq_import_code: string;
  eq_factory_code: string;
  eq_floor_code: string;
  eq_room_code: string;
  line_id: string | null;
  eq_manufacture_date: string;
  eq_registration_date: string;
  eq_manufacturer: string;
  eq_model: string;
  eq_serial_number: string;
  eq_power_spec: string;
  eq_max_operation_time: string;
  eq_inspection_cycle: string;
  eq_remark: string | null;
  eq_image: string | null;
}

interface HistoryItem {
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();
const equipmentId = route.params.id as string;

const loading = ref(false);
const activeTab = ref("downtime");

const equipment = ref<Equipment>({
  code: "",
  name: "",
  category: "",
  line: "",
  type: "",
  location: "",
  installType: "",
  manufactureDate: "",
  registerDate: "",
  maker: "",
  model: "",
  serial: "",
  power: "",
  maxRuntime: "",
  maintenanceCycle: "",
  note: "",
  imageUrl: "",
});

const downtimeHistory = ref<HistoryItem[]>([]);
const inspectionHistory = ref<HistoryItem[]>([]);
const cleaningHistory = ref<HistoryItem[]>([]);

const goBack = () => {
  router.push("/faq/equipment-inquiry").catch(() => {
    router.push("/equipments").catch(() => {
      router.push("/facility/equipment").catch(() => {
        router.back();
      });
    });
  });
};

const goToFullHistory = () => {
  router.push(`/faq/equipment-history`);
};

const onImageError = (event: Event) => {
  console.error("이미지 로드 실패:", (event.target as HTMLImageElement).src);
};

const commonCodes = ref<CommonCodes>({});

const loadCommonCodes = async () => {
  try {
    const { data } = await axios.get("/common-codes?groups=0E,0T,0I,0F,0L,0M");
    if (data) {
      Object.keys(data).forEach((group) => {
        if (Array.isArray(data[group])) {
          commonCodes.value[group] = {};
          data[group].forEach((item: CommonCodeItem) => {
            commonCodes.value[group][item.value] = item.label;
          });
        }
      });
    }
  } catch {
    useHardcodedCommonCodes();
  }
};

const useHardcodedCommonCodes = () => {
  commonCodes.value = {
    "0E": { e1: "생산설비", e2: "품질관리설비", e3: "포장설비" },
    "0T": {
      t1: "고속 혼합기",
      t2: "습식 과립기",
      t3: "유동층 건조기",
      t4: "정제 압축기",
      t5: "정제 코팅기",
      t6: "자동 포장기",
      t7: "물리적 검사 장비",
      t8: "분석 장비",
    },
    "0I": { i1: "신규", i2: "교체" },
    "0F": { f1: "1 공장", f2: "2 공장" },
    "0L": { l1: "1 층", l2: "2 층" },
    "0M": {
      m1: "혼합실",
      m2: "과립실",
      m3: "건조실",
      m4: "압축실",
      m5: "코팅실",
      m6: "칭량실",
      m7: "품질검사실",
      m8: "포장실",
    },
  };
};

const getCodeLabel = (
  group: string,
  code: string | null | undefined,
): string => {
  if (!code) return "-";
  return commonCodes.value[group]?.[code] || code || "-";
};

onMounted(async () => {
  loading.value = true;
  try {
    await loadCommonCodes();
    const { data } = await axios.get(`/equipments/${equipmentId}/detail`);
    if (data.isSuccessed && data.data) {
      const eq = data.data.equipment;
      const imageUrl = eq.eq_image ? `/uploads/equipment/${eq.eq_image}` : "";
      equipment.value = {
        code: eq.eq_id || "",
        name: eq.eq_name || "",
        category: getCodeLabel("0E", eq.eq_group_code),
        line: eq.line_id ? `라인 ${eq.line_id}` : "-",
        type: getCodeLabel("0T", eq.eq_type_code),
        location: `${getCodeLabel("0F", eq.eq_factory_code)} ${getCodeLabel(
          "0L",
          eq.eq_floor_code,
        )} ${getCodeLabel("0M", eq.eq_room_code)}`,
        installType: getCodeLabel("0I", eq.eq_import_code),
        manufactureDate: eq.eq_manufacture_date || "",
        registerDate: eq.eq_registration_date || "",
        maker: eq.eq_manufacturer || "",
        model: eq.eq_model || "",
        serial: eq.eq_serial_number || "",
        power: eq.eq_power_spec || "",
        maxRuntime: eq.eq_max_operation_time || "",
        maintenanceCycle: eq.eq_inspection_cycle || "",
        note: eq.eq_remark || "-",
        imageUrl,
      };
      downtimeHistory.value = data.data.downtime?.slice(0, 5) || [];
      inspectionHistory.value = data.data.inspection?.slice(0, 5) || [];
      cleaningHistory.value = data.data.cleaning?.slice(0, 5) || [];
    }
  } catch {
    alert("설비 정보를 불러오는데 실패했습니다.");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.equipment-detail-page img {
  max-height: 300px;
  object-fit: contain;
}

.history-table {
  overflow-x: auto;
}

.va-table {
  border-collapse: collapse;
  margin-top: 1rem;
}

.va-table th,
.va-table td {
  border: 1px solid #e0e0e0;
  padding: 0.5rem;
  text-align: left;
}

.va-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.va-table tr:hover {
  background-color: #f9f9f9;
}
</style>
