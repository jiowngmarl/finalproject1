<template>
  <div class="mrp-page">
    <h2 class="page-title">MRP 계산</h2>

    <!-- 생산계획 테이블 -->
    <div class="table-section">
      <h3 class="table-title">생산계획 리스트</h3>
      <va-data-table
        v-model:current-page="page"
        :items="planList"
        :columns="planColumns"
        :per-page="5"
        track-by="plan_id"
      >
        <template #cell(plan_reg_dt)="{ row }">
          {{ formatToKST(row.source.plan_reg_dt) }}
        </template>

        <template #cell(view)="{ row }">
          <va-button
            size="small"
            color="info"
            @click="openDetailModal(row.source)"
          >
            상세보기
          </va-button>
        </template>

        <template #cell(action)="{ row }">
          <va-button size="small" @click="onCalculateMRP(row.source)">
            계산
          </va-button>
        </template>
      </va-data-table>

      <!-- ✅ 여기! 테이블 바로 바깥에 단 한 번만 팝업 추가 -->
      <PlanDetailModal
        :is-open="isDetailModalOpen"
        :products="selectedDetailProducts"
        @close="isDetailModalOpen = false"
      />
    </div>

    <!-- 부족 자재 리스트 -->
    <div class="table-section">
      <h3 class="table-title">부족 자재 리스트</h3>
      <va-data-table
        :items="shortageList"
        :columns="shortageColumns"
        track-by="material_code"
      />
      <div class="button-wrap">
        <va-button :disabled="!selectedPlan" @click="onRegisterOrder">
          발주관리 등록
        </va-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import PlanDetailModal from "../modals/PlanDetailModal.vue";
import { ref, onMounted } from "vue";

interface Plan {
  plan_id: string;
  plan_name: string;
  plan_reg_dt: string;
}

interface Shortage {
  material_code: string;
  material_name: string;
  current_stock_qty: number;
  material_unit: string;
  material_cls: string;
  shortage_qty: number;
}

const allPlans = ref<any[]>([]);
const planList = ref<Plan[]>([]);
const shortageList = ref<Shortage[]>([]);
const selectedPlan = ref<Plan | null>(null);
const page = ref(1);
const isDetailModalOpen = ref(false);
const selectedDetailPlan = ref<Plan | null>(null);
const selectedDetailProducts = ref<any[]>([]);

const planColumns = [
  { key: "plan_id", label: "계획번호" },
  { key: "plan_name", label: "계획명" },
  {
    key: "plan_reg_dt",
    label: "등록일",
    formatter: (value: string) => formatToKST(value),
  },
  { key: "view", label: "상세보기" },
  { key: "action", label: "계산" },
];

const shortageColumns = [
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "current_stock_qty", label: "재고" },
  { key: "material_unit", label: "단위" },
  { key: "material_cls", label: "분류" },
  { key: "total_needed_qty", label: "필요 수량" },
  { key: "material_safty", label: "안재 재고 기준" },
  { key: "shortage_qty", label: "발주 수량" },
];

const openDetailModal = (plan: Plan) => {
  selectedDetailProducts.value = allPlans.value.filter(
    (p) => p.plan_id === plan.plan_id,
  );
  isDetailModalOpen.value = true;
};

const formatToKST = (isoDate: string): string => {
  const date = new Date(isoDate);
  // KST 적용 (UTC+9)
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  const hh = String(kst.getHours()).padStart(2, "0");
  const mi = String(kst.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

const fetchPlans = async () => {
  try {
    const res = await axios.get("/mrps");
    allPlans.value = res.data;

    // plan_id 기준으로 중복 제거된 리스트 만들기
    const uniquePlans = new Map<string, Plan>();
    res.data.forEach((item: any) => {
      if (!uniquePlans.has(item.plan_id)) {
        uniquePlans.set(item.plan_id, {
          plan_id: item.plan_id,
          plan_name: item.plan_name,
          plan_reg_dt: item.plan_reg_dt,
        });
      }
    });
    planList.value = Array.from(uniquePlans.values());
  } catch (err) {
    console.error("계획 조회 실패", err);
  }
};

const onCalculateMRP = async (plan: Plan) => {
  try {
    selectedPlan.value = plan;
    const res = await axios.get(`/mrps/${plan.plan_id}`);
    shortageList.value = res.data;
    console.log("MRP 응답 데이터:", res.data);
  } catch (err) {
    console.error("MRP 계산 실패", err);
  }
};

const onRegisterOrder = async () => {
  if (!selectedPlan.value) {
    alert("먼저 생산계획에서 계산 버튼을 눌러주세요.");
    return;
  }

  const planId = selectedPlan.value.plan_id;

  //부족한 자재가 있음 → 발주 INSERT + is_ordered = 1
  if (shortageList.value.length > 0) {
    try {
      const payload = shortageList.value.map((item) => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}${mm}${dd}`;
        const random = Math.floor(100 + Math.random() * 900);
        const poId = `${item.material_code}-${dateStr}-${random}`;

        return {
          purchase_order_id: poId,
          purchase_order_name: `${item.material_name}-${item.shortage_qty}`,
          purchase_order_quantity: item.shortage_qty,
          material_code: item.material_code,
        };
      });

      console.log("발주내용:", payload);
      try {
        const res = await axios.post("/puOrder", payload); // ← 발주 테이블에 insert
        const red = await axios.put(`/mrps/${planId}`); // ← plan_master 업데이트
        console.log(res.data);
        console.log(red.data);
        if (res.data.isSuccessed && red.data.isUpdated) {
          alert("부족 자재 등록 완료!");
          await fetchPlans();
          shortageList.value = []; // ✅ 등록 후 부족 자재 리스트 초기화
          selectedPlan.value = null; // 선택된 생산계획도 초기화 (선택 해제)
        } else {
          alert("등록 실패");
        }
      } catch (err) {
        console.error("등록 실패:", err);
        alert("서버 오류 발생!");
      }
    } catch (err) {
      console.error("발주 등록 실패:", err);
      alert("발주 등록 중 오류가 발생했습니다.");
    }
  }
  //부족한 자재 없음 → is_ordered = 1만 업데이트
  else {
    try {
      await axios.put(`/mrps/${planId}`);
      alert("부족한 자재가 없어 발주 없이 완료 처리했습니다.");
    } catch (err) {
      console.error("is_ordered 업데이트 실패:", err);
      alert("처리 중 오류가 발생했습니다.");
    }
  }
};

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
.mrp-page {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.table-section {
  margin-bottom: 2rem;
}

.table-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.button-wrap {
  text-align: right;
  margin-top: 1rem;
}
</style>
