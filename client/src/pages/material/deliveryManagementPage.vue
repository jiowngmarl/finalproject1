<template>
  <div class="mrp-page">
    <h2 class="page-title">자재 출고</h2>

    <!-- 생산계획 테이블 -->
    <div class="table-section">
      <h3 class="table-title">작업지시 리스트</h3>
      <va-data-table
        v-model:current-page="page"
        :items="workList"
        :columns="workColumns"
        :per-page="5"
        track-by="work_order_no"
      >
        <template #cell(order_start_dt)="{ row }">
          {{ formatToKST(row.source.order_start_dt) }}
        </template>

        <template #cell(action)="{ row }">
          <va-button size="small" @click="onCalculateDe(row.source)">
            선택
          </va-button>
        </template>
      </va-data-table>
    </div>

    <!-- 부족 자재 리스트 -->
    <div class="table-section">
      <h3 class="table-title">출고 자재 리스트</h3>
      <va-data-table
        :items="shortageList"
        :columns="shortageColumns"
        track-by="material_code"
      />
      <div class="button-wrap">
        <va-button :disabled="!selectedWork" @click="onDelivery">
          출고
        </va-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ref, onMounted } from "vue";

interface Work {
  work_order_no: string;
  product_unit: string;
  product_name: string;
  product_stand: string;
  production_qty: number;
  order_start_dt: string;
}

interface Shortage {
  work_order_no: string;
  material_code: string;
  material_name: string;
  material_unit: string;
  quantity: number;
  qty: number;
  lot_number: string;
}

const workList = ref<Work[]>([]);
const shortageList = ref<Shortage[]>([]);
const selectedWork = ref<Work | null>(null);
const page = ref(1);

const workColumns = [
  { key: "work_order_no", label: "요청코드" },
  { key: "product_unit", label: "단위" },
  { key: "product_name", label: "제품명" },
  { key: "product_stand", label: "규격" },
  { key: "production_qty", label: "요청수량" },
  {
    key: "order_start_dt",
    label: "요청일자",
    formatter: (value: string) => formatToKST(value),
  },
  { key: "action", label: "선택" },
];

const shortageColumns = [
  { key: "work_order_no", label: "요청코드" },
  { key: "material_code", label: "자재코드" },
  { key: "material_name", label: "자재명" },
  { key: "material_unit", label: "단위" },
  { key: "quantity", label: "재고량" },
  { key: "qty", label: "출고 수량" },
  { key: "lot_number", label: "LOT번호" },
];

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

const fetchWork = async () => {
  try {
    const res = await axios.get("/delivery");
    workList.value = res.data;
    console.log(res.data);
  } catch (err) {
    console.error("계획 조회 실패", err);
  }
};

const onCalculateDe = async (work: Work) => {
  try {
    selectedWork.value = work;
    const res = await axios.get(`/delivery/${work.work_order_no}`);
    shortageList.value = res.data;
    console.log("응답 데이터:", res.data);
  } catch (err) {
    console.error("계산 실패", err);
  }
};

const onDelivery = async (): Promise<void> => {
  if (!selectedWork.value) {
    alert("작업지시를 선택해주세요.");
    return;
  }

  const issuff = shortageList.value.find((item) => item.qty > item.quantity);

  if (issuff) {
    alert(`자재가 부족합니다.! 발주를 넣어주세요.!!!!`);
    return;
  }

  try {
    const payload = [];
    const name = "이승민";
    const workOrderNo = selectedWork.value!.work_order_no;

    for (const item of shortageList.value) {
      const now = new Date();
      const timestamp =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");

      const random = Math.floor(Math.random() * 1000); // 0~999
      const outboundId = `outbound-${timestamp}-${random}`;

      payload.push({
        outbound_id: outboundId,
        work_order_no: workOrderNo,
        material_code: item.material_code,
        outbound_qty: item.qty,
        name,
        lot_number: item.lot_number,
      });
    }

    console.log(payload);

    const res = await axios.post("/delivery", payload); // 출고 이력 등록

    let allUpdated = true;

    for (const item of shortageList.value) {
      try {
        const response = await axios.put(
          `/delivery/${item.material_code}/${item.lot_number}`,
          {
            quantity: item.quantity - item.qty,
          },
        );

        if (!response.data.isSuccessed) {
          allUpdated = false;
        }
      } catch (err) {
        console.error("재고 업데이트 실패:", err);
        allUpdated = false;
      }
    }

    // 작업지시 상태 변경
    const req = await axios.put(
      `/delivery/${selectedWork.value.work_order_no}`,
    );

    if (res.data.isSuccessed && allUpdated && req.data.isUpdated) {
      alert("출고가 완료되었습니다.");
      shortageList.value = [];
      workList.value = [];
      selectedWork.value = null;
    } else {
      alert("출고 처리 중 일부 실패가 발생했습니다.");
    }
  } catch (err) {
    console.error("출고 실패", err);
    alert("출고 중 오류가 발생했습니다.");
  }
};

onMounted(() => {
  fetchWork();
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
