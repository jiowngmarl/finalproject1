<template>
  <div class="profile-dropdown-wrapper">
    <VaDropdown v-model="isShown" class="profile-dropdown" stick-to-edges>
      <template #anchor>
        <VaButton
          preset="secondary"
          color="textPrimary"
          class="profile-dropdown__button"
        >
          <span class="profile-dropdown__anchor">
            <VaAvatar
              v-if="authStore.isLoggedIn && authStore.user?.profile_img"
              :src="authStore.user.profile_img"
              :size="14"
              class="mr-1"
            />
            <VaIcon
              v-else
              :name="authStore.isLoggedIn ? 'account_circle' : 'person'"
              class="mr-1"
              size="14"
            />
            {{ authStore.displayName }}
            <VaIcon name="expand_more" class="ml-1" size="12" />
          </span>
        </VaButton>
      </template>

      <VaDropdownContent
        class="profile-dropdown__content w-50 p-0 m-0"
        :style="{
          '--hover-color': hoverColor,
          height: 'auto',
          'min-height': '40px',
          'max-height': '50px',
          overflow: 'visible',
          padding: '0',
          margin: '0',
        }"
      >
        <!-- 로그인된 상태 -->
        <template v-if="authStore.isLoggedIn">
          <!-- 로그아웃 버튼만 (큰 크기) -->
          <div
            class="menu-item cursor-pointer hover:bg-gray-50 flex items-center justify-center"
            style="
              font-size: 16px;
              line-height: 1.2;
              gap: 8px;
              white-space: nowrap;
              height: 40px;
              min-height: 40px;
              padding: 8px 16px;
              margin: 0;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            "
            @click="handleLogout"
          >
            <VaIcon name="logout" size="18" color="secondary" />
            로그아웃
          </div>
        </template>

        <!-- 로그인 안된 상태 -->
        <template v-else>
          <div
            class="menu-item cursor-pointer hover:bg-gray-50 flex items-center justify-center"
            style="
              font-size: 16px;
              line-height: 1.2;
              gap: 8px;
              white-space: nowrap;
              height: 40px;
              min-height: 40px;
              padding: 8px 16px;
              margin: 0;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            "
            @click="goToLogin"
          >
            <VaIcon name="login" size="18" color="primary" />
            로그인
          </div>
        </template>
      </VaDropdownContent>
    </VaDropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useColors } from "vuestic-ui";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

// ================================
// 🔧 컴포넌트 설정
// ================================
const { colors, setHSLAColor } = useColors();
const hoverColor = computed(() => setHSLAColor(colors.focus, { a: 0.1 }));
const router = useRouter();

// ================================
// 🎯 상태 관리 (Pinia 스토어 사용)
// ================================
const authStore = useAuthStore();
const isShown = ref(false);

// ================================
// 🚪 네비게이션 함수들
// ================================
const goToLogin = () => {
  isShown.value = false;
  router.push({ name: "login" });
};

const handleLogout = async () => {
  isShown.value = false;
  await authStore.logout(router); // router를 매개변수로 전달
};
</script>

<style lang="scss">
.profile-dropdown {
  cursor: pointer;

  &__button {
    padding: 2px 6px !important;
    min-height: 28px !important;
    height: 28px !important;
    font-size: 12px !important;
  }

  &__content {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    min-width: 0 !important;
    min-height: 40px !important;
    height: auto !important;
    max-height: 50px !important;

    /* 강력한 선택자로 모든 VaDropdown 요소 제어 */
    &,
    & > *,
    & > * > *,
    & .va-dropdown-content,
    & .va-dropdown-content__content,
    & .va-dropdown__content,
    & .va-list,
    & .va-list-item {
      padding: 0 !important;
      margin: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      line-height: 1.2 !important;
    }

    .menu-item {
      transition: background-color 0.1s !important;
      margin: 0 !important;
      line-height: 1.2 !important;
      border: none !important;
      height: 40px !important;
      min-height: 40px !important;
      max-height: 40px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 8px 16px !important;
      visibility: visible !important;
      opacity: 1 !important;
      font-size: 16px !important;

      &:hover {
        background-color: #f1f5f9 !important;
      }
    }
  }

  &__anchor {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    gap: 2px;
  }
}

// 더 구체적인 선택자로 패딩 강제 적용
.profile-dropdown .menu-item {
  padding: 1px 3px !important;
}

/* 더 구체적인 선택자로 패딩 강제 적용 */
.profile-dropdown .menu-item {
  padding: 3px 6px !important;
  height: 24px !important;
  min-height: 24px !important;
  max-height: 24px !important;
  display: flex !important;
  align-items: center !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* VaDropdown 전역 오버라이드 */
.va-dropdown-content {
  &.profile-dropdown__content {
    min-height: 50px !important;
    height: auto !important;
    max-height: 60px !important;
    overflow: visible !important;

    .va-dropdown-content__content {
      min-height: 50px !important;
      height: auto !important;
      max-height: 60px !important;
      padding: 0 !important;
      overflow: visible !important;
    }
  }
}

/* 업데이트된 패딩 클래스들 - 큰 크기용 */
.px-4 {
  padding-left: 16px !important;
  padding-right: 16px !important;
}

.py-2 {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

/* 기존 작은 크기 패딩들 */
.px-1 {
  padding-left: 3px !important;
  padding-right: 3px !important;
}

.py-0\.5 {
  padding-top: 1px !important;
  padding-bottom: 1px !important;
}

.px-2 {
  padding-left: 4px !important;
  padding-right: 4px !important;
}

.py-1 {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.px-3 {
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.py-1\.5 {
  padding-top: 3px !important;
  padding-bottom: 3px !important;
}

/* 극소 마진 */
.mr-1 {
  margin-right: 2px !important;
}

.ml-1 {
  margin-left: 2px !important;
}

.border-gray-200 {
  border-color: #e5e7eb;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-gray-500 {
  color: #6b7280;
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.min-w-0 {
  min-width: 0;
}

.flex-1 {
  flex: 1 1 0%;
}

.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}
</style>
