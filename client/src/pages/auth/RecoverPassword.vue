<template>
  <VaForm ref="passwordForm" @submit.prevent="submit">
    <h1 class="font-semibold text-4xl mb-4">비밀번호를 잊어버렸나요?</h1>
    <p class="text-base mb-4 leading-5">
      비밀번호를 잊으셨나요? 걱정하지 마세요. 아래에 이메일 주소를 입력해
      주시면, 임시 비밀번호를 이메일로 보내드립니다.
    </p>
    <VaInput
      v-model="email"
      :rules="[(v) => !!v || 'Email field is required']"
      class="mb-4"
      label="이메일 입력"
      type="email"
    />
    <VaButton class="w-full mb-2" @click="submit">
      비밀번호를 보냅니다
    </VaButton>
    <VaButton
      :to="{ name: 'login' }"
      class="w-full"
      preset="secondary"
      @click="submit"
    >
      돌아가기
    </VaButton>
  </VaForm>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useForm } from "vuestic-ui";
import { useRouter } from "vue-router";

const email = ref("");
const form = useForm("passwordForm");
const router = useRouter();

const submit = () => {
  if (form.validate()) {
    router.push({ name: "recover-password-email" });
  }
};
</script>
