<template>
  <div class="package-line-container">
    <!-- 1단계: 포장 타입 선택 -->
    <div
      v-if="currentStep === 'package-type-selection'"
      class="package-type-selection"
    >
      <nav class="breadcrumb">
        <span class="breadcrumb-item">홈</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">포장</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">포장 직접 수행</span>
      </nav>

      <div class="header-section">
        <h1>포장 라인 선택</h1>
        <p>작업할 포장 유형을 선택해주세요</p>

        <!--  동적 완료 알림 메시지 -->
        <div
          v-if="showCompletionMessage"
          class="completion-alert"
          :class="completionMessageType"
        >
          {{ completionMessage }}
        </div>
      </div>

      <div class="package-type-cards">
        <!-- 내포장 카드 -->
        <div
          class="package-type-card"
          :class="{ completed: completedSteps.includes('INNER') }"
          @click="selectPackageType('INNER')"
        >
          <h3>내포장</h3>
          <p>정제를 PTP/병에 포장하는 작업</p>
          <div v-if="completedSteps.includes('INNER')" class="completion-badge">
            ✅ 작업완료
            <div class="completion-time">
              {{ formatTime(innerCompletionTime) }}
            </div>
          </div>
          <button
            v-else
            class="selection-button available"
            @click.stop="selectPackageType('INNER')"
          >
            작업 시작하기
          </button>
        </div>

        <!-- 외포장 카드 -->
        <div
          class="package-type-card"
          :class="{
            completed: completedSteps.includes('OUTER'),
            disabled: !completedSteps.includes('INNER'),
            highlighted:
              completedSteps.includes('INNER') &&
              !completedSteps.includes('OUTER'),
          }"
          @click="selectPackageType('OUTER')"
        >
          <h3>외포장</h3>
          <p>내포장된 제품을 박스에 포장하는 작업</p>
          <div v-if="completedSteps.includes('OUTER')" class="completion-badge">
            ✅ 작업완료
            <div class="completion-time">
              {{ formatTime(outerCompletionTime) }}
            </div>
          </div>
          <button
            v-else-if="completedSteps.includes('INNER')"
            class="selection-button available highlighted"
            @click.stop="selectPackageType('OUTER')"
          >
            다음 단계 진행
          </button>
          <button v-else class="selection-button disabled" disabled>
            내포장 완료 후 선택 가능
          </button>
        </div>
      </div>

      <div class="navigation-actions">
        <button @click="goBackToLineAdd" class="back-btn secondary">
          라인 관리로 이동
        </button>
      </div>

      <!-- 완료된 작업 요약 -->
      <div v-if="completedSteps.length > 0" class="completion-summary">
        <h4>완료된 작업</h4>
        <div class="completed-items">
          <div v-if="completedSteps.includes('INNER')" class="completed-item">
            <div class="item-content">
              <span class="item-title">내포장 완료</span>
              <span class="item-work"
                >작업번호: {{ innerWorkNo || "작업번호없음" }}</span
              >
            </div>
            <span class="time">{{ formatTime(innerCompletionTime) }}</span>
          </div>
          <div v-if="completedSteps.includes('OUTER')" class="completed-item">
            <div class="item-content">
              <span class="item-title">외포장 완료</span>
              <span class="item-work"
                >작업번호: {{ outerWorkNo || "작업번호없음" }}</span
              >
            </div>
            <span class="time">{{ formatTime(outerCompletionTime) }}</span>
          </div>
        </div>

        <!-- 모든 작업 완료시 -->
        <div
          v-if="
            completedSteps.includes('INNER') && completedSteps.includes('OUTER')
          "
          class="all-complete-section"
        >
          <div class="all-complete-message">
            🎉 모든 포장 작업이 완료되었습니다!
          </div>
          <div class="complete-summary-info">
            <p>총 작업시간: {{ getTotalWorkTime() }}</p>
            <p>
              처리된 작업: 내포장({{ innerWorkNo }}) + 외포장({{ outerWorkNo }})
            </p>
          </div>
          <button @click="resetAllSteps" class="reset-btn">
            새 작업 시작하기
          </button>
        </div>
      </div>
    </div>

    <!-- 2단계: 라인 선택 -->
    <div v-if="currentStep === 'line-selection'" class="line-selection">
      <nav class="breadcrumb">
        <span class="breadcrumb-item">홈</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">포장</span>
        <span class="breadcrumb-separator">/</span>
        <span
          class="breadcrumb-item"
          @click="goBackToPackageTypeSelection"
          style="cursor: pointer; color: #3b82f6"
        >
          포장 타입 선택
        </span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active"
          >{{ getLineTypeText(selectedPackageType) }} 라인 선택</span
        >
      </nav>

      <div class="header-section">
        <h1>{{ getLineTypeText(selectedPackageType) }} 라인 선택</h1>
        <p>
          사용 가능한 {{ getLineTypeText(selectedPackageType) }} 라인을 선택하여
          작업을 시작하세요
        </p>

        <!--  단계별 진행 표시 -->
        <div class="workflow-progress">
          <div
            class="progress-step"
            :class="{
              completed: completedSteps.includes('INNER'),
              active: selectedPackageType === 'INNER',
            }"
          >
            <div class="step-text">내포장</div>
          </div>
          <div class="progress-arrow">-></div>
          <div
            class="progress-step"
            :class="{
              completed: completedSteps.includes('OUTER'),
              active: selectedPackageType === 'OUTER',
            }"
          >
            <div class="step-text">외포장</div>
          </div>
        </div>

        <!-- 내포장 완료 시 외포장 안내 -->
        <div
          v-if="
            selectedPackageType === 'OUTER' && completedSteps.includes('INNER')
          "
          class="next-step-guide"
        >
          <div class="guide-content">
            <h4>내포장 작업이 완료되었습니다!</h4>
            <p>이제 외포장 라인을 선택하여 최종 포장 작업을 진행해주세요.</p>
            <div class="guide-details">
              <span>완료된 내포장 작업: {{ innerWorkNo }}</span>
              <span>완료 시간: {{ formatTime(innerCompletionTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 필터 및 검색 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label>라인 타입</label>
            <select v-model="lineTypeFilter" class="filter-select">
              <option value="">전체</option>
              <option value="INNER">내포장</option>
              <option value="OUTER">외포장</option>
            </select>
          </div>
          <div class="filter-group">
            <label>라인 상태</label>
            <select v-model="lineStatusFilter" class="filter-select">
              <option value="">전체</option>
              <option value="s1">가동 중</option>
              <option value="s2">가동대기 중</option>
              <option value="s3">정지</option>
            </select>
          </div>
          <div class="filter-group">
            <label>검색</label>
            <input
              v-model="searchText"
              type="text"
              placeholder="라인명으로 검색"
              class="filter-input"
            />
          </div>
          <button @click="clearAllFilters" class="filter-reset-btn">
            필터 초기화
          </button>
        </div>
      </div>

      <!-- 로딩 및 에러 상태 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>라인 정보를 불러오는 중...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchLines" class="retry-btn">다시 시도</button>
      </div>

      <!-- 라인 목록 -->
      <div v-else-if="filteredLines.length === 0" class="empty-state">
        <h3>조건에 맞는 라인이 없습니다</h3>
        <p>필터 조건을 변경해 주세요</p>
        <button @click="clearAllFilters" class="retry-btn">필터 초기화</button>
      </div>

      <div v-else class="lines-grid">
        <div
          v-for="line in filteredLines"
          :key="line.line_id"
          class="line-card"
          :class="{
            available: line.line_state === 's2',
            working: line.line_state === 's1',
            stopped: line.line_state === 's3',
            recommended: isRecommendedLine(line),
          }"
        >
          <div class="line-header">
            <h3 class="line-name">{{ line.line_name }}</h3>
            <div v-if="isRecommendedLine(line)" class="recommended-badge"></div>
          </div>

          <div class="line-status">
            <span class="status-badge" :class="line.line_state">
              {{ getStatusText(line.line_state) }}
            </span>
          </div>

          <div class="line-details">
            <div class="detail-row">
              <span class="label">타입:</span>
              <span class="value">{{ getLineTypeText(line.line_type) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">라인 ID:</span>
              <span class="value">{{ line.line_id }}</span>
            </div>
            <div class="detail-row">
              <span class="label">설비명:</span>
              <span class="value">{{ line.eq_name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">제품번호:</span>
              <span class="value">{{ line.product_code }}</span>
            </div>
            <div class="detail-row">
              <span class="label">제품명:</span>
              <span class="value">{{ line.product_name }}</span>
            </div>
            <div v-if="line.curr_work_no" class="detail-row">
              <span class="label">작업번호:</span>
              <span class="value">{{ line.curr_work_no }}</span>
            </div>
          </div>

          <div class="line-actions">
            <button
              v-if="line.line_state === 's2'"
              class="action-btn start"
              :class="{ recommended: isRecommendedLine(line) }"
              @click="startPackagingWork(line)"
            >
              {{ isRecommendedLine(line) ? "작업 시작" : "작업 시작" }}
            </button>
            <button
              v-else-if="line.line_state === 's1'"
              class="action-btn continue"
              @click="continuePackagingWork(line)"
            >
              작업 계속
            </button>
            <button
              v-else-if="line.line_state === 's3'"
              disabled
              class="action-btn stopped"
            >
              정지
            </button>
            <button v-else disabled class="action-btn stopped">
              알 수 없음
            </button>
          </div>
        </div>
      </div>

      <!-- 뒤로가기 -->
      <div class="navigation-actions">
        <button @click="goBackToPackageTypeSelection" class="back-btn">
          포장 타입 선택으로 돌아가기
        </button>
        <button @click="goBackToLineAdd" class="back-btn secondary">
          라인 관리로 이동
        </button>
      </div>
    </div>

    <!-- 작업 시작 확인 모달 -->
    <div v-if="showStartModal" class="modal-overlay" @click="closeStartModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ getWorkStartTitle() }}</h3>
          <button @click="closeStartModal" class="modal-close">닫기</button>
        </div>
        <div class="modal-body">
          <div class="line-info">
            <h4>{{ selectedLineForStart?.line_name }}</h4>
            <p><strong>라인 ID:</strong> {{ selectedLineForStart?.line_id }}</p>
            <p>
              <strong>타입:</strong>
              {{ getLineTypeText(selectedLineForStart?.line_type) }}
            </p>
            <p>
              <strong>제품번호:</strong>
              {{ selectedLineForStart?.product_code }}
            </p>
            <p>
              <strong>제품명:</strong> {{ selectedLineForStart?.product_name }}
            </p>
          </div>

          <!--  워크플로우 정보 표시 -->
          <div
            v-if="
              selectedPackageType === 'OUTER' &&
              completedSteps.includes('INNER')
            "
            class="workflow-info"
          >
            <div class="workflow-step completed">
              <span class="step-status">완료</span>
              <div class="step-details">
                <strong>내포장 완료</strong>
                <div class="step-meta">
                  작업번호: {{ innerWorkNo }} •
                  {{ formatTime(innerCompletionTime) }}
                </div>
              </div>
            </div>
            <div class="workflow-arrow">다음 단계</div>
            <div class="workflow-step current">
              <div class="step-details">
                <strong>외포장 진행</strong>
                <div class="step-meta">
                  {{ selectedLineForStart?.line_name }}
                </div>
              </div>
            </div>
          </div>

          <p class="confirmation-text">
            이 라인에서
            {{ getLineTypeText(selectedLineForStart?.line_type) }} 작업을
            시작하시겠습니까?
          </p>
        </div>
        <div class="modal-actions">
          <button @click="closeStartModal" class="btn-cancel">취소</button>
          <button @click="confirmStartWork" class="btn-confirm">
            {{ getWorkStartButtonText() }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeMount } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";

const router = useRouter();
const route = useRoute();

// 상태 관리
const currentStep = ref("package-type-selection");
const selectedPackageType = ref(null);
const completedSteps = ref([]);
const innerCompletionTime = ref(null);
const outerCompletionTime = ref(null);
const innerWorkNo = ref("");
const outerWorkNo = ref("");

//  동적 완료 메시지 시스템
const showCompletionMessage = ref(false);
const completionMessage = ref("");
const completionMessageType = ref("success");

// 현재 로그인한 사용자 정보
const currentEmployee = ref(null);

// 필터 상태
const lineTypeFilter = ref("");
const lineStatusFilter = ref("");
const searchText = ref("");

// 데이터 상태
const packageLines = ref([]);
const loading = ref(false);
const error = ref("");

// 모달 상태
const showStartModal = ref(false);
const selectedLineForStart = ref(null);

// 필터링된 라인 목록
const filteredLines = computed(() => {
  let lines = packageLines.value || [];

  // 라인 타입 필터
  if (lineTypeFilter.value) {
    lines = lines.filter((line) => line.line_type === lineTypeFilter.value);
  }

  // 라인 상태 필터
  if (lineStatusFilter.value) {
    lines = lines.filter((line) => line.line_state === lineStatusFilter.value);
  }

  // 검색어 필터
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    lines = lines.filter(
      (line) =>
        line.line_name?.toLowerCase().includes(search) ||
        line.eq_name?.toLowerCase().includes(search) ||
        line.line_id?.toString().includes(search),
    );
  }

  return lines;
});

//  URL 파라미터 처리 (개선된 버전)
onBeforeMount(() => {
  console.log("포장 라인 페이지 로드");
  console.log("URL 파라미터:", route.query);

  // Case 1: 내포장 완료 후 외포장으로 자동 이동
  if (
    route.query.inner_completed === "true" ||
    route.query.completed_inner === "true"
  ) {
    console.log("내포장 완료 → 외포장 자동 활성화");

    completedSteps.value = ["INNER"];
    innerCompletionTime.value = new Date();
    innerWorkNo.value =
      route.query.prev_work || route.query.completed_work || "내포장완료";

    selectedPackageType.value = "OUTER";
    currentStep.value = "line-selection";
    lineTypeFilter.value = "OUTER";

    // 완료 메시지 표시
    if (route.query.message) {
      showCompletionMessage.value = true;
      completionMessage.value = route.query.message;
      completionMessageType.value = "success";

      setTimeout(() => {
        showCompletionMessage.value = false;
      }, 5000);
    }

    setTimeout(() => router.replace({ query: {} }), 100);
    return;
  }

  // Case 2: 외포장 완료 후 돌아온 경우
  if (route.query.outer_completed === "true") {
    console.log("외포장 완료 → 전체 완료");

    completedSteps.value = ["INNER", "OUTER"];
    innerCompletionTime.value = new Date(Date.now() - 3600000); // 1시간 전
    outerCompletionTime.value = new Date();
    innerWorkNo.value = route.query.prev_inner_work || "내포장완료";
    outerWorkNo.value =
      route.query.prev_work || route.query.completed_work || "외포장완료";

    currentStep.value = "package-type-selection";
    selectedPackageType.value = null;

    // 전체 완료 메시지
    showCompletionMessage.value = true;
    completionMessage.value = "모든 포장 작업이 완료되었습니다!";
    completionMessageType.value = "success";

    setTimeout(() => {
      showCompletionMessage.value = false;
    }, 8000);

    setTimeout(() => router.replace({ query: {} }), 100);
    return;
  }

  // Case 3: 작업 수행 중 다른 라인으로 돌아온 경우
  if (route.query.from_work === "true") {
    const maintainType = route.query.maintain_type;
    console.log(`${maintainType} 작업에서 돌아옴`);

    selectedPackageType.value = maintainType;
    currentStep.value = "line-selection";
    lineTypeFilter.value = maintainType;

    if (maintainType === "OUTER") {
      completedSteps.value = ["INNER"];
      innerCompletionTime.value = new Date(Date.now() - 1800000); // 30분 전
      innerWorkNo.value = route.query.prev_work || "내포장완료";
    }

    setTimeout(() => router.replace({ query: {} }), 100);
    return;
  }

  // Case 4: 일반 진입
  console.log("일반 진입 - 처음부터 시작");
  currentStep.value = "package-type-selection";
  selectedPackageType.value = null;
  completedSteps.value = [];
});

// 컴포넌트 마운트 시 라인 목록 로드
onMounted(async () => {
  console.log("컴포넌트 마운트 - 라인 목록 로드 시작");

  // 현재 사용자 정보 먼저 로드
  await loadCurrentEmployee();

  // 라인 목록 로드
  fetchLines();
});

// 현재 로그인한 사용자 정보 로드 (개선된 버전)
async function loadCurrentEmployee() {
  try {
    console.log("현재 사용자 정보 로드 시작...");

    // 여러 방법으로 사용자 정보 시도
    let userInfo = null;

    // 방법 1: API 호출
    try {
      const response = await axios.get("/lines/current-employee");
      if (response.data && response.data.success) {
        userInfo = response.data.data;
        console.log("API에서 사용자 정보 로드 성공:", userInfo);
      }
    } catch (apiError) {
      console.log("API 호출 실패, 대안 방법 시도:", apiError.message);
    }

    // 방법 2: 세션/로컬스토리지 확인
    if (!userInfo) {
      const storedUser =
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");
      if (storedUser) {
        try {
          userInfo = JSON.parse(storedUser);
          console.log("저장된 사용자 정보 사용:", userInfo);
        } catch (parseError) {
          console.log("저장된 사용자 정보 파싱 실패");
        }
      }
    }

    // 방법 3: 기본값 설정
    if (!userInfo) {
      userInfo = {
        employee_name: "김홍인",
        employee_id: 2,
        department: "포장부",
        position: "작업자",
      };
      console.log("기본 사용자 정보 사용:", userInfo);
    }

    currentEmployee.value = userInfo;
  } catch (error) {
    console.error("사용자 정보 로드 실패:", error);

    // 최종 기본값
    currentEmployee.value = {
      employee_name: "김홍인",
      employee_id: 2,
      department: "포장부",
      position: "작업자",
    };
  }
}

// 라인 목록 가져오기
async function fetchLines() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get("/lines/list");

    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      packageLines.value = res.data.data;
      console.log("라인 목록 로드 완료:", res.data.data.length, "개");
    } else {
      packageLines.value = [];
      error.value = "데이터 형식이 올바르지 않습니다";
    }
  } catch (err) {
    console.error("라인 목록 로드 실패:", err);
    error.value = "라인 목록을 불러오지 못했습니다.";
    packageLines.value = [];
  } finally {
    loading.value = false;
  }
}

// 포장 타입 선택 (워크플로우 개선)
function selectPackageType(type) {
  console.log("포장 타입 선택:", type);
  console.log("현재 완료된 단계:", completedSteps.value);

  if (type === "OUTER" && !completedSteps.value.includes("INNER")) {
    alert("내포장 작업을 먼저 완료해주세요.");
    return;
  }

  selectedPackageType.value = type;
  currentStep.value = "line-selection";
  lineTypeFilter.value = type;
  lineStatusFilter.value = "";
  searchText.value = "";

  console.log(
    `${type === "INNER" ? "내포장" : "외포장"} 라인 선택 화면으로 이동`,
  );
}

// 포장 타입 선택으로 돌아가기
function goBackToPackageTypeSelection() {
  currentStep.value = "package-type-selection";
  selectedPackageType.value = null;
  lineTypeFilter.value = "";
  lineStatusFilter.value = "";
  searchText.value = "";
}

// 라인 관리로 이동
function goBackToLineAdd() {
  console.log("포장 라인 관리로 이동");
  try {
    router.push({ name: "package_add_line" });
  } catch (err) {
    console.warn("라우터를 통한 이동 실패:", err);
    window.location.href = "/faq/package_add_line";
  }
}

//  모든 단계 초기화 (개선된 버전)
function resetAllSteps() {
  if (
    confirm("모든 작업 내역이 초기화됩니다. 정말 새 작업을 시작하시겠습니까?")
  ) {
    currentStep.value = "package-type-selection";
    selectedPackageType.value = null;
    completedSteps.value = [];
    innerCompletionTime.value = null;
    outerCompletionTime.value = null;
    innerWorkNo.value = "";
    outerWorkNo.value = "";
    showCompletionMessage.value = false;
    lineTypeFilter.value = "";
    lineStatusFilter.value = "";
    searchText.value = "";
    console.log("모든 단계 초기화 완료");
  }
}

// 필터 초기화
function clearAllFilters() {
  if (currentStep.value === "line-selection" && selectedPackageType.value) {
    lineTypeFilter.value = selectedPackageType.value;
  } else {
    lineTypeFilter.value = "";
  }
  lineStatusFilter.value = "";
  searchText.value = "";
}

//  추천 라인 판별 (외포장 시 특정 라인 추천)
function isRecommendedLine(line) {
  if (
    selectedPackageType.value === "OUTER" &&
    completedSteps.value.includes("INNER")
  ) {
    // 외포장 시 특정 조건의 라인을 추천
    return line.line_state === "s2" && line.line_type === "OUTER";
  }
  return false;
}

// 작업 시작 버튼 클릭
function startPackagingWork(line) {
  selectedLineForStart.value = line;
  showStartModal.value = true;
}

// 작업 계속 버튼 클릭
function continuePackagingWork(line) {
  navigateToWorkPage(line);
}

//  작업 시작 확인 (개선된 버전)
async function confirmStartWork() {
  if (!selectedLineForStart.value) return;

  try {
    console.log("작업 시작:", selectedLineForStart.value);
    navigateToWorkPage(selectedLineForStart.value);
  } catch (err) {
    console.error("작업 시작 중 오류:", err);
    alert("작업 시작 중 오류가 발생했습니다.");
  } finally {
    closeStartModal();
  }
}

// navigateToWorkPage 수정 - 사용자 정보 확실히 전달
function navigateToWorkPage(line) {
  console.log("작업 페이지로 이동:", line);
  console.log("현재 사용자 정보:", currentEmployee.value);

  const queryParams = {
    line_id: line.line_id,
    line_name: line.line_name,
    line_type: line.line_type,
    product_code: line.product_code,
    product_name: line.product_name,
    work_no: line.curr_work_no || "",
    return_to: "package_line",
    current_package_type: selectedPackageType.value,

    // ✅ 현재 사용자 정보 확실히 전달
    employee_id: currentEmployee.value?.employee_id || 2,
    employee_name: currentEmployee.value?.employee_name || "김홍인",
    employee_department: currentEmployee.value?.department || "포장부",
    employee_position: currentEmployee.value?.position || "작업자",
  };

  console.log("전달할 사용자 정보:", {
    employee_id: queryParams.employee_id,
    employee_name: queryParams.employee_name,
    employee_department: queryParams.employee_department,
    employee_position: queryParams.employee_position,
  });

  // 워크플로우 상태 정보 추가
  if (
    selectedPackageType.value === "OUTER" &&
    completedSteps.value.includes("INNER")
  ) {
    queryParams.workflow_step = "OUTER";
    queryParams.inner_completed = "true";
    queryParams.inner_work_no = innerWorkNo.value;
    queryParams.inner_completion_time =
      innerCompletionTime.value?.toISOString();
    queryParams.auto_start_guide = "true";
  } else if (selectedPackageType.value === "INNER") {
    queryParams.workflow_step = "INNER";
    queryParams.next_step = "OUTER";
  }

  try {
    router.push({
      name: "package_work",
      query: queryParams,
    });
    console.log("작업 페이지로 이동 성공");
  } catch (routerError) {
    console.error("라우터 이동 실패:", routerError);
    const params = new URLSearchParams(queryParams);
    window.location.href = `/packaging/work?${params.toString()}`;
  }
}

// 모달 닫기
function closeStartModal() {
  showStartModal.value = false;
  selectedLineForStart.value = null;
}

//  워크플로우 관련 텍스트 함수들
function getWorkStartTitle() {
  if (
    selectedPackageType.value === "OUTER" &&
    completedSteps.value.includes("INNER")
  ) {
    return "외포장 작업 시작 확인";
  }
  return "작업 시작 확인";
}

function getWorkStartButtonText() {
  if (
    selectedPackageType.value === "OUTER" &&
    completedSteps.value.includes("INNER")
  ) {
    return "외포장 작업 시작";
  }
  return "작업 시작";
}

function getTotalWorkTime() {
  if (innerCompletionTime.value && outerCompletionTime.value) {
    const diff =
      outerCompletionTime.value.getTime() - innerCompletionTime.value.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분`;
  }
  return "-";
}

// 헬퍼 함수들
function getLineTypeText(type) {
  return type === "INNER" ? "내포장" : "외포장";
}

function getStatusText(status) {
  const map = {
    s1: "가동 중",
    s2: "가동대기 중",
    s3: "정지",
  };
  return map[status] || status;
}

function formatTime(date) {
  if (!date) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 컴포넌트 함수들을 export
defineExpose({
  selectPackageType,
  goBackToPackageTypeSelection,
  goBackToLineAdd,
  resetAllSteps,
});

defineOptions({
  name: "PackageLineSelection",
});
</script>

<style scoped>
/* 전체 레이아웃 */
.package-line-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 브레드크럼 */
.breadcrumb {
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  color: #6c757d;
}

.breadcrumb-item.active {
  color: #495057;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 8px;
}

/* 헤더 */
.header-section {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 20px 24px;
}

.header-section h1 {
  font-size: 24px;
  font-weight: 600;
  color: #212529;
  margin: 0 0 8px 0;
}

.header-section p {
  color: #6c757d;
  margin: 0;
  font-size: 14px;
}

/* 완료 메시지 */
.completion-alert {
  margin: 16px 0;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 12px;
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.completion-alert.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.completion-alert.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

/* 워크플로우 진행 표시 */
.workflow-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 16px auto;
  padding: 16px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  max-width: 300px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 4px;
  opacity: 0.5;
  font-size: 12px;
  border: 1px solid #e9ecef;
}

.progress-step.completed {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  opacity: 1;
}

.progress-step.active {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  opacity: 1;
}

.step-text {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
}

.progress-arrow {
  font-size: 14px;
  color: #6c757d;
}

/* 다음 단계 안내 */
.next-step-guide {
  background: #f8f9fa;
  border: 1px solid #007bff;
  border-radius: 4px;
  padding: 16px;
  margin: 16px 0;
}

.guide-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.guide-content p {
  margin: 0 0 8px 0;
  color: #6c757d;
  font-size: 12px;
}

.guide-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
}

/* 포장 타입 선택 - 크기 개선 */
.package-type-selection {
  padding: 24px;
}

.package-type-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 32px auto 48px;
}

.package-type-card {
  background: white;
  border-radius: 12px;
  padding: 40px 32px;
  text-align: center;
  border: 3px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.package-type-card:hover {
  border-color: #007bff;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
}

.package-type-card.completed {
  background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%);
  border-color: #28a745;
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.2);
}

.package-type-card.disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none !important;
}

.package-type-card.highlighted {
  border-color: #007bff;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  box-shadow: 0 8px 30px rgba(0, 123, 255, 0.25);
  animation: gentle-pulse 3s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 30px rgba(0, 123, 255, 0.25);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 123, 255, 0.35);
  }
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.package-type-card h3 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #495057;
}

.package-type-card p {
  font-size: 16px;
  margin-bottom: 24px;
  color: #6c757d;
  line-height: 1.6;
}

.selection-button {
  padding: 16px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
  text-transform: none;
}

.selection-button.available {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.selection-button.available:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004494 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.selection-button.highlighted {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  animation: button-pulse 2s ease-in-out infinite;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.4);
}

@keyframes button-pulse {
  0%,
  100% {
    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.4);
  }
  50% {
    box-shadow: 0 6px 30px rgba(0, 123, 255, 0.6);
  }
}

.selection-button.highlighted:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004494 100%);
  transform: translateY(-2px);
}

.selection-button.disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  font-size: 14px;
  box-shadow: none;
}

.completion-badge {
  padding: 16px 24px;
  background: linear-gradient(135deg, #28a745 0%, #20a039 100%);
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.completion-time {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8px;
}

/* 완료 요약 */
.completion-summary {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.completion-summary h4 {
  font-size: 20px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 20px;
  text-align: center;
}

.completed-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.completed-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  display: block;
  margin-bottom: 4px;
}

.item-work {
  font-size: 14px;
  color: #6c757d;
}

.completed-item .time {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.all-complete-section {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
  text-align: center;
}

.all-complete-message {
  font-size: 20px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 16px;
}

.complete-summary-info {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.complete-summary-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #495057;
}

/* 필터 섹션 */
.filter-section {
  padding: 16px 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: white;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.filter-group {
  flex: 1;
}

.filter-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
}

.filter-select,
.filter-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #007bff;
}

.filter-reset-btn {
  padding: 6px 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.filter-reset-btn:hover {
  background: #545b62;
}

/* 상태 화면들 */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px 24px;
  background: white;
  border-radius: 4px;
  margin: 0 24px;
  border: 1px solid #e9ecef;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state p,
.empty-state p {
  color: #6c757d;
  margin: 8px 0 16px;
  font-size: 14px;
}

.empty-state h3 {
  color: #495057;
  margin-bottom: 8px;
  font-size: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.retry-btn:hover {
  background: #0056b3;
}

/* 라인 그리드 */
.lines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  padding: 0 24px;
}

.line-card {
  background: white;
  border-radius: 4px;
  padding: 16px;
  border: 1px solid #e9ecef;
  transition: border-color 0.15s;
  position: relative;
}

.line-card:hover {
  border-color: #007bff;
}

.line-card.available {
  border-color: #e9ecef;
}

.line-card.working {
  border-color: #e9ecef;
}

.line-card.maintenance {
  border-color: #e9ecef;
}

.line-card.stopped {
  border-color: #e9ecef;
}

.line-card.recommended {
  border-color: #e9ecef;
  background: #f8f9fa;
}

.line-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.line-name {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.recommended-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #007bff;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.line-status {
  margin-bottom: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.available {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.working {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.maintenance {
  background: #fff3cd;
  color: #856404;
}

.status-badge.stopped {
  background: #f8d7da;
  color: #721c24;
}

.line-details {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.detail-row .label {
  color: #6c757d;
}

.detail-row .value {
  color: #495057;
  font-weight: 500;
}

.action-btn {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn.start {
  background: #007bff;
  color: white;
}

.action-btn.start:hover {
  background: #0056b3;
}

.action-btn.start.recommended {
  background: #007bff;
}

.action-btn.start.recommended:hover {
  background: #0056b3;
}

.action-btn.continue {
  background: #007bff;
  color: white;
}

.action-btn.continue:hover {
  background: #0056b3;
}

.action-btn.maintenance {
  background: #ffc107;
  color: #212529;
  cursor: not-allowed;
}

.action-btn.stopped {
  background: #dc3545;
  color: white;
  cursor: not-allowed;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 4px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid #dee2e6;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  color: #495057;
}

.modal-body {
  padding: 20px;
}

.line-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.line-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin: 0 0 8px 0;
}

.line-info p {
  margin: 4px 0;
  font-size: 12px;
  color: #6c757d;
}

.workflow-info {
  background: #f8f9fa;
  border: 1px solid #007bff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.workflow-step .step-status {
  font-size: 10px;
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.step-details strong {
  display: block;
  color: #495057;
  font-size: 12px;
  margin-bottom: 2px;
}

.step-meta {
  font-size: 11px;
  color: #6c757d;
}

.workflow-arrow {
  text-align: center;
  font-size: 12px;
  color: #007bff;
  margin: 6px 0;
}

.confirmation-text {
  font-size: 14px;
  color: #495057;
  margin: 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #545b62;
}

.btn-confirm {
  background: #007bff;
  color: white;
}

.btn-confirm:hover {
  background: #0056b3;
}

/* 네비게이션 */
.navigation-actions {
  text-align: center;
  margin: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.back-btn {
  padding: 12px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #545b62;
  transform: translateY(-1px);
}

.back-btn.secondary {
  background: #007bff;
}

.back-btn.secondary:hover {
  background: #0056b3;
}

.reset-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

/* 반응형 */
@media (max-width: 768px) {
  .package-type-cards {
    grid-template-columns: 1fr;
    gap: 24px;
    margin: 24px auto 32px;
  }

  .package-type-card {
    min-height: 250px;
    padding: 32px 24px;
  }

  .card-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .package-type-card h3 {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .package-type-card p {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .selection-button {
    padding: 14px 28px;
    font-size: 15px;
    min-width: 160px;
  }

  .lines-grid {
    grid-template-columns: 1fr;
    padding: 0 16px;
  }

  .filter-row {
    flex-direction: column;
    gap: 12px;
  }

  .modal-content {
    width: 95%;
  }

  .modal-actions {
    flex-direction: column;
  }

  .navigation-actions {
    flex-direction: column;
    align-items: center;
  }

  .workflow-progress {
    flex-direction: column;
    gap: 8px;
  }

  .progress-arrow {
    transform: rotate(90deg);
  }

  .completed-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .package-type-selection {
    padding: 16px;
  }

  .package-type-cards {
    gap: 20px;
    margin: 20px auto 28px;
  }

  .package-type-card {
    min-height: 220px;
    padding: 28px 20px;
  }

  .card-icon {
    font-size: 36px;
  }

  .package-type-card h3 {
    font-size: 22px;
  }

  .selection-button {
    padding: 12px 24px;
    font-size: 14px;
    min-width: 140px;
  }
}
</style>
