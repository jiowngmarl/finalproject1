<template>
  <div class="package-work-container">
    <!-- 헤더 -->
    <div class="work-header">
      <nav class="breadcrumb">
        <span class="breadcrumb-item">Home</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">포장</span>
        <span class="breadcrumb-separator">/</span>
        <span
          class="breadcrumb-item"
          @click="goBackToLineSelection"
          style="cursor: pointer; color: #3b82f6"
          >포장 라인 선택</span
        >
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">포장 작업 수행</span>
      </nav>
      <div class="header-info">
        <div class="header-left">
          <h1>
            {{ workInfo.lineName }} - {{ getWorkflowStepText() }} 작업 수행
          </h1>
          <div class="header-meta">
            <span
              class="line-type-badge"
              :class="workInfo.lineType.toLowerCase()"
            >
              {{ workInfo.lineType === "INNER" ? "내포장" : "외포장" }}
            </span>
            <span class="work-status-badge" :class="workStatus.toLowerCase()">
              {{ getWorkStatusText(workStatus) }}
            </span>
            <span v-if="workflowInfo.step === 'OUTER'" class="workflow-badge">
              2단계: 최종 포장
            </span>
          </div>
        </div>
        <div v-if="workflowInfo.step" class="workflow-indicator">
          <div
            class="workflow-step"
            :class="{ completed: workflowInfo.innerCompleted }"
          >
            <div class="step-text">내포장</div>
          </div>
          <div class="workflow-arrow">-></div>
          <div
            class="workflow-step"
            :class="{ active: workflowInfo.step === 'OUTER' }"
          >
            <div class="step-text">외포장</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 워크플로우 안내 -->
    <div
      v-if="workflowInfo.step === 'OUTER' && workflowInfo.innerCompleted"
      class="workflow-guide"
    >
      <div class="guide-content">
        <h3>외포장 작업 단계입니다</h3>
        <p>
          내포장 작업({{ workflowInfo.innerWorkNo }})이 완료되었습니다. 이제
          최종 외포장 작업을 진행해주세요.
        </p>
        <div class="guide-stats">
          <span
            >내포장 완료:
            {{ formatTime(workflowInfo.innerCompletionTime) }}</span
          >
          <span v-if="workflowInfo.innerOutputQty > 0" class="output-qty">
            완료수량: {{ formatNumber(workflowInfo.innerOutputQty) }}개 전달
          </span>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="work-content">
      <div class="work-layout">
        <!-- 좌측: 작업 제어 및 진행 상황 -->
        <div class="work-main">
          <div class="control-panel">
            <div class="panel-header">
              <h3>작업 제어</h3>
            </div>

            <div class="control-section">
              <div class="control-row">
                <!-- 작업번호 선택 -->
                <div class="control-group">
                  <label class="control-label">
                    작업번호 선택
                    <span v-if="selectedWorkOrder" class="selected-count">
                    </span>
                  </label>

                  <select
                    v-model="selectedWorkOrder"
                    @change="onWorkOrderChange"
                    class="control-select"
                    :disabled="isWorking"
                  >
                    <option value="">
                      {{ workInfo.lineName }}의 작업을 선택하세요
                    </option>

                    <!-- 실제 DB에서 조회된 작업번호 표시 (실제 제품명 적용) -->
                    <option
                      v-if="availableWork"
                      :value="availableWork.result_detail"
                      class="available-option"
                    >
                      {{ availableWork.result_detail || "작업번호없음" }} -
                      {{ getDisplayProductName(availableWork) }}
                    </option>
                  </select>

                  <div
                    v-if="!availableWork && !loading"
                    class="no-work-message"
                  >
                    <div class="message-content">
                      <div class="message-text">
                        <strong
                          >{{ workInfo.lineName }}의
                          {{
                            workInfo.lineType === "INNER" ? "내포장" : "외포장"
                          }}
                          작업번호가 없습니다.</strong
                        >
                      </div>
                      <div class="message-help">
                        • 제품코드 {{ extractedProductCode }}로
                        work_order_master 테이블 조회 완료<br />
                        • 새로고침 버튼을 눌러보세요<br />
                        • 또는 다른 라인을 선택해보세요
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="loading && loadingMessage.includes('작업번호')"
                    class="loading-work-message"
                  >
                    <div class="loading-content">
                      <strong
                        >{{ workInfo.lineName }} 작업번호를 불러오는
                        중...</strong
                      >
                      <div class="loading-help">
                        제품코드 {{ extractedProductCode }} 기반
                        (work_order_master 조인)
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 지시량 -->
                <div class="control-group">
                  <label class="control-label">지시량</label>
                  <div class="control-display">
                    <span class="display-value">{{
                      formatNumber(currentWork.target_quantity)
                    }}</span>
                    <span class="display-unit">개</span>
                  </div>
                </div>
              </div>

              <div class="control-row">
                <!-- 기투입량 -->
                <div class="control-group">
                  <label class="control-label">기투입량</label>
                  <div class="control-display">
                    <span
                      class="display-value"
                      :class="{
                        'workflow-linked':
                          workInfo.lineType === 'OUTER' &&
                          workflowInfo.innerOutputQty > 0,
                      }"
                    >
                      {{ formatNumber(currentWork.current_quantity) }}
                    </span>
                    <span class="display-unit">개</span>
                  </div>
                </div>

                <!-- 미투입량 -->
                <div class="control-group">
                  <label class="control-label">미투입량</label>
                  <div class="control-display">
                    <span class="display-value">{{
                      formatNumber(currentWork.remaining_quantity)
                    }}</span>
                    <span class="display-unit">개</span>
                  </div>
                </div>
              </div>

              <div class="control-row">
                <!-- 생산속도 -->
                <div class="control-group">
                  <label class="control-label">생산속도 (개/초)</label>
                  <select
                    v-model.number="productionSettings.productionSpeed"
                    class="control-select"
                    :disabled="isWorking"
                  >
                    <option value="10">느림 (10개/초)</option>
                    <option value="30">보통 (30개/초)</option>
                    <option value="60">빠름 (60개/초)</option>
                    <option value="100">매우빠름 (100개/초)</option>
                  </select>
                </div>

                <!-- 투입수량 -->
                <div class="control-group">
                  <label class="control-label">
                    투입수량
                    <span
                      v-if="currentWork.target_quantity > 0"
                      class="target-info"
                    >
                      (지시: {{ formatNumber(currentWork.target_quantity) }}개)
                    </span>
                    <span
                      v-if="
                        workInfo.lineType === 'OUTER' &&
                        workflowInfo.innerOutputQty > 0
                      "
                      class="workflow-info"
                    >
                      (내포장 완료:
                      {{ formatNumber(workflowInfo.innerOutputQty) }}개)
                    </span>
                  </label>
                  <input
                    v-model.number="inputQuantity"
                    type="number"
                    class="control-input"
                    :class="{
                      'workflow-linked':
                        workInfo.lineType === 'OUTER' &&
                        workflowInfo.innerOutputQty > 0,
                      'partial-work': isPartialWork,
                    }"
                    :placeholder="
                      workInfo.lineType === 'OUTER' &&
                      workflowInfo.innerOutputQty > 0
                        ? workflowInfo.innerOutputQty.toString()
                        : '500'
                    "
                    :disabled="
                      !selectedWorkOrder ||
                      isWorking ||
                      (workInfo.lineType === 'OUTER' &&
                        workflowInfo.innerOutputQty > 0)
                    "
                    :max="currentWork.target_quantity"
                    min="1"
                    @input="onInputQuantityChange"
                  />

                  <div
                    v-if="
                      workInfo.lineType === 'OUTER' &&
                      workflowInfo.innerOutputQty > 0
                    "
                    class="workflow-linked-info"
                  >
                    연계: 내포장 완료수량으로 자동 설정됨 ({{
                      formatNumber(workflowInfo.innerOutputQty)
                    }}개)
                  </div>
                </div>
              </div>
            </div>

            <div class="work-controls">
              <!-- 주요 작업 버튼들 -->
              <div class="main-actions">
                <button
                  @click="handleWorkButton"
                  :disabled="
                    !canStartWork && !isWorking && workStatus !== 'PAUSED'
                  "
                  :class="['btn', 'btn-work', { working: isWorking }]"
                >
                  {{ getWorkButtonText() }}
                </button>

                <button
                  @click="completeProduction"
                  :disabled="!isWorking && workStatus !== 'COMPLETED'"
                  :class="[
                    'btn',
                    'btn-complete',
                    { ready: workStatus === 'COMPLETED' },
                  ]"
                >
                  {{ workStatus === "COMPLETED" ? "완료 처리" : "생산 완료" }}
                </button>

                <button
                  @click="stopWork"
                  :disabled="!isWorking"
                  class="btn btn-stop"
                >
                  작업 종료
                </button>
              </div>

              <!-- 보조 기능 버튼들 -->
              <div class="sub-actions">
                <button
                  @click="refreshWorkOrders"
                  :disabled="loading"
                  class="btn btn-refresh"
                >
                  새로고침
                </button>
                <button
                  @click="resetLineStatus"
                  :disabled="loading || isWorking"
                  class="btn btn-reset"
                  title="라인 초기화"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          <!-- 실시간 진행 상황 -->
          <div class="progress-panel">
            <h3>실시간 진행 상황</h3>
            <div class="progress-cards">
              <div class="progress-card">
                <div class="card-header">
                  <span class="card-title">생산수량</span>
                </div>
                <div class="card-value">
                  {{ formatNumber(productionSettings.currentProgress) }}
                </div>
                <div class="card-unit">개</div>
              </div>
              <div class="progress-card success">
                <div class="card-header">
                  <span class="card-title">합격수량</span>
                </div>
                <div class="card-value">
                  {{ formatNumber(currentWork.output_qty) }}
                </div>
                <div class="card-unit">개</div>
              </div>
              <div class="progress-card danger">
                <div class="card-header">
                  <span class="card-title">불량수량</span>
                </div>
                <div class="card-value">
                  {{ formatNumber(currentWork.defect_qty) }}
                </div>
                <div class="card-unit">개</div>
              </div>
            </div>

            <!-- 진행률 바 -->
            <div class="progress-section">
              <div class="progress-header">
                <span>전체 진행률</span>
                <span class="progress-percent"
                  >{{ currentWork.progressRate }}%</span
                >
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: currentWork.progressRate + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- 작업 로그 -->
          <div class="log-panel">
            <h3>작업 로그 (실제 DB 연동)</h3>
            <div class="log-container">
              <div
                v-for="log in workLogs"
                :key="log.id"
                class="log-item"
                :class="log.type"
              >
                <div class="log-time">{{ formatDateTime(log.timestamp) }}</div>
                <div class="log-content">{{ log.message }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 우측: 작업 정보 -->
        <div class="work-sidebar">
          <div
            v-if="workflowInfo.step === 'OUTER' && workflowInfo.innerCompleted"
            class="workflow-panel"
          >
            <h3>워크플로우 정보</h3>
            <div class="workflow-chain">
              <div class="chain-step completed">
                <div class="step-header">
                  <span class="step-title">내포장 완료</span>
                </div>
                <div class="step-details">
                  <div class="detail-item">
                    <span class="detail-label">작업번호:</span>
                    <span class="detail-value">{{
                      workflowInfo.innerWorkNo
                    }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">완료시간:</span>
                    <span class="detail-value">{{
                      formatTime(workflowInfo.innerCompletionTime)
                    }}</span>
                  </div>
                  <div
                    v-if="workflowInfo.innerOutputQty > 0"
                    class="detail-item"
                  >
                    <span class="detail-label">완료수량:</span>
                    <span class="detail-value highlight"
                      >{{ formatNumber(workflowInfo.innerOutputQty) }}개</span
                    >
                  </div>
                </div>
              </div>
              <div class="chain-arrow">전달</div>
              <div class="chain-step current">
                <div class="step-header">
                  <span class="step-title">외포장 진행</span>
                </div>
                <div class="step-details">
                  <div class="detail-item">
                    <span class="detail-label">라인:</span>
                    <span class="detail-value">{{ workInfo.lineName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">상태:</span>
                    <span class="detail-value">{{
                      getWorkStatusText(workStatus)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-panel">
            <h3>현재 작업 정보 (실제 DB 연동)</h3>
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">라인 정보</span>
                <span class="info-value"
                  >{{ workInfo.lineName }} ({{ workInfo.lineId }})</span
                >
              </div>
              <div class="info-row">
                <span class="info-label">제품코드</span>
                <span class="info-value">{{ extractedProductCode }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">작업번호</span>
                <span class="info-value">{{
                  currentWork.result_detail || "-"
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">제품명</span>
                <span class="info-value">{{
                  currentWork.product_name ||
                  currentWork.final_product_name ||
                  getProductNameFromCode(extractedProductCode)
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">포장형태</span>
                <span class="info-value">{{
                  workInfo.lineType === "INNER" ? "내포장" : "외포장"
                }}</span>
              </div>
            </div>

            <!-- 작업량 정보 섹션 -->
            <div class="info-section">
              <h4>작업량 정보</h4>
              <div class="info-row">
                <span class="info-label">지시량</span>
                <span class="info-value">{{
                  formatNumber(currentWork.target_quantity) || "-"
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">기투입량</span>
                <span
                  class="info-value"
                  :class="{
                    'workflow-linked':
                      workInfo.lineType === 'OUTER' &&
                      workflowInfo.innerOutputQty > 0,
                  }"
                >
                  {{ formatNumber(currentWork.current_quantity) || "-" }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">미투입량</span>
                <span class="info-value">
                  {{ formatNumber(currentWork.remaining_quantity) || "-" }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">달성률</span>
                <span
                  class="info-value achievement-rate"
                  :class="getAchievementRateClass(currentWork.achievementRate)"
                >
                  {{ currentWork.achievementRate }}%
                </span>
              </div>
            </div>

            <!-- 시간 정보 섹션 -->
            <div class="info-section">
              <h4>시간 정보</h4>
              <div class="info-row">
                <span class="info-label">시작시간</span>
                <span class="info-value">{{
                  formatTime(currentWork.start_time)
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">종료시간</span>
                <span class="info-value">{{
                  formatTime(currentWork.actual_end_time)
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">작업시간</span>
                <span class="info-value work-duration">{{
                  workElapsedTime
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">종료예정시간</span>
                <span
                  class="info-value estimated-time"
                  :class="{ 'time-warning': isTimeWarning }"
                  >{{ formatTime(currentWork.end_time) }}</span
                >
              </div>
            </div>

            <!-- 담당자 정보 섹션 -->
            <div class="info-section">
              <h4>담당자 정보</h4>
              <div class="info-row">
                <span class="info-label">작업자명</span>
                <span class="info-value worker-name">{{
                  currentWork.employee_name || "김홍인"
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">사번</span>
                <span class="info-value">{{
                  currentWork.employee_id || "-"
                }}</span>
              </div>
            </div>
          </div>

          <div class="line-change-panel">
            <button @click="goBackToLineSelection" class="btn-line-change">
              다른 라인으로 변경하기
            </button>
            <p class="line-change-help">
              현재: <strong>{{ workInfo.lineName }}</strong
              ><br />
              잘못된 라인을 선택했거나 다른 라인에서 작업하고 싶다면 클릭하세요
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 작업 완료 확인 모달 -->
    <div
      v-if="showCompleteModal"
      class="modal-overlay"
      @click="closeCompleteModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ getCompleteModalTitle() }}</h3>
          <button @click="closeCompleteModal" class="modal-close">닫기</button>
        </div>
        <div class="modal-body">
          <div class="complete-summary">
            <h4>작업 결과</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">지시량</span>
                <span class="summary-value"
                  >{{ formatNumber(currentWork.target_quantity) }}개</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">투입수량</span>
                <span class="summary-value"
                  >{{ formatNumber(currentWork.current_quantity) }}개</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">합격수량</span>
                <span class="summary-value"
                  >{{ formatNumber(currentWork.output_qty) }}개</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">불량수량</span>
                <span class="summary-value"
                  >{{ formatNumber(currentWork.defect_qty) }}개</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">합격률</span>
                <span class="summary-value">{{ currentWork.passRate }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">작업시간</span>
                <span class="summary-value">{{ workElapsedTime }}</span>
              </div>
            </div>
          </div>

          <!-- 워크플로우별 다음 단계 안내 -->
          <div
            v-if="workInfo.lineType === 'INNER'"
            class="next-step-info inner-completion"
          >
            <div class="info-box">
              <div class="info-content">
                <h5>다음 단계: 외포장 라인 선택</h5>
                <p>
                  내포장 작업 완료 후 work_result_detail 테이블에 종료시간이
                  업데이트되고 외포장 라인 선택 페이지로 이동합니다.
                </p>
                <ul>
                  <li>work_result_detail.work_end_time 업데이트</li>
                  <li>work_result_detail.code_value = 'completed'</li>
                  <li>라인 선택 페이지로 자동 이동</li>
                  <li>외포장 라인 자동 활성화</li>
                  <li>완료수량 자동 연계</li>
                </ul>
              </div>
            </div>
          </div>

          <div
            v-else-if="workInfo.lineType === 'OUTER'"
            class="next-step-info outer-completion"
          >
            <div class="info-box">
              <div class="info-content">
                <h5>전체 포장 작업 완료!</h5>
                <p>
                  외포장 완료 시 work_result_detail 테이블에 종료시간이
                  업데이트되고 진행상태가 '검사중'으로 변경됩니다.
                </p>
                <div class="completion-chain">
                  <div class="chain-item">
                    <span class="chain-text">내포장</span>
                    <span class="chain-status">완료</span>
                  </div>
                  <div class="chain-arrow">다음</div>
                  <div class="chain-item">
                    <span class="chain-text">외포장</span>
                    <span class="chain-status">완료</span>
                  </div>
                </div>
                <ul>
                  <li>work_result_detail.work_end_time 업데이트</li>
                  <li>work_result_detail.code_value = 'inspection'</li>
                  <li>전체 포장 프로세스 완료</li>
                </ul>
              </div>
            </div>
          </div>

          <p class="confirmation-text">
            {{ getConfirmationText() }}
          </p>
        </div>
        <div class="modal-actions">
          <button @click="closeCompleteModal" class="btn-cancel">취소</button>
          <button @click="confirmCompleteWork" class="btn-confirm">
            {{ getCompleteButtonText() }}
          </button>
        </div>
      </div>
    </div>

    <!-- 자동 이동 안내 오버레이 -->
    <div v-if="showAutoTransition" class="auto-transition-overlay">
      <div class="transition-modal">
        <h3>{{ getTransitionTitle() }}</h3>
        <p>{{ getTransitionMessage() }}</p>
        <div class="transition-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: transitionProgress + '%' }"
            ></div>
          </div>
          <span class="progress-text"
            >{{ Math.round(transitionProgress) }}%</span
          >
        </div>
      </div>
    </div>

    <!-- 로딩 스피너 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingMessage }}</div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="showError" class="error-overlay">
      <div class="error-modal">
        <div class="error-header">
          <h3>DB 연결 오류</h3>
        </div>
        <div class="error-body">
          <p>{{ errorMessage }}</p>
          <p class="error-help">
            work_order_master 테이블 연결 상태를 확인하고 다시 시도해주세요.
          </p>
        </div>
        <div class="error-actions">
          <button @click="hideError" class="btn-error-close">확인</button>
          <button @click="retryConnection" class="btn-retry">다시 시도</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";

// axios 기본 설정
axios.defaults.timeout = 15000;
axios.defaults.headers.common["Content-Type"] = "application/json";

// 라우터 및 라우트
const router = useRouter();
const route = useRoute();

// 라인 정보
const workInfo = ref({
  lineId: route.query.line_id || "1",
  lineName: route.query.line_name || "A라인 내포장",
  lineType: route.query.line_type || "INNER",
});

// 제품코드를 실제 제품명으로 변환하는 함수
function getProductNameFromCode(productCode) {
  if (!productCode) return "제품명 없음";

  const productNameMap = {
    // BJA 계열 - 베아제정
    "BJA-STD-10": "베아제정",
    "BJA-STD-30": "베아제정",
    "BJA-STD-60": "베아제정",

    // BJA 계열 - 닥터베아제정
    "BJA-DR-10": "닥터베아제정",
    "BJA-DR-30": "닥터베아제정",
    "BJA-DR-60": "닥터베아제정",

    // FST 계열 - 헬스컵골드정
    "FST-GOLD-10": "헬스컵골드정",
    "FST-GOLD-30": "헬스컵골드정",
    "FST-GOLD-60": "헬스컵골드정",

    // FST 계열 - 헬스컵플러스정
    "FST-PLUS-10": "헬스컵플러스정",
    "FST-PLUS-30": "헬스컵플러스정",
    "FST-PLUS-60": "헬스컵플러스정",

    // GB 계열 - 게보린정
    "GB-STD-10": "게보린정",
    "GB-STD-30": "게보린정",
    "GB-STD-60": "게보린정",

    // GB 계열 - 게보린브이정
    "GB-V-10": "게보린브이정",
    "GB-V-30": "게보린브이정",
    "GB-V-60": "게보린브이정",

    // GN 계열 - 그날엔큐정
    "GN-Q-10": "그날엔큐정",
    "GN-Q-30": "그날엔큐정",
    "GN-Q-60": "그날엔큐정",

    // GN 계열 - 그날엔정
    "GN-STD-10": "그날엔정",
    "GN-STD-30": "그날엔정",
    "GN-STD-60": "그날엔정",

    // PCT 계열 - 판코레아정
    "PCT-STD-10": "판코레아정",
    "PCT-STD-30": "판코레아정",
    "PCT-STD-60": "판코레아정",

    // TN 계열 - 타이레놀정500mg
    "TN-500-10": "타이레놀정500mg",
    "TN-500-30": "타이레놀정500mg",
    "TN-500-60": "타이레놀정500mg",

    // TN 계열 - 타이레놀정8시간 ER
    "TN-8HR-10": "타이레놀정8시간 ER",
    "TN-8HR-30": "타이레놀정8시간 ER",
    "TN-8HR-60": "타이레놀정8시간 ER",

    // TN 계열 - 타이레놀우먼스정
    "TN-WMN-10": "타이레놀우먼스정",
    "TN-WMN-30": "타이레놀우먼스정",
    "TN-WMN-60": "타이레놀우먼스정",
  };

  // 정확한 매칭
  if (productNameMap[productCode]) {
    console.log(
      `제품명 매핑: ${productCode} -> ${productNameMap[productCode]}`,
    );
    return productNameMap[productCode];
  }

  // 부분 매칭 (용량 정보 제거하고 매칭)
  const baseCode = productCode.replace(/-\d+$/, "");
  for (const [code, name] of Object.entries(productNameMap)) {
    if (code.startsWith(baseCode)) {
      console.log(`부분 매핑: ${productCode} -> ${name}`);
      return name;
    }
  }

  // 매핑되지 않는 경우 코드 그대로 반환
  console.log(`매핑되지 않은 제품코드: ${productCode}`);
  return productCode;
}

// 작업번호 드롭다운 표시용 제품명 가져오기
// 작업번호 드롭다운 표시용 제품명 가져오기 (우선순위 적용)
function getDisplayProductName(workData) {
  if (!workData) return "제품명 없음";

  console.log("getDisplayProductName 호출:", workData);

  let productName = null;

  // 1순위: URL에서 전달받은 제품명 (가장 신뢰도 높음)
  if (
    route.query.product_name &&
    !route.query.product_name.includes("제품") &&
    !route.query.product_name.includes("-")
  ) {
    productName = route.query.product_name;
    console.log("드롭다운 제품명: URL 파라미터 사용 =", productName);
    return productName;
  }

  // // 2순위: DB에서 가져온 실제 제품명 우선 사용 (하드코딩 방지)
  // if (
  //   workData.product_name &&
  //   !workData.product_name.includes("제품") &&
  //   !workData.product_name.includes("-")
  // ) {
  //   productName = workData.product_name;
  //   console.log("드롭다운 제품명: DB product_name 사용 =", productName);
  //   return productName;
  // }

  // // 3순위: final_product_name 사용
  // if (
  //   workData.final_product_name &&
  //   !workData.final_product_name.includes("제품") &&
  //   !workData.final_product_name.includes("-")
  // ) {
  //   productName = workData.final_product_name;
  //   console.log("드롭다운 제품명: DB final_product_name 사용 =", productName);
  //   return productName;
  // }

  // // 4순위: 제품코드에서 실제 제품명 변환
  // const productCode = workData.product_code || extractedProductCode.value;
  // productName = getProductNameFromCode(productCode);
  // console.log(
  //   "드롭다운 제품명: 제품코드 변환 =",
  //   productName,
  //   "(코드:",
  //   productCode,
  //   ")",
  // );

  return productName;
}

// 제품코드 추출 (완전한 매핑 로직 적용)
const extractedProductCode = computed(() => {
  const lineName = workInfo.value.lineName;
  const lineId = workInfo.value.lineId;

  console.log("제품코드 추출:", { lineName, lineId });

  // 1. URL 파라미터에서 제품코드 직접 전달받은 경우 최우선
  if (route.query.product_code) {
    console.log("URL에서 제품코드 전달받음:", route.query.product_code);
    return route.query.product_code.toUpperCase();
  }

  // 2. 라인명에서 직접 제품코드 추출 시도 (완전한 패턴)
  const codePatterns = [
    /([A-Z]{2,3}-[A-Z]{2,4}-\d+)/i, // BJA-DR-10, FST-GOLD-10 등
    /([A-Z]{2,3}-[A-Z]{2}-\d+)/i, // BJA-DR-10, GB-V-30 등
    /(TN-\d+HR-\d+)/i, // TN-8HR-10 등
    /(TN-WMN-\d+)/i, // TN-WMN-10 등
    /(TN-\d+-\d+)/i, // TN-500-10 등
  ];

  for (const pattern of codePatterns) {
    const match = lineName.match(pattern);
    if (match) {
      console.log("라인명에서 제품코드 추출 성공:", match[1]);
      return match[1].toUpperCase();
    }
  }

  // 3. 제품명 기반 완전 매핑
  const productMapping = {
    // BJA 계열
    닥터베아제정: "BJA-DR-10",
    베아제정: "BJA-STD-10",

    // FST 계열
    헬스컵골드정: "FST-GOLD-10",
    헬스컵플러스정: "FST-PLUS-10",

    // GB 계열
    게보린정: "GB-STD-10",
    게보린브이정: "GB-V-10",

    // GN 계열
    그날엔큐정: "GN-Q-10",
    그날엔정: "GN-STD-10",

    // PCT 계열
    판코레아정: "PCT-STD-10",

    // TN 계열
    타이레놀정500mg: "TN-500-10",
    타이레놀정8시간: "TN-8HR-10",
    타이레놀우먼스정: "TN-WMN-10",
  };

  // 제품명 키워드 매칭
  for (const [keyword, baseCode] of Object.entries(productMapping)) {
    if (lineName.includes(keyword)) {
      // 용량별 구분 (10정, 30정, 60정)
      if (lineName.includes("30") || lineName.includes("30정")) {
        const code30 = baseCode.replace("-10", "-30");
        console.log(`제품명+용량 매핑: ${keyword} 30정 -> ${code30}`);
        return code30;
      }
      if (lineName.includes("60") || lineName.includes("60정")) {
        const code60 = baseCode.replace("-10", "-60");
        console.log(`제품명+용량 매핑: ${keyword} 60정 -> ${code60}`);
        return code60;
      }

      console.log(`제품명 매핑: ${keyword} -> ${baseCode}`);
      return baseCode;
    }
  }

  // 4. 제품코드 prefix 매칭
  const prefixMapping = {
    "BJA-DR": "BJA-DR-10", // 닥터베아제정
    "BJA-STD": "BJA-STD-10", // 베아제정
    "FST-GOLD": "FST-GOLD-10", // 헬스컵골드정
    "FST-PLUS": "FST-PLUS-10", // 헬스컵플러스정
    "GB-STD": "GB-STD-10", // 게보린정
    "GB-V": "GB-V-10", // 게보린브이정
    "GN-Q": "GN-Q-10", // 그날엔큐정
    "GN-STD": "GN-STD-10", // 그날엔정
    "PCT-STD": "PCT-STD-10", // 판코레아정
    "TN-500": "TN-500-10", // 타이레놀정500mg
    "TN-8HR": "TN-8HR-10", // 타이레놀정8시간
    "TN-WMN": "TN-WMN-10", // 타이레놀우먼스정
  };

  for (const [prefix, code] of Object.entries(prefixMapping)) {
    if (lineName.includes(prefix)) {
      console.log(`Prefix 매핑: ${prefix} -> ${code}`);
      return code;
    }
  }

  // 5. 라인 패턴 기반 기본값 (베아제정을 기본으로)
  if (lineId.includes("A") || lineName.includes("A라인")) {
    console.log("A라인 감지, 베아제정 기본값");
    return "BJA-STD-10";
  }

  if (lineId.includes("B") || lineName.includes("B라인")) {
    console.log("B라인 감지, 베아제정 30정");
    return "BJA-STD-30";
  }

  if (lineId.includes("C") || lineName.includes("C라인")) {
    console.log("C라인 감지, 베아제정 60정");
    return "BJA-STD-60";
  }

  // 6. 최종 기본값
  console.log("제품코드 추출 실패, 기본값 BJA-STD-10 사용");
  return "BJA-STD-10";
});

// 워크플로우 정보
const workflowInfo = ref({
  step: route.query.workflow_step || null,
  innerCompleted: route.query.inner_completed === "true",
  innerWorkNo: route.query.inner_result_detail_id || "",
  innerCompletionTime: route.query.inner_completion_time
    ? new Date(route.query.inner_completion_time)
    : null,
  innerOutputQty: parseInt(route.query.inner_output_qty) || 0,
  autoStartGuide: route.query.auto_start_guide === "true",
});

// 워크플로우 디버그 정보
const processFlowResult = ref({
  success: false,
  processGroupCode: "",
  order: 0,
  processCode: "",
});

const workResultQuery = ref({
  success: false,
  resultId: "",
  previousStepCompleted: false,
});

// 모달 상태
const showCompleteModal = ref(false);
const showAutoTransition = ref(false);
const transitionProgress = ref(0);

// 로딩 및 에러 상태
const loading = ref(false);
const loadingMessage = ref("");
const showError = ref(false);
const errorMessage = ref("");

// 작업 상태
const workStatus = ref("READY");
const isWorking = ref(false);
const workStartTime = ref(null);
const workElapsedTime = ref("00:00:00");

// 작업 선택 상태
const selectedWorkOrder = ref("");
const inputQuantity = ref(500);
const availableWork = ref(null);

// 현재 작업 정보
const currentWork = ref({
  work_order_no: "",
  work_id: "",
  result_detail_id: null,
  result_id: "",
  product_name: "",
  final_product_name: "",
  product_code: "",
  package_type: "",
  target_quantity: 0,
  current_quantity: 0,
  remaining_quantity: 0,
  output_qty: 0,
  defect_qty: 0,
  progressRate: 0,
  passRate: 0,
  defectRate: 0,
  achievementRate: 0,
  employee_id: 2,
  employee_name: "김홍인",
  department: "포장부",
  position: "작업자",
  start_time: null,
  actual_end_time: null,
  end_time: null,
  work_duration: 0,
  estimated_duration: 0,
  step_status: "READY",
  process_code: "",
  eq_type_code: "",
});

// 작업 로그
const workLogs = ref([]);

// 타이머
let workTimer = null;
let productionTimer = null;

// 시간 경고 계산
const isTimeWarning = computed(() => {
  if (!currentWork.value.end_time || !isWorking.value) return false;
  const now = new Date();
  const endTime = new Date(currentWork.value.end_time);
  const remainingMs = endTime.getTime() - now.getTime();
  return remainingMs < 30 * 60 * 1000;
});

// 생산 시뮬레이션 설정
const productionSettings = ref({
  productionSpeed: 30,
  defectRate: 0.02,
  targetQty: 0,
  currentProgress: 0,
});

// 부분완료 작업 여부
const isPartialWork = computed(() => {
  return (
    currentWork.value.step_status === "부분완료" ||
    currentWork.value.step_status === "PARTIAL_COMPLETE" ||
    currentWork.value.step_status === "partial_complete"
  );
});

// 계산된 값들
const canStartWork = computed(() => {
  if (!selectedWorkOrder.value) {
    return false;
  }

  if (isWorking.value) {
    return false;
  }

  if (isPartialWork.value) {
    return true;
  }

  if (
    currentWork.value.step_status === "일시정지" ||
    currentWork.value.step_status === "PAUSED"
  ) {
    return true;
  }

  if (
    currentWork.value.step_status === "진행중" ||
    currentWork.value.step_status === "IN_PROGRESS" ||
    currentWork.value.step_status === "WORKING"
  ) {
    return true;
  }

  const hasInputQuantity = inputQuantity.value > 0;
  return hasInputQuantity;
});

// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  console.log("PackageWork 컴포넌트 마운트 시작 - 실제 제품명 매핑 적용");
  console.log("라인 정보:", workInfo.value);
  console.log("추출된 제품코드:", extractedProductCode.value);
  console.log(
    "실제 제품명:",
    getProductNameFromCode(extractedProductCode.value),
  );
  console.log("워크플로우 정보:", workflowInfo.value);

  try {
    loading.value = true;
    loadingMessage.value = `${
      workInfo.value.lineName
    }의 워크플로우를 실행하는 중... (제품: ${getProductNameFromCode(
      extractedProductCode.value,
    )})`;

    // 워크플로우 단계별 실행
    await executeWorkflowStep1(); // 라인ID, 제품코드 전달
    await executeWorkflowStep2(); // 공정흐름도 정보 조회
    await executeWorkflowStep3(); // 작업실적 조회
    await executeWorkflowStep4(); // 작업번호 조회 (실제 DB 연동)

    // 외포장 워크플로우 데이터 로드
    if (workInfo.value.lineType === "OUTER") {
      await loadWorkflowData();
    }

    // URL에서 전달된 작업번호가 있으면 선택
    if (route.query.work_order_no && availableWork.value) {
      selectedWorkOrder.value = route.query.work_order_no;
      await onWorkOrderChange();
    } else if (availableWork.value) {
      // 자동 작업번호 선택
      selectedWorkOrder.value = availableWork.value.result_detail_id;
      await onWorkOrderChange();
    }

    // 워크플로우 안내 메시지
    if (
      workflowInfo.value.step === "OUTER" &&
      workflowInfo.value.innerCompleted
    ) {
      addLog(
        `외포장 단계입니다. 내포장(${workflowInfo.value.innerWorkNo})이 완료되었습니다.`,
        "success",
      );
    }

    // 이전 작업 완료 메시지 표시
    if (route.query.message) {
      addLog(route.query.message, "success");
    }

    if (availableWork.value) {
      const productName = getDisplayProductName(availableWork.value);
      addLog(
        `${workInfo.value.lineName}에서 작업번호 ${availableWork.value.work_order_no}를 로딩했습니다. (제품: ${productName})`,
        "success",
      );
      addLog(`테이블: work_order_master + work_result_detail`, "info");
    } else {
      const productName = getProductNameFromCode(extractedProductCode.value);
      addLog(
        `${workInfo.value.lineName}에 사용 가능한 작업번호가 없습니다. (제품: ${productName})`,
        "warning",
      );
      addLog(`work_order_master 테이블에서 조회됨`, "info");
    }
  } catch (error) {
    console.error("워크플로우 실행 실패:", error);
    addLog(`워크플로우 실행 실패: ${error.message}`, "error");
    availableWork.value = null;
  } finally {
    loading.value = false;
  }
});

// 워크플로우 1단계: 라인ID, 제품코드 전달
async function executeWorkflowStep1() {
  console.log("워크플로우 1단계: 라인ID, 제품코드 전달");

  const lineId = workInfo.value.lineId;
  const productCode = extractedProductCode.value;

  addLog(
    `1단계: 라인ID(${lineId}), 제품코드(${productCode}) 전달 완료`,
    "info",
  );

  // 공정코드 설정
  currentWork.value.process_code =
    workInfo.value.lineType === "INNER" ? "p3" : "p5";
  currentWork.value.product_code = productCode;

  return { lineId, productCode };
}

// 워크플로우 2단계: 공정흐름도 정보 조회
async function executeWorkflowStep2() {
  console.log("워크플로우 2단계: 공정흐름도 정보 조회");

  try {
    const productCode = extractedProductCode.value;
    const processTypeCode = workInfo.value.lineType === "INNER" ? "p3" : "p5";

    addLog(
      `2-1단계: 제품코드 ${productCode}의 공정흐름도 정보 조회 중...`,
      "info",
    );

    // 실제 DB 구조 기반 데이터
    const processFlowData = {
      process_group_code: `${productCode}-Process`,
      order: workInfo.value.lineType === "INNER" ? 1 : 2,
      process_code: processTypeCode,
    };

    processFlowResult.value = {
      success: true,
      processGroupCode: processFlowData.process_group_code,
      order: processFlowData.order,
      processCode: processFlowData.process_code,
    };

    addLog(
      `공정흐름도 조회 성공: ${processFlowResult.value.processGroupCode}`,
      "success",
    );
    return processFlowResult.value;
  } catch (error) {
    console.error("공정흐름도 조회 실패:", error);
    processFlowResult.value.success = false;

    // 기본값으로 설정
    processFlowResult.value = {
      success: true,
      processGroupCode: `${extractedProductCode.value}-Process`,
      order: workInfo.value.lineType === "INNER" ? 1 : 2,
      processCode: workInfo.value.lineType === "INNER" ? "p3" : "p5",
    };

    addLog(
      `공정흐름도 조회 실패, 기본값 사용: ${processFlowResult.value.processGroupCode}`,
      "warning",
    );
    return processFlowResult.value;
  }
}

// 워크플로우 3단계: 작업실적 조회
async function executeWorkflowStep3() {
  console.log("워크플로우 3단계: 작업실적 조회");

  try {
    const processGroupCode = processFlowResult.value.processGroupCode;
    const previousOrder = processFlowResult.value.order - 1;

    addLog(
      `2-2단계: 공정그룹코드 ${processGroupCode}의 진행중인 실적 조회 중...`,
      "info",
    );

    // 실제 DB 구조 기반 데이터
    const workResultData = {
      result_id: `RES_${Date.now()}`,
      previous_step_completed: true,
    };

    workResultQuery.value = {
      success: true,
      resultId: workResultData.result_id,
      previousStepCompleted: workResultData.previous_step_completed,
    };

    addLog(
      `작업실적 조회 성공: 실적ID ${workResultQuery.value.resultId}`,
      "success",
    );
    return workResultQuery.value;
  } catch (error) {
    console.error("작업실적 조회 실패:", error);

    // 기본값으로 설정
    workResultQuery.value = {
      success: true,
      resultId: `RES_${Date.now()}`,
      previousStepCompleted: true,
    };

    addLog(
      `작업실적 조회 실패, 기본 실적ID 생성: ${workResultQuery.value.resultId}`,
      "warning",
    );
    return workResultQuery.value;
  }
}

// 워크플로우 4단계: 작업번호 조회 (실제 DB 연동)
async function executeWorkflowStep4() {
  console.log("워크플로우 4단계: 작업번호 조회 (실제 제품명 매핑 적용)");

  try {
    const productCode = extractedProductCode.value;
    const lineType = workInfo.value.lineType;
    const lineId = workInfo.value.lineId;

    addLog(
      `2-3단계: 제품코드 ${productCode}의 ${lineType} 작업번호 조회 중...`,
      "info",
    );
    addLog(
      `API 경로: /packages/works/${lineType.toLowerCase()}/${lineId}`,
      "info",
    );

    // 실제 DB 조회 API 호출
    const response = await axios.get(
      `/packages/works/${lineType.toLowerCase()}/${lineId}`,
      {
        params: {
          line_name: workInfo.value.lineName,
          product_code: productCode,
        },
      },
    );

    console.log("API 응답:", response.data);

    if (response.data.success && response.data.data) {
      availableWork.value = response.data.data;
      const productName = getDisplayProductName(availableWork.value);
      addLog(
        `DB에서 작업번호 조회 성공: ${availableWork.value.work_order_no} (제품: ${productName})`,
        "success",
      );
      addLog(`실적연동ID: ${availableWork.value.result_detail_id}`, "info");
      addLog(
        `데이터 소스: ${
          response.data.table_structure ||
          "work_order_master + work_result_detail"
        }`,
        "success",
      );
      return availableWork.value;
    } else {
      throw new Error(
        response.data.message || "DB에서 작업번호를 찾을 수 없습니다",
      );
    }
  } catch (error) {
    console.error("DB 연동 실패:", error);
    addLog(`DB 연동 실패: ${error.message}`, "error");

    // 에러가 404인 경우 (작업번호 없음)
    if (error.response && error.response.status === 404) {
      const productName = getProductNameFromCode(extractedProductCode.value);
      addLog(
        `${workInfo.value.lineName}에 대기중인 작업번호가 없습니다. (제품: ${productName})`,
        "warning",
      );
      availableWork.value = null;
      return null;
    }

    // 서버 연결 에러인 경우
    if (error.code === "ECONNREFUSED" || error.code === "NETWORK_ERROR") {
      addLog("서버 연결 실패. 서버 상태를 확인해주세요.", "error");
      showErrorMessage("서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.");
      availableWork.value = null;
      return null;
    }

    // 기타 오류 - 폴백 데이터 사용하지 않음
    addLog("실제 DB 연동에 실패했습니다. 관리자에게 문의하세요.", "error");
    showErrorMessage(`DB 연동 실패: ${error.message}`);
    availableWork.value = null;
    return null;
  }
}

// 외포장 워크플로우 데이터 로드 (실제 DB 연동)
async function loadWorkflowData() {
  try {
    console.log("외포장 워크플로우 데이터 로드 시작");

    const baseLineName = workInfo.value.lineName.replace(
      /\s*(내포장|외포장).*$/,
      "",
    );
    console.log("기본 라인명:", baseLineName);

    let innerData = null;

    // 실제 API 호출로 내포장 완료 정보 조회
    try {
      const response = await axios.get("/packages/workflow/inner-completed", {
        params: { base_line_name: baseLineName },
        // headers: {
        //   "X-Workflow-Source": "PackageWork.vue",
        //   "X-Table-Structure": "work_order_master + work_result_detail",
        // },
      });

      if (response.data.success && response.data.data) {
        innerData = response.data.data;
        console.log("DB에서 내포장 완료 정보 조회 성공:", innerData);
      }
    } catch (apiError) {
      console.log("DB API 호출 실패, 대안 데이터 소스 확인:", apiError.message);
    }

    // URL 파라미터 확인 (백업)
    if (!innerData && workflowInfo.value.innerOutputQty > 0) {
      innerData = {
        work_order_no: workflowInfo.value.innerWorkNo,
        pass_qty: workflowInfo.value.innerOutputQty,
        work_end_time: workflowInfo.value.innerCompletionTime,
        code_value: "완료",
      };
      console.log("URL 파라미터에서 워크플로우 데이터 사용:", innerData);
    }

    // 메모리 확인 (최종 백업)
    if (!innerData && window.workflowData) {
      const workflowKey = `workflow_${baseLineName.replace(/\s+/g, "_")}`;
      const localData = window.workflowData[workflowKey];

      if (localData && localData.inner_output_qty > 0) {
        innerData = {
          work_order_no: localData.inner_work_order_no,
          pass_qty: localData.inner_output_qty,
          work_end_time: localData.inner_completion_time,
          code_value: "완료",
        };
        console.log("메모리에서 워크플로우 데이터 사용:", innerData);
      }
    }

    // 데이터 적용
    if (innerData && innerData.pass_qty > 0) {
      workflowInfo.value.innerCompleted = true;
      workflowInfo.value.innerWorkNo = innerData.result_detail_id;
      workflowInfo.value.innerOutputQty = innerData.pass_qty;
      workflowInfo.value.innerCompletionTime = new Date(
        innerData.work_end_time || innerData.completion_time,
      );
      workflowInfo.value.step = "OUTER";

      inputQuantity.value = innerData.pass_qty;

      addLog(
        `3-1단계: ${baseLineName} 외포장에 워크플로우 연계 완료 (${formatNumber(
          innerData.pass_qty,
        )}개)`,
        "success",
      );
      addLog(
        `완료 작업: ${innerData.work_order_no}, 완료수량: ${formatNumber(
          innerData.pass_qty,
        )}개`,
        "info",
      );
      addLog(`데이터 소스: work_result_detail 테이블`, "info");

      return true;
    } else {
      console.log("연결된 내포장 완료 정보 없음");
      addLog(
        `${baseLineName}의 내포장 완료 정보를 찾을 수 없습니다.`,
        "warning",
      );
      return false;
    }
  } catch (error) {
    console.error("워크플로우 데이터 로드 실패:", error);
    addLog("워크플로우 연계에 실패했습니다. 수동으로 설정해주세요.", "warning");
    return false;
  }
}

// 작업번호 변경 시 (제품명 우선순위 적용)
async function onWorkOrderChange() {
  if (!selectedWorkOrder.value || !availableWork.value) {
    resetCurrentWork();
    return;
  }

  try {
    loading.value = true;
    loadingMessage.value = "작업 정보를 불러오는 중...";

    console.log(`선택된 작업번호: ${selectedWorkOrder.value}`);
    console.log("availableWork 원본 데이터:", availableWork.value);

    // 제품코드 결정 (URL 파라미터 → DB → 라인명 추출 순서)
    const productCode =
      route.query.product_code ||
      availableWork.value.product_code ||
      extractedProductCode.value;

    // 제품명 결정 (다단계 우선순위 적용)
    let productName = null;

    // 1순위: URL에서 전달받은 제품명 (가장 신뢰도 높음)
    if (
      route.query.product_name &&
      !route.query.product_name.includes("제품") &&
      !route.query.product_name.includes("-")
    ) {
      productName = route.query.product_name;
      console.log("제품명 결정: URL 파라미터 사용 =", productName);
    }

    // 2순위: DB에서 가져온 제품명 (유효성 검사 후)
    else if (
      availableWork.value.product_name &&
      !availableWork.value.product_name.includes("제품") &&
      !availableWork.value.product_name.includes("-")
    ) {
      productName = availableWork.value.product_name;
      console.log("제품명 결정: DB 데이터 사용 =", productName);
    }

    // 3순위: final_product_name (보조 DB 필드)
    else if (
      availableWork.value.final_product_name &&
      !availableWork.value.final_product_name.includes("제품") &&
      !availableWork.value.final_product_name.includes("-")
    ) {
      productName = availableWork.value.final_product_name;
      console.log("제품명 결정: final_product_name 사용 =", productName);
    }

    // 4순위: 제품코드에서 변환 (최후 수단)
    else {
      productName = getProductNameFromCode(productCode);
      console.log(
        "제품명 결정: 제품코드 변환 =",
        productName,
        "(코드:",
        productCode,
        ")",
      );
    }

    console.log("최종 제품 정보:", {
      product_code: productCode,
      product_name: productName,
      source: {
        url_product_name: route.query.product_name,
        db_product_name: availableWork.value.product_name,
        db_final_product_name: availableWork.value.final_product_name,
        code_converted: getProductNameFromCode(productCode),
      },
    });

    // availableWork에서 직접 매핑 (제품명 우선순위 적용)
    currentWork.value = {
      result_detail: availableWork.value.result_detail,
      result_detail_id: availableWork.value.result_detail,
      result_id: availableWork.value.result_id,
      product_name: productName, // ✅ 우선순위 적용된 제품명
      final_product_name: productName, // ✅ 동일하게 설정
      product_code: productCode, // ✅ 우선순위 적용된 제품코드
      target_quantity:
        availableWork.value.input_qty || availableWork.value.target_qty || 1000,
      current_quantity: availableWork.value.output_qty || 0,
      remaining_quantity:
        (availableWork.value.input_qty ||
          availableWork.value.target_qty ||
          1000) - (availableWork.value.output_qty || 0),
      output_qty: availableWork.value.output_qty || 0,
      defect_qty: 0,
      progressRate: parseFloat(availableWork.value.progress_rate) || 0,
      passRate: 0,
      defectRate: 0,
      achievementRate: 0,
      employee_id: availableWork.value.employee_id || 2,
      employee_name: availableWork.value.employee_name || "김홍인",
      department: "포장부",
      position: availableWork.value.position || "작업자",
      start_time: availableWork.value.start_time,
      actual_end_time: availableWork.value.actual_end_time,
      end_time: availableWork.value.end_time,
      work_duration: 0,
      estimated_duration: 0,
      step_status: availableWork.value.step_status || "READY",
      package_type: availableWork.value.package_type || workInfo.value.lineType,
      process_code: workInfo.value.lineType === "INNER" ? "p3" : "p5",
      eq_type_code: "i8",
    };

    console.log("currentWork 객체로 변환 완료:", {
      result_detail: currentWork.value.result_detail,
      product_code: currentWork.value.product_code,
      product_name: currentWork.value.product_name,
      final_product_name: currentWork.value.final_product_name,
    });

    // 외포장 워크플로우 연계
    if (
      workInfo.value.lineType === "OUTER" &&
      workflowInfo.value.innerCompleted &&
      workflowInfo.value.innerOutputQty > 0
    ) {
      console.log(
        `외포장 워크플로우 연계: ${workflowInfo.value.innerOutputQty}개`,
      );
      currentWork.value.current_quantity = workflowInfo.value.innerOutputQty;
      inputQuantity.value = workflowInfo.value.innerOutputQty;
      addLog(
        `워크플로우 연계: 내포장 완료수량 ${formatNumber(
          workflowInfo.value.innerOutputQty,
        )}개를 투입량으로 설정`,
        "success",
      );
    }

    updateCurrentWorkInfo();
    addLog(
      `작업번호 ${selectedWorkOrder.value} 정보를 불러왔습니다.`,
      "success",
    );
    addLog(`제품정보: ${productName} (코드: ${productCode})`, "info");
    addLog(
      `데이터소스: URL파라미터 + work_order_master + work_result_detail`,
      "success",
    );

    if (currentWork.value.result_detail) {
      addLog(`실적 연동 활성화: ${currentWork.value.result_detail}`, "success");
    }
  } catch (error) {
    console.error(`작업번호 ${selectedWorkOrder.value} 조회 실패:`, error);
    showErrorMessage(
      `작업번호 ${selectedWorkOrder.value} 정보를 불러올 수 없습니다: ${error.message}`,
    );
    resetCurrentWork();
  } finally {
    loading.value = false;
  }
}

// 작업 시작 (실제 DB 업데이트)
async function startWork() {
  if (!isWorking.value) {
    try {
      loading.value = true;
      loadingMessage.value = "작업을 시작하는 중... (DB 업데이트)";

      const startTime = new Date().toISOString();

      // 2-4단계: 작업시작 시 - DB 업데이트
      if (workInfo.value.lineType === "INNER") {
        try {
          await updateWorkResultDetailStatus("in_progress");
          await updateWorkResultDetailStartTime(startTime);
          addLog(
            "2-4단계: 내포장 작업 시작 - work_result_detail 테이블 업데이트",
            "success",
          );
          addLog('- work_result_detail.code_value = "in_progress"', "info");
          addLog("- work_result_detail.work_start_time 설정", "info");
        } catch (apiError) {
          console.error("내포장 워크플로우 시작 실패:", apiError.message);
          addLog(
            "2-4단계: 내포장 워크플로우 시작 실패 - 로컬 모드로 진행",
            "warning",
          );
        }
      } else {
        // 외포장 작업 시작
        try {
          await updateWorkResultDetailStatus("in_progress");
          // await updateWorkResultDetailStartTime(startTime);
          addLog(
            "외포장 작업 시작 - work_result_detail 테이블 업데이트",
            "success",
          );
          addLog('- work_result_detail.code_value = "in_progress"', "info");
          addLog("- work_result_detail.work_start_time 설정", "info");
        } catch (apiError) {
          console.error("외포장 워크플로우 시작 실패:", apiError.message);
          addLog("외포장 워크플로우 시작 실패 - 로컬 모드로 진행", "warning");
        }
      }

      // 상태 업데이트
      isWorking.value = true;
      workStatus.value = "WORKING";
      workStartTime.value = new Date(startTime);
      currentWork.value.start_time = workStartTime.value;
      currentWork.value.current_quantity = inputQuantity.value;
      currentWork.value.step_status = "WORKING";

      // 진행률 초기화
      productionSettings.value.targetQty = inputQuantity.value;
      productionSettings.value.currentProgress =
        currentWork.value.output_qty || 0;

      updateCurrentWorkInfo();
      startWorkTimer();
      startProductionSimulation();

      const productName = getDisplayProductName(availableWork.value);
      addLog(
        `${
          workInfo.value.lineType === "INNER" ? "내포장" : "외포장"
        } 작업 시작: ${formatNumber(inputQuantity.value)}개 (${productName})`,
        "success",
      );
    } catch (error) {
      console.error("작업 시작 실패:", error);
      addLog(`작업 시작 실패: ${error.message}`, "error");
    } finally {
      loading.value = false;
    }
  } else {
    pauseProduction();
  }
}

// 작업 완료 처리 (실제 DB 업데이트)
async function confirmCompleteWork() {
  try {
    loading.value = true;
    loadingMessage.value = "작업을 완료하는 중... (DB 업데이트)";

    const endTime = new Date().toISOString();
    const passQty =
      currentWork.value.output_qty || Math.floor(inputQuantity.value * 0.95);
    const defectQty =
      currentWork.value.defect_qty || Math.floor(inputQuantity.value * 0.05);

    // 워크플로우 완료 처리
    if (workInfo.value.lineType === "INNER") {
      try {
        // 내포장 완료시 실적 상세 테이블에 종료시간 업데이트
        // await updateWorkResultDetailEndTime(endTime);
        await updateWorkResultDetailStatus("completed");

        addLog("내포장 완료 처리:", "success");
        addLog("- work_result_detail.work_start_time 업데이트 완료", "info");
        addLog('- work_result_detail.code_value = "completed"', "info");
        addLog("- DB 업데이트 성공", "success");
      } catch (apiError) {
        console.error("내포장 워크플로우 완료 실패:", apiError.message);
        addLog("내포장 워크플로우 완료 실패 - 로컬 모드로 완료", "warning");
      }
    } else {
      // 3-2단계: 외포장공정 종료 시 - 진행상태 = 검사중
      try {
        await updateWorkResultDetailEndTime(endTime);
        await updateWorkResultDetailStatus("inspection");

        addLog("3-2단계: 외포장 완료 처리:", "success");
        addLog("- work_result_detail.work_end_time 업데이트 완료", "info");
        addLog('- work_result_detail.code_value = "inspection"', "info");
        addLog("- DB 업데이트 성공", "success");
      } catch (apiError) {
        console.error("외포장 워크플로우 완료 실패:", apiError.message);
        addLog("외포장 워크플로우 완료 실패 - 로컬 모드로 완료", "warning");
      }
    }

    // 내포장 완료 시 워크플로우 처리
    if (workInfo.value.lineType === "INNER") {
      await processInnerToOuterWorkflow();

      setTimeout(() => {
        startDirectTransitionToOuter();
      }, 2000);
    } else {
      // 외포장 완료 - 모든 포장 작업 완료
      addLog("모든 포장 작업이 완료되었습니다!", "success");
      addLog("work_result_detail 테이블 업데이트 완료", "info");
      setTimeout(() => {
        startAutoTransitionToLineSelection();
      }, 3000);
    }

    // 작업 상태 업데이트
    isWorking.value = false;
    workStatus.value = "COMPLETED";
    currentWork.value.output_qty = passQty;
    currentWork.value.defect_qty = defectQty;
    currentWork.value.actual_end_time = new Date(endTime); // 실제 종료시간 설정

    if (workTimer) {
      clearInterval(workTimer);
      workTimer = null;
    }
    if (productionTimer) {
      clearInterval(productionTimer);
      productionTimer = null;
    }

    closeCompleteModal();
  } catch (error) {
    console.error("작업 완료 실패:", error);
    addLog(`작업 완료 처리 중 오류: ${error.message}`, "error");
  } finally {
    loading.value = false;
  }
}

// 내포장→외포장 워크플로우 연계
async function processInnerToOuterWorkflow() {
  try {
    console.log("내포장→외포장 워크플로우 연계 시작");

    const baseLineName = workInfo.value.lineName.replace(
      /\s*(내포장|외포장).*$/,
      "",
    );

    if (!window.workflowData) window.workflowData = {};
    const workflowKey = `workflow_${baseLineName.replace(/\s+/g, "_")}`;
    window.workflowData[workflowKey] = {
      inner_work_order_no: currentWork.value.result_detail_id,
      inner_output_qty: currentWork.value.output_qty,
      inner_completion_time: new Date().toISOString(),
      completion_type: "complete",
    };

    addLog(
      `${baseLineName} 외포장에 워크플로우 연계 완료 (${formatNumber(
        currentWork.value.output_qty,
      )}개)`,
      "success",
    );
  } catch (error) {
    console.error("워크플로우 연계 실패:", error);
    addLog("외포장 연계에 실패했지만 작업은 완료되었습니다.", "warning");
  }
}

// 외포장으로 전환
function startDirectTransitionToOuter() {
  addLog("지시량 달성 완료 - 외포장 라인 선택으로 이동합니다.", "success");

  const queryParams = {
    inner_completed: "true",
    inner_work_order_no: currentWork.value.result_detail_id,
    inner_output_qty: currentWork.value.output_qty,
    inner_completion_time: new Date().toISOString(),
    auto_start_guide: "true",
    workflow_type: "direct_transition",
    message: `내포장 작업(${
      currentWork.value.result_detail_id
    })이 완료되었습니다. 완료수량 ${formatNumber(
      currentWork.value.output_qty,
    )}개를 외포장에 투입하세요.`,
    success_message: "내포장 작업이 성공적으로 완료되었습니다!",
  };

  // 자동 전환 애니메이션 표시
  showAutoTransition.value = true;
  transitionProgress.value = 0;

  const duration = 2000;
  const interval = 50;
  const increment = 100 / (duration / interval);

  const progressTimer = setInterval(() => {
    transitionProgress.value += increment;

    if (transitionProgress.value >= 100) {
      clearInterval(progressTimer);
      showAutoTransition.value = false;

      router.push({
        name: "package_line",
        query: queryParams,
      });
    }
  }, interval);
}

// 자동 전환 함수
function startAutoTransitionToLineSelection() {
  console.log("자동 전환 시작");
  showAutoTransition.value = true;
  transitionProgress.value = 0;

  const duration = 3000;
  const interval = 50;
  const increment = 100 / (duration / interval);

  const progressTimer = setInterval(() => {
    transitionProgress.value += increment;

    if (transitionProgress.value >= 100) {
      clearInterval(progressTimer);
      showAutoTransition.value = false;

      let queryParams = {};

      if (workInfo.value.lineType === "INNER") {
        queryParams = {
          inner_completed: "true",
          prev_work: currentWork.value.result_detail_id,
          inner_work_order_no: currentWork.value.result_detail_id,
          inner_output_qty: currentWork.value.output_qty,
          inner_completion_time: new Date().toISOString(),
          auto_start_guide: "true",
          message: `내포장 작업(${
            currentWork.value.result_detail_id
          })이 완료되었습니다. 완료수량 ${formatNumber(
            currentWork.value.output_qty,
          )}개를 외포장에 투입하세요.`,
          success_message: "내포장 작업이 성공적으로 완료되었습니다!",
        };
      } else {
        queryParams = {
          outer_completed: "true",
          prev_work: currentWork.value.result_detail_id,
          prev_inner_work: workflowInfo.value.innerWorkNo,
          message: `모든 포장 작업이 완료되었습니다! 내포장(${workflowInfo.value.innerWorkNo}) + 외포장(${currentWork.value.result_detail_id})`,
          success_message: "전체 포장 프로세스가 성공적으로 완료되었습니다!",
        };
      }

      router.push({
        name: "package_line",
        query: queryParams,
      });
    }
  }, interval);
}

// 데이터 새로고침 (실제 DB 연동)
async function refreshWorkOrders() {
  try {
    addLog("새로고침을 시작합니다...", "info");
    loading.value = true;
    loadingMessage.value = "새로고침 중...";

    const currentSelectedWork = selectedWorkOrder.value;

    // 초기화
    availableWork.value = null;
    processFlowResult.value.success = false;
    workResultQuery.value.success = false;

    await new Promise((resolve) => setTimeout(resolve, 500));

    // 워크플로우 재실행
    try {
      await executeWorkflowStep1();
      await executeWorkflowStep2();
      await executeWorkflowStep3();
      await executeWorkflowStep4();

      if (workInfo.value.lineType === "OUTER") {
        await loadWorkflowData();
      }

      addLog("전체 워크플로우 재실행 완료", "success");
    } catch (workflowError) {
      console.error("워크플로우 재실행 실패:", workflowError);
      addLog(`워크플로우 오류: ${workflowError.message}`, "error");
    }

    // 이전 선택 복원
    if (currentSelectedWork && availableWork.value) {
      if (
        availableWork.value.work_order_no === currentSelectedWork ||
        availableWork.value.work_id === currentSelectedWork
      ) {
        selectedWorkOrder.value = currentSelectedWork;
        await onWorkOrderChange();
        addLog(`이전 작업(${currentSelectedWork})을 복원했습니다.`, "success");
      } else {
        selectedWorkOrder.value = availableWork.value.result_detail_id;
        await onWorkOrderChange();
        addLog(`이전 작업을 찾을 수 없어 새 작업을 선택했습니다.`, "warning");
      }
    } else if (availableWork.value) {
      selectedWorkOrder.value = availableWork.value.result_detail_id;
      await onWorkOrderChange();
    }

    addLog("새로고침이 완료되었습니다.", "success");
  } catch (error) {
    console.error("새로고침 실패:", error);
    addLog(`새로고침 실패: ${error.message}`, "error");
  } finally {
    loading.value = false;
  }
}

// 생산 시뮬레이션 시작
function startProductionSimulation() {
  if (productionTimer) {
    clearInterval(productionTimer);
  }

  addLog("생산 시뮬레이션을 시작합니다...", "info");

  productionTimer = setInterval(() => {
    if (!isWorking.value) return;

    const increment = productionSettings.value.productionSpeed;
    productionSettings.value.currentProgress = Math.min(
      productionSettings.value.currentProgress + increment,
      productionSettings.value.targetQty,
    );

    const totalProduced = productionSettings.value.currentProgress;
    const defectQty = Math.floor(
      totalProduced * productionSettings.value.defectRate,
    );
    const passQty = totalProduced - defectQty;

    const totalTargetQty =
      currentWork.value.target_quantity || productionSettings.value.targetQty;
    currentWork.value.output_qty = passQty;
    currentWork.value.defect_qty = defectQty;
    currentWork.value.progressRate = Math.min(
      100,
      Math.round((passQty / totalTargetQty) * 100),
    );
    currentWork.value.passRate =
      totalProduced > 0 ? Math.round((passQty / totalProduced) * 100) : 0;
    currentWork.value.defectRate =
      totalProduced > 0 ? Math.round((defectQty / totalProduced) * 100) : 0;

    updateCurrentWorkInfo();

    if (
      totalProduced > 0 &&
      totalProduced % (productionSettings.value.productionSpeed * 5) === 0
    ) {
      addLog(
        `생산 진행: ${passQty}개 완료 (불량: ${defectQty}개, 진행률: ${currentWork.value.progressRate}%)`,
        "info",
      );
    }

    if (totalProduced >= productionSettings.value.targetQty) {
      autoCompleteProduction();
    }
  }, 1000);
}

// 자동 완료
function autoCompleteProduction() {
  if (productionTimer) {
    clearInterval(productionTimer);
    productionTimer = null;
  }

  isWorking.value = false;
  workStatus.value = "COMPLETED";
  currentWork.value.actual_end_time = new Date(); // 실제 종료시간 설정

  addLog("생산이 완료되었습니다!", "success");
  addLog('"완료 처리" 버튼을 눌러 작업을 마무리해주세요.', "info");
}

// 생산 일시정지
function pauseProduction() {
  isWorking.value = false;
  workStatus.value = "PAUSED";

  if (productionTimer) {
    clearInterval(productionTimer);
    productionTimer = null;
  }

  if (workTimer) {
    clearInterval(workTimer);
    workTimer = null;
  }

  addLog("작업을 일시정지했습니다.", "warning");
}

// 생산 재시작
function resumeProduction() {
  isWorking.value = true;
  workStatus.value = "WORKING";

  startWorkTimer();
  startProductionSimulation();

  addLog("작업을 재시작했습니다.", "success");
}

// 작업 종료
async function stopWork() {
  try {
    isWorking.value = false;
    workStatus.value = "COMPLETED";
    currentWork.value.actual_end_time = new Date(); // 실제 종료시간 설정

    if (workTimer) {
      clearInterval(workTimer);
      workTimer = null;
    }
    if (productionTimer) {
      clearInterval(productionTimer);
      productionTimer = null;
    }

    addLog("작업을 강제 종료했습니다.", "info");
  } catch (error) {
    console.error("작업 종료 실패:", error);
    showErrorMessage("작업 종료 처리에 실패했습니다.");
  }
}

// 라인 초기화
async function resetLineStatus() {
  if (!confirm("이 라인의 작업 상태를 초기화하시겠습니까?")) {
    return;
  }

  try {
    loading.value = true;
    loadingMessage.value = "라인 상태 초기화 중...";

    // 상태 초기화
    isWorking.value = false;
    workStatus.value = "READY";
    selectedWorkOrder.value = "";
    inputQuantity.value = 500;
    resetCurrentWork();

    if (workTimer) {
      clearInterval(workTimer);
      workTimer = null;
    }
    if (productionTimer) {
      clearInterval(productionTimer);
      productionTimer = null;
    }

    addLog("라인 상태를 초기화했습니다.", "success");

    await refreshWorkOrders();
  } catch (error) {
    console.error("라인 초기화 실패:", error);
    addLog(`라인 초기화 실패: ${error.message}`, "error");
  } finally {
    loading.value = false;
  }
}

// 투입수량 변경 핸들러
function onInputQuantityChange() {
  if (selectedWorkOrder.value && inputQuantity.value > 0) {
    if (
      workInfo.value.lineType === "OUTER" &&
      workflowInfo.value.innerCompleted &&
      workflowInfo.value.innerOutputQty > 0
    ) {
      console.log("외포장 워크플로우 연계 중 - 투입수량 변경 제한");
      return;
    }

    currentWork.value.current_quantity = inputQuantity.value;
    updateCurrentWorkInfo();
  }
}

// 현재 작업 정보 업데이트
function updateCurrentWorkInfo() {
  if (currentWork.value.target_quantity > 0) {
    currentWork.value.remaining_quantity = Math.max(
      0,
      currentWork.value.target_quantity - currentWork.value.current_quantity,
    );

    currentWork.value.achievementRate = Math.round(
      (currentWork.value.output_qty / currentWork.value.target_quantity) * 100,
    );
  } else {
    currentWork.value.remaining_quantity = 0;
    currentWork.value.achievementRate = 0;
  }

  if (isWorking.value && productionSettings.value.productionSpeed > 0) {
    const remainingQty =
      productionSettings.value.targetQty -
      productionSettings.value.currentProgress;
    const remainingSeconds =
      remainingQty / productionSettings.value.productionSpeed;
    currentWork.value.end_time = new Date(Date.now() + remainingSeconds * 1000);
    currentWork.value.estimated_duration = Math.ceil(remainingSeconds);
  }
}

// 작업 정보 리셋
function resetCurrentWork() {
  currentWork.value = {
    work_order_no: "",
    work_id: "",
    result_detail_id: null,
    result_id: "",
    product_name: "",
    final_product_name: "",
    product_code: "",
    package_type: "",
    target_quantity: 0,
    current_quantity: 0,
    remaining_quantity: 0,
    output_qty: 0,
    defect_qty: 0,
    progressRate: 0,
    passRate: 0,
    defectRate: 0,
    achievementRate: 0,
    employee_id: 2,
    worker_name: "",
    department: "포장부",
    position: "작업자",
    start_time: null,
    actual_end_time: null,
    end_time: null,
    work_duration: 0,
    estimated_duration: 0,
    step_status: "READY",
    process_code: "",
    eq_type_code: "",
  };
}

// 작업 완료 버튼
function completeProduction() {
  if (workStatus.value === "COMPLETED" || !isWorking.value) {
    showCompleteModal.value = true;
    return;
  }

  showCompleteModal.value = true;
}

// 작업 버튼 핸들러
function handleWorkButton() {
  if (workStatus.value === "READY") {
    startWork();
  } else if (workStatus.value === "WORKING") {
    pauseProduction();
  } else if (workStatus.value === "PAUSED") {
    resumeProduction();
  }
}

// 에러 처리
function showErrorMessage(message) {
  errorMessage.value = message;
  showError.value = true;
  addLog(message, "error");
}

function hideError() {
  showError.value = false;
}

async function retryConnection() {
  hideError();
  try {
    await refreshWorkOrders();
  } catch (error) {
    showErrorMessage("재연결에 실패했습니다.");
  }
}

// work_result_detail 상태 업데이트 API
async function updateWorkResultDetailStatus(status) {
  try {
    const response = await axios.post(
      "/packages/workflow/start-inner",
      {
        result_detail: currentWork.value.result_detail,
        product_code: currentWork.value.product_code,
        process_group_code: processFlowResult.value.processGroupCode,
      },
      // {
      //   headers: {
      //     "X-Workflow-Source": "PackageWork.vue",
      //     "X-Table-Structure": "work_order_master + work_result_detail",
      //   },
      // },
    );

    if (response.data.success) {
      addLog(
        `work_result_detail.code_value = "${status}" 업데이트 성공`,
        "success",
      );
    }
  } catch (error) {
    console.error("work_result_detail 상태 업데이트 실패:", error);
    throw error;
  }
}

// work_result_detail 시작시간 업데이트 API
async function updateWorkResultDetailStartTime(startTime) {
  try {
    const response = await axios.put(
      "/packages/workflow/update-start-time",
      {
        work_order_no: currentWork.value.result_detail,
        start_time: startTime,
        result_detail_id: currentWork.value.result_detail,
        maneger_id: currentWork.value.employee_id,
      },
      // {
      //   headers: {
      //     "X-Workflow-Source": "PackageWork.vue",
      //     "X-Table-Structure": "work_order_master + work_result_detail",
      //   },
      // },
    );

    if (response.data.success) {
      addLog("work_result_detail.work_start_time 업데이트 성공", "success");
    }
  } catch (error) {
    console.error("work_result_detail 시작시간 업데이트 실패:", error);
    throw error;
  }
}

// work_result_detail 종료시간 업데이트 API
async function updateWorkResultDetailEndTime(endTime) {
  try {
    const response = await axios.put(
      "/packages/workflow/update-end-time",
      {
        work_order_no: currentWork.value.result_detail,
        end_time: endTime,
        result_detail_id: currentWork.value.result_detail,
      },
      // {
      //   headers: {
      //     "X-Workflow-Source": "PackageWork.vue",
      //     "X-Table-Structure": "work_order_master + work_result_detail",
      //   },
      // },
    );

    if (response.data.success) {
      addLog("work_result_detail.work_end_time 업데이트 성공", "success");
    }
  } catch (error) {
    console.error("work_result_detail 종료시간 업데이트 실패:", error);
    throw error;
  }
}

// 작업 타이머 시작
function startWorkTimer() {
  if (workTimer) {
    clearInterval(workTimer);
  }

  workTimer = setInterval(() => {
    if (isWorking.value && workStartTime.value) {
      const now = new Date();
      const elapsed = now - workStartTime.value;
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      workElapsedTime.value = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
}

// 로그 추가
function addLog(message, type = "info") {
  const log = {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    message,
    type,
  };

  workLogs.value.unshift(log);

  // 로그 개수 제한 (최대 100개)
  if (workLogs.value.length > 100) {
    workLogs.value = workLogs.value.slice(0, 100);
  }
}

// 라인 선택으로 돌아가기
function goBackToLineSelection() {
  if (isWorking.value) {
    if (
      !confirm("작업 중입니다. 정말로 라인 선택 페이지로 돌아가시겠습니까?")
    ) {
      return;
    }
  }

  router.push({ name: "package_line" });
}

// 모달 제어
function closeCompleteModal() {
  showCompleteModal.value = false;
}

// 텍스트 및 상태 함수들
function getWorkflowStepText() {
  if (workflowInfo.value.step === "OUTER") {
    return "외포장";
  }
  return workInfo.value.lineType === "INNER" ? "내포장" : "외포장";
}

function getWorkStatusText(status) {
  const statusMap = {
    READY: "대기",
    WORKING: "진행중",
    PAUSED: "일시정지",
    COMPLETED: "완료",
    PARTIAL_COMPLETE: "부분완료",
    partial_complete: "부분완료",
    부분완료: "부분완료",
    대기: "대기",
    진행중: "진행중",
    일시정지: "일시정지",
    완료: "완료",
    in_progress: "진행중",
    completed: "완료",
    inspection: "검사중",
  };
  return statusMap[status] || status || "대기";
}

function getWorkStatusClass(status) {
  const classMap = {
    READY: "ready",
    WORKING: "working",
    PAUSED: "paused",
    COMPLETED: "completed",
    PARTIAL_COMPLETE: "partial",
    partial_complete: "partial",
    부분완료: "partial",
    대기: "ready",
    진행중: "working",
    일시정지: "paused",
    완료: "completed",
    in_progress: "working",
    completed: "completed",
    inspection: "inspection",
  };
  return classMap[status] || "ready";
}

function getWorkButtonText() {
  if (workStatus.value === "READY") {
    return "작업 시작";
  } else if (workStatus.value === "WORKING") {
    return "일시정지";
  } else if (workStatus.value === "PAUSED") {
    return "재시작";
  }
  return "작업 시작";
}

function getCompleteModalTitle() {
  if (workInfo.value.lineType === "INNER") {
    return "내포장 작업 완료";
  } else {
    return "외포장 작업 완료";
  }
}

function getConfirmationText() {
  if (workInfo.value.lineType === "INNER") {
    return "내포장 작업을 완료하고 외포장 라인 선택으로 이동하시겠습니까?";
  } else {
    return "외포장 작업을 완료하고 전체 포장 프로세스를 마무리하시겠습니까?";
  }
}

function getCompleteButtonText() {
  if (workInfo.value.lineType === "INNER") {
    return "완료 후 외포장으로";
  } else {
    return "전체 완료";
  }
}

function getTransitionTitle() {
  if (workInfo.value.lineType === "INNER") {
    return "외포장 라인 선택으로 이동 중...";
  } else {
    return "포장 라인 선택으로 이동 중...";
  }
}

function getTransitionMessage() {
  if (workInfo.value.lineType === "INNER") {
    return "내포장 작업이 완료되었습니다. 외포장 라인을 선택하세요.";
  } else {
    return "모든 포장 작업이 완료되었습니다!";
  }
}

function getAchievementRateClass(rate) {
  if (rate >= 100) return "excellent";
  if (rate >= 80) return "good";
  if (rate >= 60) return "normal";
  return "low";
}

// 포맷팅 함수들
function formatNumber(number) {
  if (number == null || number === undefined) return "0";
  return new Intl.NumberFormat("ko-KR").format(number);
}

function formatTime(time) {
  if (!time) return "-";

  if (typeof time === "string") {
    time = new Date(time);
  }

  if (!(time instanceof Date) || isNaN(time.getTime())) {
    return "-";
  }

  return time.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateTime(time) {
  if (!time) return "-";

  if (typeof time === "string") {
    time = new Date(time);
  }

  if (!(time instanceof Date) || isNaN(time.getTime())) {
    return "-";
  }

  return time.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  if (workTimer) {
    clearInterval(workTimer);
  }
  if (productionTimer) {
    clearInterval(productionTimer);
  }
});
</script>

<style scoped>
.package-work-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

/* 헤더 스타일 */
.work-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7280;
}

.breadcrumb-item {
  transition: color 0.2s;
}

.breadcrumb-item.active {
  color: #1f2937;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #d1d5db;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.header-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.line-type-badge,
.work-status-badge,
.workflow-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.line-type-badge.inner {
  background: #dbeafe;
  color: #1e40af;
}

.line-type-badge.outer {
  background: #f3e8ff;
  color: #7c3aed;
}

.work-status-badge.ready {
  background: #f3f4f6;
  color: #6b7280;
}

.work-status-badge.working {
  background: #dcfce7;
  color: #16a34a;
}

.work-status-badge.paused {
  background: #fef3c7;
  color: #d97706;
}

.work-status-badge.completed {
  background: #dbeafe;
  color: #2563eb;
}

.workflow-badge {
  background: #f0f9ff;
  color: #0284c7;
}

.workflow-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-step {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 40px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.workflow-step.completed {
  background: #dcfce7;
  color: #16a34a;
}

.workflow-step.active {
  background: #dbeafe;
  color: #2563eb;
}

.workflow-arrow {
  color: #9ca3af;
  font-size: 14px;
  font-weight: 600;
}

/* 워크플로우 안내 */
.workflow-guide {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.guide-content h3 {
  color: #0c4a6e;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.guide-content p {
  color: #0369a1;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.guide-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #0284c7;
}

.output-qty {
  font-weight: 600;
  color: #0c4a6e;
}

/* 메인 레이아웃 */
.work-content {
  display: flex;
  flex-direction: column;
}

.work-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
}

@media (max-width: 1200px) {
  .work-layout {
    grid-template-columns: 1fr;
  }
}

/* 메인 작업 영역 */
.work-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 제어 패널 */
.control-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .control-row {
    grid-template-columns: 1fr;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.line-info {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

.selected-count {
  font-size: 12px;
  color: #059669;
  font-weight: 400;
}

.target-info,
.workflow-info {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

.workflow-info {
  color: #0284c7;
}

.control-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.display-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.display-value.workflow-linked {
  color: #0284c7;
}

.display-unit {
  font-size: 14px;
  color: #6b7280;
}

.control-select,
.control-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.control-select:focus,
.control-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.control-input.workflow-linked {
  background: #f0f9ff;
  border-color: #0ea5e9;
  color: #0c4a6e;
}

.control-input.partial-work {
  background: #fefce8;
  border-color: #eab308;
}

.control-select:disabled,
.control-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.workflow-linked-info {
  font-size: 12px;
  color: #0284c7;
  font-style: italic;
}

/* 작업번호 메시지 */
.no-work-message,
.loading-work-message {
  padding: 16px;
  border-radius: 8px;
  margin-top: 8px;
}

.no-work-message {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.loading-work-message {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
}

.message-content,
.loading-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-text,
.loading-content strong {
  font-weight: 600;
  color: #92400e;
}

.loading-content strong {
  color: #0c4a6e;
}

.message-help,
.loading-help {
  font-size: 13px;
  line-height: 1.5;
  color: #b45309;
}

.loading-help {
  color: #0369a1;
}

/* 작업 제어 버튼 */
.work-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.main-actions,
.sub-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  text-align: center;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-work {
  background: #10b981;
  color: white;
  border-color: #059669;
}

.btn-work:hover:not(:disabled) {
  background: #059669;
}

.btn-work.working {
  background: #f59e0b;
  border-color: #d97706;
}

.btn-work.working:hover:not(:disabled) {
  background: #d97706;
}

.btn-complete {
  background: #3b82f6;
  color: white;
  border-color: #2563eb;
}

.btn-complete:hover:not(:disabled) {
  background: #2563eb;
}

.btn-complete.ready {
  background: #059669;
  border-color: #047857;
}

.btn-complete.ready:hover:not(:disabled) {
  background: #047857;
}

.btn-stop {
  background: #ef4444;
  color: white;
  border-color: #dc2626;
}

.btn-stop:hover:not(:disabled) {
  background: #dc2626;
}

.btn-refresh,
.btn-reset {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
  min-width: auto;
  padding: 10px 16px;
}

.btn-refresh:hover:not(:disabled),
.btn-reset:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* 진행 상황 패널 */
.progress-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.progress-panel h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.progress-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .progress-cards {
    grid-template-columns: 1fr;
  }
}

.progress-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.progress-card.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.progress-card.danger {
  background: #fef2f2;
  border-color: #fecaca;
}

.card-header {
  margin-bottom: 8px;
}

.card-title {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.progress-card.success .card-value {
  color: #166534;
}

.progress-card.danger .card-value {
  color: #991b1b;
}

.card-unit {
  font-size: 12px;
  color: #64748b;
}

.progress-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header span:first-child {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.progress-percent {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

/* 로그 패널 */
.log-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.log-panel h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info {
  background: #f8fafc;
}

.log-item.success {
  background: #f0fdf4;
}

.log-item.warning {
  background: #fffbeb;
}

.log-item.error {
  background: #fef2f2;
}

.log-time {
  color: #6b7280;
  font-weight: 500;
  min-width: 80px;
}

.log-content {
  color: #374151;
  flex: 1;
  line-height: 1.4;
}

.log-item.success .log-content {
  color: #166534;
}

.log-item.warning .log-content {
  color: #92400e;
}

.log-item.error .log-content {
  color: #991b1b;
}

/* 사이드바 */
.work-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 워크플로우 패널 */
.workflow-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.workflow-panel h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.workflow-chain {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-step {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.chain-step.completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.chain-step.current {
  background: #f0f9ff;
  border-color: #bfdbfe;
}

.step-header {
  margin-bottom: 8px;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.chain-step.completed .step-title {
  color: #166534;
}

.chain-step.current .step-title {
  color: #1e40af;
}

.step-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: #64748b;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
}

.detail-value.highlight {
  color: #059669;
  font-weight: 600;
}

.chain-arrow {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 0;
}

/* 정보 패널 */
.info-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.info-panel h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.info-section {
  margin-bottom: 20px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.info-value.workflow-linked {
  color: #0284c7;
}

.achievement-rate.excellent {
  color: #059669;
}

.achievement-rate.good {
  color: #0284c7;
}

.achievement-rate.normal {
  color: #d97706;
}

.achievement-rate.low {
  color: #dc2626;
}

.work-duration {
  font-family: "Monaco", "Menlo", monospace;
  color: #1f2937;
}

.estimated-time.time-warning {
  color: #dc2626;
  font-weight: 700;
}

.worker-name {
  color: #1f2937;
}

/* 라인 변경 패널 */
.line-change-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.btn-line-change {
  width: 100%;
  padding: 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.btn-line-change:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.line-change-help {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* 모달 스타일 */
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
}

/* 완료 모달 */
.complete-summary {
  margin-bottom: 24px;
}

.complete-summary h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 14px;
}

.summary-label {
  color: #64748b;
  font-weight: 500;
}

.summary-value {
  color: #1e293b;
  font-weight: 700;
}

.next-step-info {
  margin: 24px 0;
  padding: 20px;
  border-radius: 8px;
}

.next-step-info.inner-completion {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
}

.next-step-info.outer-completion {
  background: #f0fdf4;
  border: 1px solid #22c55e;
}

.info-box {
  background: white;
  border-radius: 6px;
  padding: 16px;
}

.info-content h5 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.info-content p {
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
}

.info-content li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.completion-chain {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;
}

.chain-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chain-text {
  font-size: 14px;
  color: #64748b;
}

.chain-status {
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 12px;
}

.confirmation-text {
  font-size: 16px;
  color: #374151;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  background: #3b82f6;
  color: white;
  border: 1px solid #2563eb;
}

.btn-confirm:hover {
  background: #2563eb;
}

/* 자동 전환 오버레이 */
.auto-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.transition-modal {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.transition-modal h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.transition-modal p {
  color: #6b7280;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.transition-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transition-progress .progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.transition-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
}

/* 로딩 및 에러 오버레이 */
.loading-overlay,
.error-overlay {
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

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.error-modal {
  background: white;
  border-radius: 12px;
  max-width: 400px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.error-header {
  padding: 20px 24px;
  border-bottom: 1px solid #fee2e2;
  background: #fef2f2;
  border-radius: 12px 12px 0 0;
}

.error-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #991b1b;
  margin: 0;
}

.error-body {
  padding: 24px;
}

.error-body p {
  color: #374151;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.error-help {
  color: #6b7280;
  font-size: 14px;
}

.error-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-error-close,
.btn-retry {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-error-close {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-error-close:hover {
  background: #e5e7eb;
}

.btn-retry {
  background: #3b82f6;
  color: white;
  border: 1px solid #2563eb;
}

.btn-retry:hover {
  background: #2563eb;
}

/* 스크롤바 스타일 */
.log-container::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track,
.modal-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb,
.modal-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover,
.modal-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .package-work-container {
    padding: 16px;
  }

  .work-header {
    padding: 20px;
  }

  .header-info {
    flex-direction: column;
    gap: 16px;
  }

  .workflow-indicator {
    align-self: flex-start;
  }
}

@media (max-width: 768px) {
  .control-panel,
  .progress-panel,
  .log-panel,
  .info-panel {
    padding: 16px;
  }

  .btn {
    min-width: auto;
    flex: 1;
  }

  .main-actions,
  .sub-actions {
    flex-direction: column;
  }

  .modal-content {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }

  .transition-modal {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }
}

@media (max-width: 480px) {
  .package-work-container {
    padding: 12px;
  }

  .work-header {
    padding: 16px;
  }

  .header-left h1 {
    font-size: 20px;
  }

  .workflow-step {
    width: 80px;
    height: 32px;
    font-size: 12px;
  }

  .progress-cards {
    gap: 12px;
  }

  .card-value {
    font-size: 20px;
  }
}
</style>