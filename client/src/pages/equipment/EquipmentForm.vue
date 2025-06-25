<template>
  <div class="equipment-form-page">
    <h1 class="va-h3 mb-6">{{ pageTitle }}</h1>

    <VaForm
      ref="formRef"
      :key="formKey"
      v-slot="{ isValid }"
      class="max-w-5xl mx-auto p-6 flex flex-col gap-6 bg-white shadow rounded"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="w-40 h-40 border rounded flex items-center justify-center bg-gray-100 overflow-hidden"
        >
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="object-contain max-w-full max-h-full"
          />
          <span v-else class="text-gray-500">이미지 미리보기</span>
        </div>
        <VaFileUpload
          ref="fileUploadRef"
          type="single"
          hide-file-list
          @update:modelValue="onImageSelected"
        >
          <template #default>
            <VaButton size="small">파일 선택</VaButton>
          </template>
        </VaFileUpload>
      </div>

      <VaInput
        v-model="formData.id"
        label="설비 번호"
        readonly
        placeholder="등록 시 자동 생성됩니다"
        :inputClass="'bg-gray-100'"
        class="va-label-lg"
      />

      <VaSelect
        v-model="formData.baseName"
        label="설비명"
        :options="codeOptions.eq_base_name"
        :rules="[requiredRule]"
        value-by="value"
        text-by="label"
        class="va-label-lg"
        @update:modelValue="onBaseNameChange"
      />

      <div class="grid grid-cols-3 gap-4 va-label-lg">
        <VaSelect
          v-model="formData.category"
          label="설비 분류"
          :options="codeOptions.eq_group"
          :rules="[requiredRule]"
          value-by="value"
          text-by="label"
          :disabled="!formData.baseName"
          placeholder="설비명을 먼저 선택해주세요"
        />
        <VaSelect
          v-model="formData.type"
          label="설비 세부 유형"
          :options="filteredEqTypes"
          :rules="[requiredRule]"
          value-by="value"
          text-by="label"
          :disabled="!formData.baseName"
          placeholder="설비명을 먼저 선택해주세요"
        />
        <VaSelect
          v-model="formData.installType"
          label="도입 유형"
          :options="codeOptions.eq_import"
          :rules="[requiredRule]"
          value-by="value"
          text-by="label"
        />
      </div>

      <VaSelect
        v-if="formData.category === 'e3'"
        v-model="formData.line"
        label="생산 라인"
        :options="codeOptions.line"
        :rules="[requiredRule]"
        value-by="value"
        text-by="label"
        class="va-label-lg"
      />

      <div class="grid grid-cols-3 gap-4 va-label-lg">
        <VaSelect
          v-model="formData.factory"
          label="공장"
          :options="codeOptions.factory"
          :rules="[requiredRule]"
          value-by="value"
          text-by="label"
        />
        <VaSelect
          v-if="formData.factory"
          v-model="formData.floor"
          label="층"
          :options="codeOptions.floor"
          :rules="[requiredRule]"
          value-by="value"
          text-by="label"
        />
        <VaSelect
          v-if="formData.floor"
          v-model="formData.room"
          label="공정실"
          :options="codeOptions.room"
          :rules="[requiredRule]"
          value-by="value"
          text-by="label"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 va-label-lg">
        <VaDateInput
          v-model="formData.manufactureDate"
          label="설비 제조일"
          :rules="[requiredRule]"
          clearable
        />
        <VaInput
          v-model="formData.registerDate"
          label="설비 등록일"
          readonly
          :inputClass="'bg-gray-100'"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 va-label-lg">
        <VaInput
          v-model="formData.maker"
          label="제조사"
          :rules="[requiredRule]"
        />
        <VaInput
          v-model="formData.model"
          label="모델명"
          :rules="[requiredRule]"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 va-label-lg">
        <VaInput
          v-model="formData.serial"
          label="제조번호 (Serial No.)"
          :rules="[requiredRule]"
        />
        <div class="relative">
          <VaInput
            v-model="formData.power"
            label="정격 전력"
            :rules="[requiredRule]"
            :inputClass="'pr-12'"
            class="w-full"
          />
          <span
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"
            >kW</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 va-label-lg">
        <div class="relative">
          <VaInput
            v-model="formData.maxRuntime"
            label="최대 가동 시간"
            :rules="[requiredRule]"
            :inputClass="'pr-12'"
            class="w-full"
          />
          <span
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"
            >시간</span
          >
        </div>
        <div class="relative">
          <VaInput
            v-model="formData.maintenanceCycle"
            label="정기 점검 주기"
            :rules="[requiredRule]"
            :inputClass="'pr-12'"
            class="w-full"
          />
          <span
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"
            >일</span
          >
        </div>
      </div>

      <VaTextarea
        v-model="formData.note"
        label="비고"
        placeholder="특이사항이 있다면 입력해 주세요"
        class="va-label-lg"
      />

      <div class="flex justify-center gap-4 mt-6">
        <VaButton
          :disabled="!isValid"
          :color="mode === 'edit' ? 'warning' : 'primary'"
          @click="handleSubmit"
        >
          {{ mode === "edit" ? "수정" : "등록" }}
        </VaButton>
        <VaButton color="secondary" @click="handleReset">초기화</VaButton>
      </div>
    </VaForm>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

interface CodeOption {
  label: string;
  value: string;
}

interface FormData {
  image: File[];
  id: string;
  baseName: string;
  name: string;
  category: string;
  line: string;
  type: string;
  factory: string;
  floor: string;
  room: string;
  installType: string;
  manufactureDate: string | null;
  registerDate: string;
  maker: string;
  model: string;
  serial: string;
  power: string;
  maxRuntime: string;
  maintenanceCycle: string;
  note: string;
}

interface ApiResponse {
  isSuccessed: boolean;
  data?: any;
  message?: string;
}

interface CommonCodesResponse {
  [key: string]: CodeOption[];
}

const route = useRoute();
const router = useRouter();

const formRef = ref<any>();
const fileUploadRef = ref<any>();
const previewUrl = ref<string>("");
const existingImage = ref<string>("");

const equipmentTypeMapping: Record<string, string[]> = {
  a1: ["t1"],
  a2: ["t2"],
  a3: ["t3"],
  a4: ["t4"],
  a5: ["t5"],
  a6: ["t7"],
  a7: ["t7"],
  a8: ["t7"],
  a9: ["t8"],
  a10: ["t8"],
  a11: ["t8"],
  a12: ["t8"],
  a13: ["t6"],
  a14: ["t6"],
  a15: ["t6"],
  a16: ["t6"],
  a17: ["t6"],
  a18: ["t6"],
  a19: ["t6"],
};

const mode = computed(() => {
  return route.params.id || (route.query.mode === "edit" && route.query.eq_id)
    ? "edit"
    : "register";
});

const equipmentId = computed(() => {
  return (route.params.id as string) || (route.query.eq_id as string);
});

const pageTitle = computed(() => {
  return mode.value === "edit" ? "설비 수정" : "설비 등록";
});

const filteredEqTypes = computed(() => {
  if (!formData.value.baseName) return [];
  const allowedTypes = equipmentTypeMapping[formData.value.baseName] || [];
  return codeOptions.value.eq_type.filter((option) =>
    allowedTypes.includes(option.value),
  );
});

const requiredRule = (v: any): string | boolean =>
  !!v || "필수 입력 항목입니다";

const getInitialFormState = (): FormData => ({
  image: [],
  id: "",
  baseName: "",
  name: "",
  category: "",
  line: "",
  type: "",
  factory: "",
  floor: "",
  room: "",
  installType: "",
  manufactureDate: null,
  registerDate: new Date().toISOString().slice(0, 10),
  maker: "",
  model: "",
  serial: "",
  power: "",
  maxRuntime: "",
  maintenanceCycle: "",
  note: "",
});

const formData = ref<FormData>(getInitialFormState());
const formKey = ref(0);

const codeOptions = ref({
  factory: [],
  floor: [],
  room: [],
  eq_group: [],
  eq_type: [],
  eq_import: [],
  eq_base_name: [],
  line: [],
} as Record<string, CodeOption[]>);

const onBaseNameChange = (newBaseName: string) => {
  formData.value.type = "";
  if (newBaseName) {
    if (["a1", "a2", "a3", "a4", "a5"].includes(newBaseName))
      formData.value.category = "e1";
    else if (
      ["a6", "a7", "a8", "a9", "a10", "a11", "a12"].includes(newBaseName)
    )
      formData.value.category = "e2";
    else if (
      ["a13", "a14", "a15", "a16", "a17", "a18", "a19"].includes(newBaseName)
    )
      formData.value.category = "e3";
    const allowedTypes = equipmentTypeMapping[newBaseName] || [];
    if (allowedTypes.length === 1) formData.value.type = allowedTypes[0];
  }
};

const onImageSelected = (files: any) => {
  const file = Array.isArray(files) ? files[0] : files;
  if (file instanceof File) {
    formData.value.image = [file];
    previewUrl.value = URL.createObjectURL(file);
  }
};

const loadCommonCodes = async () => {
  try {
    const { data: codes }: { data: CommonCodesResponse } = await axios.get(
      "/common-codes?groups=0F,0L,0M,0E,0T,0I,0A,line",
    );
    console.log("Loaded common codes:", codes);
    codeOptions.value = {
      factory: codes["0F"] || [],
      floor: codes["0L"] || [],
      room: codes["0M"] || [],
      eq_group: codes["0E"] || [],
      eq_type: codes["0T"] || [],
      eq_import: codes["0I"] || [],
      eq_base_name: codes["0A"] || [],
      line: codes.line || [],
    };
  } catch (error) {
    console.error("공통코드 로드 실패:", error);
    alert("공통코드를 불러오는데 실패했습니다.");
  }
};

const loadEquipmentData = async (equipmentId: string) => {
  try {
    const res = await axios.get(`/equipments/${equipmentId}`);
    if (res.data.isSuccessed && res.data.data) {
      const equipment = res.data.data;
      const baseName = equipment.eq_name?.replace(/\d+$/, "") || "";
      const baseNameOption = codeOptions.value.eq_base_name.find(
        (o) => o.label === baseName,
      );
      formData.value = {
        image: [],
        id: equipment.eq_id || "",
        baseName: baseNameOption?.value || "",
        name: equipment.eq_name || "",
        category: equipment.eq_group_code || "",
        line: equipment.line_id || "",
        type: equipment.eq_type_code || "",
        factory: equipment.eq_factory_code || "",
        floor: equipment.eq_floor_code || "",
        room: equipment.eq_room_code || "",
        installType: equipment.eq_import_code || "",
        manufactureDate: equipment.eq_manufacture_date || null,
        registerDate:
          equipment.eq_registration_date ||
          new Date().toISOString().slice(0, 10),
        maker: equipment.eq_manufacturer || "",
        model: equipment.eq_model || "",
        serial: equipment.eq_serial_number || "",
        power: equipment.eq_power_spec || "",
        maxRuntime: equipment.eq_max_operation_time?.toString() || "",
        maintenanceCycle: equipment.eq_inspection_cycle?.toString() || "",
        note: equipment.eq_remark || "",
      };
      if (equipment.eq_image) {
        existingImage.value = equipment.eq_image;
        previewUrl.value = `/uploads/equipment/${equipment.eq_image}`;
      }
    }
  } catch (error) {
    console.error("설비 데이터 로드 실패:", error);
    alert("설비 데이터를 불러오는데 실패했습니다.");
  }
};

const resetForm = async () => {
  if (previewUrl.value && !existingImage.value)
    URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  existingImage.value = "";
  formData.value = getInitialFormState();
  formKey.value += 1;
  await nextTick();
  fileUploadRef.value?.reset?.();
  if (mode.value === "edit" && equipmentId.value)
    await loadEquipmentData(equipmentId.value);
};

onMounted(async () => {
  const isEquipmentDept = authStore.user?.department_code === "04";

  if (!isEquipmentDept) {
    alert("설비팀만 접근할 수 있습니다.");
    router.replace({ name: "dashboard" }); // 다른 화면으로 이동
    return;
  }

  await loadCommonCodes();
  if (mode.value === "edit" && equipmentId.value)
    await loadEquipmentData(equipmentId.value);
});

watch(
  [() => route.params.id, () => route.query],
  async ([paramId, query]) => {
    const id = (paramId as string) || (query.eq_id as string);
    if (mode.value === "edit" && id) {
      await loadEquipmentData(id);
    } else if (!id) {
      formData.value = getInitialFormState();
      previewUrl.value = "";
      existingImage.value = "";
    }
  },
  { deep: true },
);

watch(
  () => formData.value.category,
  (newCategory) => {
    if (newCategory !== "e3") formData.value.line = "";
  },
);

const handleSubmit = async () => {
  if (!confirm(`${mode.value === "edit" ? "수정" : "등록"}하시겠습니까?`))
    return;
  if (!formRef.value?.validate()) return;

  try {
    const url =
      mode.value === "edit"
        ? `/equipments/${formData.value.id}`
        : "/equipments";
    const method = mode.value === "edit" ? "put" : "post";
    const submitFormData = new FormData();

    const selectedBaseNameOption = codeOptions.value.eq_base_name.find(
      (o) => o.value === formData.value.baseName,
    );
    const submitData = {
      ...formData.value,
      name: selectedBaseNameOption?.label || formData.value.baseName,
    };

    Object.entries(submitData).forEach(([key, val]) => {
      if (key !== "image" && key !== "baseName" && val !== null && val !== "") {
        submitFormData.append(key, String(val));
      }
    });

    if (
      formData.value.image.length > 0 &&
      formData.value.image[0] instanceof File
    ) {
      submitFormData.append("image", formData.value.image[0]);
    } else if (mode.value === "edit" && existingImage.value) {
      submitFormData.append("existingImage", existingImage.value);
    }

    const res: { data: ApiResponse } = await axios[method](
      url,
      submitFormData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    if (res.data.isSuccessed) {
      alert(`설비 ${mode.value === "edit" ? "수정" : "등록"}에 성공했습니다!`);
      if (mode.value === "register") await resetForm();
      else router.push("/faq/equipment-management");
    } else {
      alert(`실패: ${res.data.message}`);
    }
  } catch (error) {
    console.error(
      `설비 ${mode.value === "edit" ? "수정" : "등록"} 실패:`,
      error,
    );
    alert(`설비 ${mode.value === "edit" ? "수정" : "등록"}에 실패했습니다.`);
  }
};

const handleReset = async () => {
  if (!confirm("정말 초기화하시겠습니까?")) return;
  await resetForm();
};
</script>

<style scoped>
.equipment-form-page {
  padding: 1.5rem;
}

.va-label-lg :deep(.va-input__label),
.va-label-lg :deep(.va-select__label),
.va-label-lg :deep(.va-date-input__label),
.va-label-lg :deep(.va-textarea__label) {
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
