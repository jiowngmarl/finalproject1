<template>
  <RouterView />
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

// 앱이 시작될 때 authStore 초기화 (새로고침 시 로그인 상태 복원)
onMounted(async () => {
  try {
    console.log("App.vue - authStore 초기화 시작");
    await authStore.initialize();
    console.log("App.vue - authStore 초기화 완료");
    console.log("App.vue - 로그인 상태:", authStore.isLoggedIn);

    if (authStore.isLoggedIn) {
      console.log("App.vue - 기존 로그인 정보 복원됨:", authStore.displayName);
    }
  } catch (error) {
    console.error("App.vue - authStore 초기화 에러:", error);
  }
});
</script>

<style lang="scss">
#app {
  font-family: "Inter", Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 20rem;
}
</style>
