<template>
  <div>
    <h1 class="font-semibold text-4xl mb-4">이메일을 확인해주세요</h1>
    <p class="text-base mb-4 leading-5">
      비밀번호 재설정 안내가 이메일로 발송되었습니다. 받은 편지함과 필요하다면
      스팸함도 함께 확인해 주세요. 추가 도움이 필요하시면 고객 지원팀에 문의해
      주세요.
      <span class="va-link">contact support</span>.
    </p>

    <div class="flex justify-center mt-4">
      <VaButton :to="{ name: 'login' }" class="w-full"
        >로그인 화면으로</VaButton
      >
    </div>
  </div>
</template>

<script lang="ts" setup></script>
