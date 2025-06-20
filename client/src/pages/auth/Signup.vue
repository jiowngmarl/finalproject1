<template>
  <VaForm ref="form" @submit.prevent="submit">
    <h1 class="font-semibold text-4xl mb-4">회원가입</h1>
    <p class="text-base mb-4 leading-5">
      계정이 이미 있나요?
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary">
        로그인
      </RouterLink>
    </p>
    <VaInput
      v-model="formData.employee_no"
      :rules="[
        (v) => !!v || '사원번호 입력이 요구됩니다.',
        (v) => /.+@.+\..+/.test(v) || 'Employee_no should be valid',
      ]"
      class="mb-4"
      label="사원번호"
      type="employee_no"
    />
    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        ref="password1"
        v-model="formData.password"
        :rules="passwordRules"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="비밀번호"
        messages="비밀번호는 8글자 이상이어야 하며, 최소 1개의 문자, 숫자 및 특수 문자를 포함해야 합니다."
        @click-append-inner.stop="
          isPasswordVisible.value = !isPasswordVisible.value
        "
      >
        <template #appendInner>
          <VaIcon
            :name="
              isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'
            "
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
      <VaInput
        ref="password2"
        v-model="formData.repeatPassword"
        :rules="[
          (v) => !!v || '비밀번호를 다시 입력해주세요',
          (v) => v === formData.password || 'Passwords don\'t match',
        ]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="비밀번호 확인"
        @click-append-inner.stop="
          isPasswordVisible.value = !isPasswordVisible.value
        "
      >
        <template #appendInner>
          <VaIcon
            :name="
              isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'
            "
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
    </VaValue>

    <div class="flex justify-center mt-4">
      <VaButton class="w-full" @click="submit"> 계정 생성 </VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useForm, useToast } from "vuestic-ui";

const { validate } = useForm("form");
const { push } = useRouter();
const { init } = useToast();

const formData = reactive({
  employee_no: "",
  password: "",
  repeatPassword: "",
});

const submit = () => {
  if (validate()) {
    init({
      message: "You've successfully signed up",
      color: "success",
    });
    push({ name: "dashboard" });
  }
};

const passwordRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || "비밀번호 입력이 요구됩니다.",
  (v) => (v && v.length >= 8) || "Password must be at least 8 characters long",
  (v) =>
    (v && /[A-Za-z]/.test(v)) || "Password must contain at least one letter",
  (v) => (v && /\d/.test(v)) || "Password must contain at least one number",
  (v) =>
    (v && /[!@#$%^&*(),.?":{}|<>]/.test(v)) ||
    "Password must contain at least one special character",
];
</script>
