<template>
  <div class="dashboard-container">
    <h1 class="dashboard-title">제조업 통합 대시보드</h1>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>대시보드 데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <h3>오류 발생</h3>
        <p>{{ error }}</p>
        <button @click="fetchDashboardData" class="retry-button">
          다시 시도
        </button>
      </div>
    </div>

    <!-- 메인 대시보드 콘텐츠 -->
    <div v-else class="dashboard-content">
      <!-- 통계 카드 섹션 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">총 주문 건수</div>
              <div class="stat-sublabel">(이번 달)</div>
              <div class="stat-value">{{ dashboardData.totalOrders }}</div>
              <div class="stat-unit">건</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">설비 가동률</div>
              <div class="stat-sublabel">(현재)</div>
              <div class="stat-value">
                {{ dashboardData.equipmentEfficiency }}
              </div>
              <div class="stat-unit">%</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">평균 납기일</div>
              <div class="stat-sublabel">(이번 달)</div>
              <div class="stat-value">{{ dashboardData.avgDeliveryDays }}</div>
              <div class="stat-unit">일</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">품질 합격률</div>
              <div class="stat-sublabel">(최근 7일)</div>
              <div class="stat-value">{{ dashboardData.qualityPassRate }}</div>
              <div class="stat-unit">%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 섹션 -->
      <div class="charts-section">
        <!-- 첫 번째 행: 월별 생산량 & 설비 가동률 추이 -->
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">월별 생산량 추이</h3>
              <div class="chart-subtitle">최근 6개월</div>
            </div>
            <div class="chart-container">
              <canvas ref="productionChart" width="400" height="200"></canvas>
              <div v-if="productionData.length === 0" class="no-data">
                생산량 데이터가 없습니다
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">설비 가동률 추이</h3>
              <div class="chart-subtitle">최근 6개월</div>
            </div>
            <div class="chart-container">
              <canvas ref="equipmentChart" width="400" height="200"></canvas>
              <div v-if="equipmentData.length === 0" class="no-data">
                설비 가동률 데이터가 없습니다
              </div>
            </div>
          </div>
        </div>

        <!-- 두 번째 행: 제품별 주문 비율 & 공정별 현황 -->
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">제품별 주문 비율</h3>
              <div class="chart-subtitle">이번 달 기준</div>
            </div>
            <div class="chart-container">
              <canvas ref="productChart" width="400" height="350"></canvas>
              <div v-if="productRatioData.length === 0" class="no-data">
                제품별 데이터가 없습니다
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">공정별 현황</h3>
              <div class="chart-subtitle">최근 7일 기준</div>
            </div>
            <div class="process-status">
              <div class="process-item">
                <div class="process-label">자재 준비</div>
                <div class="process-bar">
                  <div
                    class="process-fill"
                    :style="{ width: `${processStatus.material}%` }"
                  ></div>
                </div>
                <div class="process-value">{{ processStatus.material }}%</div>
              </div>

              <div class="process-item">
                <div class="process-label">생산</div>
                <div class="process-bar">
                  <div
                    class="process-fill"
                    :style="{ width: `${processStatus.production}%` }"
                  ></div>
                </div>
                <div class="process-value">{{ processStatus.production }}%</div>
              </div>

              <div class="process-item">
                <div class="process-label">품질검사</div>
                <div class="process-bar">
                  <div
                    class="process-fill"
                    :style="{ width: `${processStatus.quality}%` }"
                  ></div>
                </div>
                <div class="process-value">{{ processStatus.quality }}%</div>
              </div>

              <div class="process-item">
                <div class="process-label">포장</div>
                <div class="process-bar">
                  <div
                    class="process-fill"
                    :style="{ width: `${processStatus.packaging}%` }"
                  ></div>
                </div>
                <div class="process-value">{{ processStatus.packaging }}%</div>
              </div>

              <div class="process-item">
                <div class="process-label">출하</div>
                <div class="process-bar">
                  <div
                    class="process-fill"
                    :style="{ width: `${processStatus.shipping}%` }"
                  ></div>
                </div>
                <div class="process-value">{{ processStatus.shipping }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, computed } from "vue";
import axios from "axios";

// 타입 정의
interface DashboardStats {
  totalOrders: number;
  equipmentEfficiency: number;
  avgDeliveryDays: number;
  qualityPassRate: number;
}

interface ProductionData {
  month: string;
  value: number;
}

interface ProductRatio {
  name: string;
  value: number;
  color: string;
}

interface EquipmentData {
  month: string;
  efficiency: number;
}

interface ProcessStatus {
  material: number;
  production: number;
  quality: number;
  packaging: number;
  shipping: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  productionData: ProductionData[];
  equipmentData: EquipmentData[];
  productRatios: ProductRatio[];
  processStatus: ProcessStatus;
}

// 컴포넌트 설정
const productionChart = ref<HTMLCanvasElement>();
const equipmentChart = ref<HTMLCanvasElement>();
const productChart = ref<HTMLCanvasElement>();

// 상태 관리
const loading = ref(true);
const error = ref<string | null>(null);
const lastUpdatedTime = ref<Date>(new Date());

// 대시보드 데이터
const dashboardData = reactive<DashboardStats>({
  totalOrders: 0,
  equipmentEfficiency: 0,
  avgDeliveryDays: 0,
  qualityPassRate: 0,
});

// 차트 데이터
const productionData = ref<ProductionData[]>([]);
const equipmentData = ref<EquipmentData[]>([]);
const productRatioData = ref<ProductRatio[]>([]);
const processStatus = reactive<ProcessStatus>({
  material: 0,
  production: 0,
  quality: 0,
  packaging: 0,
  shipping: 0,
});

// 계산된 속성
const lastUpdated = computed(() => {
  return lastUpdatedTime.value.toLocaleString("ko-KR");
});

// API 호출 함수 (완전 공개 - 인증 없음)
const fetchDashboardData = async () => {
  try {
    loading.value = true;
    error.value = null;

    console.log("대시보드 데이터 요청 시작 (공개 접근)...");

    // 완전 공개 요청 - 인증 헤더 완전 제거
    const response = await axios.get<DashboardResponse>("/dashboard/summary", {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
      withCredentials: false,
    });

    const data = response.data;

    console.log("받은 데이터 (공개):", data);

    // 통계 데이터 업데이트
    Object.assign(dashboardData, data.stats);

    // 차트 데이터 업데이트
    productionData.value = data.productionData || [];
    equipmentData.value = data.equipmentData || [];
    productRatioData.value = data.productRatios || [];

    // 공정 상태 업데이트
    Object.assign(processStatus, data.processStatus);

    // 마지막 업데이트 시간 갱신
    lastUpdatedTime.value = new Date();

    console.log("대시보드 데이터 로드 완료 (공개 접근)");
  } catch (err: any) {
    console.error("대시보드 데이터 로드 실패:", err);

    // 자세한 에러 정보
    if (err.response) {
      console.error("에러 상세 정보:");
      console.error("- 상태 코드:", err.response.status);
      console.error("- 상태 텍스트:", err.response.statusText);
      console.error("- 응답 데이터:", err.response.data);

      if (err.response.status === 401) {
        error.value =
          "대시보드 접근이 차단되었습니다. 서버 설정을 확인해주세요.";
      } else if (err.response.status === 404) {
        error.value = "대시보드 API를 찾을 수 없습니다.";
      } else {
        error.value = `서버 오류가 발생했습니다. (${err.response.status})`;
      }
    } else if (err.request) {
      console.error("- 네트워크 오류:", err.request);
      error.value = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
    } else {
      console.error("- 설정 오류:", err.message);
      error.value = `요청 설정 오류: ${err.message}`;
    }
  } finally {
    loading.value = false;
  }
};

// 차트 렌더링 함수들
const drawLineChart = (
  canvas: HTMLCanvasElement,
  data: ProductionData[],
  label: string,
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx || data.length === 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  // 배경
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 격자
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();
  }

  // 데이터 라인
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  ctx.strokeStyle = "#4ECDC4";
  ctx.lineWidth = 3;
  ctx.beginPath();

  data.forEach((item, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index;
    const y =
      padding + chartHeight - ((item.value - minValue) / range) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    // 데이터 포인트
    ctx.fillStyle = "#4ECDC4";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 값 표시
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.value.toLocaleString(), x, y - 10);

    // 월 표시
    ctx.fillText(`${item.month}월`, x, canvas.height - 10);
  });

  ctx.stroke();
};

const drawBarChart = (canvas: HTMLCanvasElement, data: any[]) => {
  const ctx = canvas.getContext("2d");
  if (!ctx || data.length === 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  // 배경
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxValue = Math.max(...data.map((d) => d.efficiency || d), 100);
  const barWidth = (chartWidth / data.length) * 0.6;
  const barSpacing = (chartWidth / data.length) * 0.4;

  data.forEach((item, index) => {
    const value = item.efficiency || item;
    const month = item.month || index + 1;

    const barHeight = (value / maxValue) * chartHeight;
    const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
    const y = padding + chartHeight - barHeight;

    // 막대
    ctx.fillStyle =
      value >= 90 ? "#4CAF50" : value >= 70 ? "#FF9800" : "#F44336";
    ctx.fillRect(x, y, barWidth, barHeight);

    // 값 표시
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${value}%`, x + barWidth / 2, y - 5);

    // 월 표시
    ctx.fillText(`${month}월`, x + barWidth / 2, canvas.height - 10);
  });
};

const drawDoughnutChart = (canvas: HTMLCanvasElement, data: ProductRatio[]) => {
  const ctx = canvas.getContext("2d");
  if (!ctx || data.length === 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 차트와 범례 공간 조정
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 30;
  const radius = Math.min(centerX, centerY) - 60;
  const innerRadius = radius * 0.6;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -Math.PI / 2;

  // 도넛 차트 그리기
  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;

    // 도넛 조각
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      currentAngle + sliceAngle,
      currentAngle,
      true,
    );
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    currentAngle += sliceAngle;
  });

  // 범례를 차트 아래쪽에 배치
  const legendStartY = centerY + radius + 20;
  const legendItemHeight = 18;
  const maxItemsPerRow = 2;

  data.forEach((item, index) => {
    const row = Math.floor(index / maxItemsPerRow);
    const col = index % maxItemsPerRow;

    const legendX = 20 + col * 180;
    const legendY = legendStartY + row * legendItemHeight;

    // 범례가 캔버스를 벗어나지 않도록 체크
    if (legendY + legendItemHeight < canvas.height) {
      // 색상 박스
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY, 12, 12);

      // 텍스트
      ctx.fillStyle = "#333";
      ctx.font = "11px Arial";
      ctx.fillText(`${item.name} (${item.value}%)`, legendX + 18, legendY + 9);
    }
  });
};

// 컴포넌트 초기화
onMounted(async () => {
  console.log("Dashboard 컴포넌트 마운트");

  // 대시보드 데이터 로드
  await fetchDashboardData();

  // 데이터 로드 완료 후 차트 렌더링
  if (!loading.value && !error.value) {
    setTimeout(() => {
      renderCharts();
    }, 100);
  }
});

// 차트 렌더링 함수
const renderCharts = () => {
  console.log("차트 렌더링 시작");

  if (productionChart.value && productionData.value.length > 0) {
    drawLineChart(productionChart.value, productionData.value, "생산량");
  }
  if (equipmentChart.value && equipmentData.value.length > 0) {
    drawBarChart(equipmentChart.value, equipmentData.value);
  }
  if (productChart.value && productRatioData.value.length > 0) {
    drawDoughnutChart(productChart.value, productRatioData.value);
  }

  console.log("차트 렌더링 완료");
};
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 에러 상태 */
.error-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.error-message {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-message h3 {
  color: #dc3545;
  margin-bottom: 10px;
}

.retry-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #0056b3;
}

/* 통계 카드 섹션 */
.stats-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-sublabel {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-unit {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

/* 차트 섹션 */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.chart-header {
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.chart-subtitle {
  font-size: 0.8rem;
  color: #666;
}

.chart-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
}

.no-data {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 30px;
  font-size: 0.9rem;
}

/* 공정별 현황 */
.process-status {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 5px 0;
}

.process-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.process-label {
  min-width: 100px;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.process-bar {
  flex: 1;
  height: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.process-fill {
  height: 100%;
  background: #007bff;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.process-value {
  min-width: 40px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  text-align: right;
}

.last-updated {
  color: #666;
  font-size: 0.85rem;
}

/* 반응형 */
@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 15px;
  }

  .chart-card {
    padding: 15px;
  }

  .process-label {
    min-width: 80px;
  }
}
</style>
