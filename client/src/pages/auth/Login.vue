<template>
  <VaForm ref="form" @submit.prevent="handleLogin">
    <h1 class="font-semibold text-4xl mb-4">로그인</h1>

    <!-- 사원아이디 입력 -->
    <VaInput
      v-model="formData.employee_id"
      :rules="[validators.required]"
      class="mb-4"
      label="사원아이디"
      placeholder="사원아이디를 입력하세요"
      :loading="authStore.isLoading"
      :disabled="authStore.isLoading"
    />

    <!-- 비밀번호 입력 -->
    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="formData.password"
        :rules="[validators.required]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
        :loading="authStore.isLoading"
        :disabled="authStore.isLoading"
        @keyup.enter="handleLogin"
        @click-append-inner.stop="
          isPasswordVisible.value = !isPasswordVisible.value
        "
      >
        <template #appendInner>
          <span class="password-toggle">
            {{ isPasswordVisible.value ? "숨기기" : "보기" }}
          </span>
        </template>
      </VaInput>
    </VaValue>

    <!-- 로그인 버튼 -->
    <div class="flex justify-center mt-4 mb-3">
      <VaButton
        class="w-full"
        :loading="authStore.isLoading"
        :disabled="
          authStore.isLoading || !formData.employee_id || !formData.password
        "
        @click="handleLogin"
      >
        {{ authStore.isLoading ? "로그인 중..." : "로그인" }}
      </VaButton>
    </div>

    <!-- 대시보드로 돌아가기 버튼 -->
    <div class="flex justify-center">
      <VaButton
        preset="secondary"
        color="secondary"
        class="w-full"
        :disabled="authStore.isLoading"
        @click="goToDashboard"
      >
        대시보드로 돌아가기
      </VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "vuestic-ui";
import { useAuthStore } from "@/stores/authStore";

// 컴포넌트 설정
const { validate } = useForm("form");
const router = useRouter();
const authStore = useAuthStore();

// 유효성 검사 규칙
const validators = {
  required: (value: string) => !!value || "필수 입력 항목입니다.",
};

// 상태 관리
const formData = reactive({
  employee_id: "",
  password: "",
});

// 네비게이션 함수
const goToDashboard = () => {
  router.push({ name: "dashboard" });
};

// 로그인 처리 함수
const handleLogin = async () => {
  // 폼 유효성 검사
  if (!(await validate())) return;

  console.log("로그인 시도:", formData.employee_id);

  // Pinia 스토어의 login 함수 사용
  const result = await authStore.login(formData.employee_id, formData.password);

  if (result.success) {
    console.log("로그인 성공, 대시보드로 이동");
    // 성공 시 대시보드로 이동
    setTimeout(() => {
      router.push({ name: "dashboard" });
    }, 2000);
  } else {
    console.log("로그인 실패:", result.message);
    // 실패 시 비밀번호 필드만 초기화
    formData.password = "";
  }
};

// 컴포넌트 초기화
onMounted(async () => {
  console.log("Login.vue 마운트됨");

  // 스토어 초기화 (axios 설정, 인증 상태 확인 등)
  await authStore.initialize();
  console.log("Login.vue - authStore 초기화 완료");
  console.log("Login.vue - 현재 로그인 상태:", authStore.isLoggedIn);

  // 이미 로그인된 경우 대시보드로 이동
  if (authStore.isLoggedIn) {
    console.log("이미 로그인되어 있음, 대시보드로 이동");
    router.push({ name: "dashboard" });
  }
});
</script>

<style scoped>
.va-form:has(.va-input--loading) {
  opacity: 0.8;
  pointer-events: none;
}

.va-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.password-toggle {
  color: #6c757d;
  font-size: 14px;
  padding: 4px 8px;
  display: inline-block;
  white-space: nowrap;
  line-height: 1;
  min-width: 40px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #495057;
}
</style>
