<template>
  <div class="receipt-page">
    <h2 class="page-title">자재 입고</h2>

    <!-- 발주 리스트 -->
    <div class="table-section">
      <h3 class="table-title">발주 리스트</h3>
      <va-data-table
        :items="orderCheckList"
        :columns="orderColumns"
        :per-page="5"
        :current-page.sync="orderPage"
        track-by="purchase_order_id"
      >
        <template #cell(purchase_order_date)="{ row }">
          {{ formatToKST(row.source.purchase_order_date) }}
        </template>

        <template #cell(receive_qty)="{ row }">
          <va-input
            v-model="row.source.receive_qty"
            type="number"
            min="1"
            placeholder="수령 수"
          />
        </template>

        <template #cell(select)="{ row }">
          <va-checkbox
            :model-value="selectedRows.some(r => r.purchase_order_id === row.source.purchase_order_id)"
            @update:modelValue="checked => {
              if (checked) {
                selectedRows.push(row.source)
              } else {
                const index = selectedRows.findIndex(r => r.purchase_order_id === row.source.purchase_order_id)
                if (index !== -1) selectedRows.splice(index, 1)
              }
            }"
            :disabled="!row.source.receive_qty"
          />
        </template>
      </va-data-table>
      <va-button class="mt-4" @click="handleReceive" :disabled="selectedRows.length === 0">
        선택 항목 수령
      </va-button>
    </div>

    <!-- 자재 입고 등록 -->
    <div class="table-section">
      <h3 class="table-title">입고 자재</h3>
      <va-data-table
        :items="materialOrderList"
        :columns="receiptColumns"
        :per-page="5"
        :current-page.sync="receiptPage"
        track-by="material_code"
      >
        <template #cell(material_expiration_date)="{ row }">
          {{ formatToKST(row.source.material_expiration_date) }}
        </template>

        <template #cell(lot_number)="{ row }">
          {{ generateLotNumber(row.source.material_code) }}
        </template>

        <template #cell(action)="{ row }">
          <va-button size="small" @click="saveMaterialLot(row.source)">입고</va-button>
        </template>
      </va-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'

interface MaterialReceipt {
  purchase_order_id: string
  material_code: string
  material_name: string
  purchase_order_quantity: number
  received_quantity: number
  material_unit: string
  mat_qual_test_status: string
  lot_number: string
  material_expiration_date: string
  purchase_order_date: string
  account_id: string
  account_name: string
  receive_qty?: number
}

const formatToKST = (isoDate: string | null | undefined): string => {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return ''
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}-${String(kst.getDate()).padStart(2, '0')} ${String(kst.getHours()).padStart(2, '0')}:${String(kst.getMinutes()).padStart(2, '0')}`
}

const toDateOnly = (iso: string | null | undefined): string => {
  if (!iso || typeof iso !== 'string' || !iso.includes('T')) return ''
  return iso.split('T')[0]
}

const generateLotNumber = (materialCode: string): string => {
  const now = new Date()
  const yyyyMMdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(100 + Math.random() * 900)
  return `LOT${materialCode}-${yyyyMMdd} - ${random}`
}

const materialOrderList = ref<MaterialReceipt[]>([])
const orderCheckList = ref<MaterialReceipt[]>([])
const orderPage = ref(1)
const receiptPage = ref(1)
const selectedRows = ref<MaterialReceipt[]>([])

const orderColumns = [
  { key: 'select', label: '선택' },
  { key: 'purchase_order_id', label: '발주코드' },
  { key: 'material_code', label: '자재코드' },
  { key: 'material_name', label: '자재명' },
  { key: 'material_unit', label: '단위' },
  { key: 'purchase_order_quantity', label: '발주 수량' },
  { key: 'received_quantity', label: '받은 수량' },
  { key: 'receive_qty', label: '수령 수량' },
  { key: 'purchase_order_date', label: '발주일' },
  { key: 'account_id', label: '거래처코드' },
  { key: 'account_name', label: '거래처명' },
]

const receiptColumns = [
  { key: 'purchase_order_id', label: '발주코드' },
  { key: 'material_code', label: '자재코드' },
  { key: 'material_name', label: '자재명' },
  { key: 'purchase_order_quantity', label: '입고 수량' },
  { key: 'material_unit', label: '단위' },
  { key: 'material_expiration_date', label: '유통기한' },
  { key: 'lot_number', label: 'LOT번호' },
  { key: 'action', label: '입고' },
]

const fetchMaterialsOrder = async () => {
  const res = await axios.get('/materialLot')
  materialOrderList.value = res.data
}

const fetchOrder = async () => {
  const res = await axios.get('/orderCheck')
  orderCheckList.value = res.data
}

const saveMaterialLot = async (item: MaterialReceipt) => {
  const lotNum = generateLotNumber(item.material_code)
  const payload = {
    lot_number: lotNum,
    material_code: item.material_code,
    expiry_date: toDateOnly(item.material_expiration_date),
    quantity: item.purchase_order_quantity,
    purchase_order_id: item.purchase_order_id,
  }

  const res = await axios.post('/materialLot', payload)
  const res2 = await axios.put(`/materialLot/${payload.purchase_order_id}`)
  if (res.data.isSuccessed && res2.data.isUpdated) {
    alert('LOT 등록 완료!')
    await fetchMaterialsOrder()
  } else {
    alert('등록 실패')
  }
}

const handleReceive = async () => {
  for (const item of selectedRows.value) {
    const id = item.purchase_order_id
    const inputQty = Number(item.receive_qty || 0)

    const res1 = await axios.put(`/receiveQty/${id}`, {
      receive_qty: inputQty,
    })

    if (!res1.data.isUpdated) {
      alert(`[${id}] 수령 수량 업데이트 실패`)
      continue
    }

    const res2 = await axios.get(`/orderCheck/${id}`)
    const order = res2.data[0]
    console.log(order.received_quantity);
    console.log(order.purchase_order_quantity);
    console.log(`${id}`);

    if (order.received_quantity === order.purchase_order_quantity) {
      const now = new Date()
      const yyyyMMdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const random = Math.floor(100 + Math.random() * 900)
      const materialQualNum = `QUN-${yyyyMMdd}-${random}`
      

      await axios.put(`/orderCheck/${id}`)
      await axios.post('/qualityTest', {
        material_qual_num: materialQualNum,
        purchase_order_id: id,
        material_code: order.material_code,
      })

      alert(`[${id}] 수령 및 품질검사 등록 완료!`)
    } else {
      alert(`[${id}] 수령 완료! (누적 수령 중)`)
    }
  }

  selectedRows.value = []
  await fetchOrder()
}

onMounted(() => {
  fetchMaterialsOrder()
  fetchOrder()
})
</script>


<style scoped>
.receipt-page {
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
</style>
