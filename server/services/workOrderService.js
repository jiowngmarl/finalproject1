// server/services/workOrderService.js

const mariadb = require('../database/mapper.js');
const { convertObjToAry } = require('../utils/converts.js');
const { v4: uuidv4 } = require('uuid');

// 제품 검색 (모달용)
const searchProducts = async (searchTerm = '') => {
  return await mariadb.query('searchProducts', [searchTerm, searchTerm, searchTerm])
    .catch(err => {
      throw err;
    });
};

// 작업지시서 검색 (모달용)
const searchWorkOrders = async (searchTerm = '') => {
  return await mariadb.query('searchWorkOrders', [searchTerm, searchTerm, searchTerm])
    .catch(err => {
      throw err;
    });
};

// 계획 검색 (모달용) - 파라미터 수정
const searchPlans = async (searchTerm = '') => {
  return await mariadb.query('searchPlans', [searchTerm, searchTerm])
    .catch(err => {
      throw err;
    });
};

// 계획 정보 상세 조회
const findPlanInfo = async (planId) => {
  return await mariadb.query('getPlanInfo', [planId])
    .catch(err => {
      throw err;
    });
};

// 작업지시서 마스터 정보 조회
const findWorkOrderInfo = async (workOrderNo) => {
  return await mariadb.query('getWorkOrderInfo', [workOrderNo])
    .catch(err => {
      throw err;
    });
};

// 작업지시서 제품 목록 조회
const findWorkOrderProducts = async (workOrderNo) => {
  return await mariadb.query('getWorkOrderProducts', [workOrderNo])
    .catch(err => {
      throw err;
    });
};

// 작업지시서 전체 정보 조회 (마스터 + 제품)
const findWorkOrderDetailFull = async (workOrderNo) => {
  try {
    const masterInfo = await findWorkOrderInfo(workOrderNo);
    const productInfo = await findWorkOrderProducts(workOrderNo);
    
    return {
      master: masterInfo && masterInfo.length > 0 ? masterInfo[0] : null,
      products: productInfo || []
    };
  } catch (err) {
    throw err;
  }
};

// 작업지시서 목록 조회 (불러오기용)
const findWorkOrderList = async (searchTerm = '') => {
  return await mariadb.query('getWorkOrderList', [searchTerm, searchTerm, searchTerm])
    .catch(err => {
      throw err;
    });
};

// 작업지시서 마스터 저장 (신규/수정 통합) - writer_name 제거
const saveWorkOrderMaster = async (workOrderInfo) => {
  const insertColumns = [
    'work_order_no', 'plan_id', 'writer_id', 'write_date',
    'order_start_dt', 'order_end_dt', 'order_remark'
  ];
  const values = convertObjToAry(workOrderInfo, insertColumns);
  
  return await mariadb.query('saveWorkOrder', values)
    .catch(err => {
      throw err;
    });
};

// 작업지시서 제품 정보 저장 (기존 삭제 후 재입력)
const saveWorkOrderProducts = async (workOrderNo, products) => {
  try {
    // 1. 기존 제품 정보 삭제
    await mariadb.query('deleteWorkOrderProducts', [workOrderNo]);
    
    // 2. 새로운 제품 정보 입력
    for (const product of products) {
      const insertData = [
        workOrderNo,
        product.product_code,
        product.work_order_qty || null,              // ✅ 수량 필드 추가
        product.work_order_priority || null,
        product.order_detail_remark || '',
        product.process_group_code || null
      ];
      await mariadb.query('insertWorkOrderProduct', insertData);
    }
    
    return { success: true };
  } catch (err) {
    throw err;
  }
};


// 작업지시서 번호 자동 생성
const generateWorkOrderNo = async () => {
  try {
    const result = await mariadb.query('generateWorkOrderNo', []);
    
    if (result && result.length > 0 && result[0].next_work_order_no) {
      return result[0].next_work_order_no;
    } else {
      // 기본값 생성 (해당 날짜에 첫 번째 작업지시서인 경우)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return `WO${today}001`;
    }
  } catch (err) {
    // 에러 시 기본값
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `WO${today}001`;
  }
};

// 작업지시서 전체 저장 (마스터 + 제품) - 로그 강화
const saveWorkOrderComplete = async (workOrderData) => {
  try {
    const { master, products } = workOrderData;
    
    // 신규 등록 시 번호가 없으면 자동 생성
    if (!master.work_order_no || master.work_order_no === '') {
      master.work_order_no = await generateWorkOrderNo();
    }
    
    // 1. 마스터 정보 저장 (writer_name은 DB에 저장하지 않음)
    await saveWorkOrderMaster({
      ...master,
      // writer_name 제거 - DB에는 writer_id만 저장
    });
    
    // 2. 제품 정보 저장
    if (products && products.length > 0) {
      await saveWorkOrderProducts(master.work_order_no, products);

      const now = new Date();
      const yyyyMMdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

      for (const product of products) {
        let attempt = 0;
        let resultId;
        let insertSuccess = false;

        while (!insertSuccess && attempt < 10) {
          const random = Math.floor(100 + Math.random() * 900);
          resultId = `RE${yyyyMMdd}${random}-${uuidv4().slice(0, 4)}`;
          product.result_id = resultId;

          try {
            await mariadb.query('insertResult', [
              master.work_order_no,
              product.process_group_code,
              resultId,
              product.work_order_date,
            ]);
            insertSuccess = true;
          } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              attempt++;
            } else {
              throw err;
            }
          }
        }

        if (!insertSuccess) {
          continue;
        }

        const processCodes = await getProcessCodesByGroup(product.process_group_code, product.process_seq);
        if (Array.isArray(processCodes) && processCodes.length > 0) {
          await saveWorkResultDetails(resultId, processCodes);
        }
      }
      
      // ✅ 여기서 order_id 조회 및 상태 업데이트
      const productCode = products[0]?.product_code;
      if (productCode) {
        // 1. product_code로 order_id 조회
        const orderInfo = await mariadb.query("getOrderIdByProductCode", [productCode]);
        const orderId = orderInfo?.[0]?.order_id;

        if (orderId) {
          // 2. order_id 기준 상태 업데이트
          await mariadb.query("updateOrderStatusToProcessing", [orderId]);
        }
      }
    }
    
    return { 
      success: true, 
      message: '작업지시서 저장 완료',
      work_order_no: master.work_order_no
    };
  } catch (err) {
    throw err;
  }
};

const saveWorkResultDetails = async (resultId, processCodes) => {
  try {
    // 2. 새로운 제품 정보 입력
    for (const process of processCodes) {
      const insertData = [
        resultId,
        process.process_code,
        process.process_seq,
        process.code_value
      ];
      await mariadb.query('insertResultDetail', insertData);
    }
    
    return { success: true };
  } catch (err) {
    throw err;
  }
};

// 공정흐름도 조회 
const getProcessCodesByGroup = async (processGroupCode) => {
  return await mariadb.query('getProcessCodesByGroupQuery', processGroupCode)
    .catch(err => {
      throw err;
    });
};

// 작업지시서 조회 페이지 
const getWorkOrderListPage = async (searchConditions = {}) => {
  try {
    const {
      workOrderNo = '',
      productName = '',
      writeDate = '',
      startDate = '',
      endDate = ''
    } = searchConditions;

    return await mariadb.query('getWorkOrderListPage', [
      workOrderNo, workOrderNo,     // 작업지시서번호 
      productName, productName,     // 제품명 
      writeDate, writeDate,         // 작성일 
      startDate, startDate,         // 시작예정일 
      endDate, endDate              // 종료예정일 
    ]);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  // 검색 관련
  searchProducts,
  searchWorkOrders,
  searchPlans,
  
  // 조회 관련
  findPlanInfo,
  findWorkOrderInfo,
  findWorkOrderProducts,
  findWorkOrderDetailFull,
  findWorkOrderList,
  
  // 저장 관련
  saveWorkOrderMaster,
  saveWorkOrderProducts,
  saveWorkOrderComplete,

  // 번호 생성
  generateWorkOrderNo,

  // 조회 페이지
  getWorkOrderListPage,
};