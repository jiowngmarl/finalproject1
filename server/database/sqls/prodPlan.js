// sqls/prodPlan.js - employee_name으로 변경

// 1. 제품 검색 (모달용)
const searchProdPlanProducts = `
  SELECT 
    p.product_code, 
    p.product_name, 
    p.product_unit, 
    p.product_stand,
    COALESCE(pg.process_group_code, '') as process_group_code
  FROM product p
    LEFT JOIN process_group pg ON p.product_code = pg.product_code
  WHERE (? = '' OR p.product_name LIKE CONCAT('%', ?, '%') 
               OR p.product_code LIKE CONCAT('%', ?, '%'))
  ORDER BY p.product_name
`;

// 2. 주문 검색 (모달용) - 제품명 규격(수량) 형식으로 변경
const searchProdPlanOrders = `
  SELECT 
    om.order_id,
    om.account_id,
    om.order_date,
    om.delivery_date,
    om.remarks,
    GROUP_CONCAT(
      CONCAT(
        COALESCE(p.product_name, od.product_code),
        CASE 
          WHEN COALESCE(p.product_stand, '') != '' 
          THEN CONCAT(' ', p.product_stand) 
          ELSE '' 
        END,
        '(', od.order_qty, ')'
      )
      ORDER BY od.order_detail_id
      SEPARATOR ', '
    ) as product_summary,
    SUM(od.order_qty) as total_qty
  FROM order_master om
    LEFT JOIN order_detail od ON om.order_id = od.order_id
    LEFT JOIN product p ON od.product_code = p.product_code
  WHERE om.order_id NOT IN (
          SELECT DISTINCT order_id 
          FROM production_plan_master 
          WHERE order_id IS NOT NULL AND order_id != ''
        )
    AND (? = '' OR om.order_id LIKE CONCAT('%', ?, '%')
               OR COALESCE(om.remarks, '') LIKE CONCAT('%', ?, '%')
               OR DATE_FORMAT(om.order_date, '%Y-%m-%d') LIKE CONCAT('%', ?, '%'))
  GROUP BY om.order_id, om.account_id, om.order_date, om.delivery_date, 
           om.remarks
  ORDER BY om.order_date DESC, om.order_id DESC
`;

// 3. 생산계획 검색 (모달용) 
const searchProdPlanList = `
  SELECT 
    pm.plan_id,
    pm.plan_name,
    pm.employee_name,
    pm.plan_reg_dt,
    pm.plan_start_dt,
    pm.plan_end_dt,
    pm.plan_remark,
    pm.employee_name as writer_name,
    COALESCE(
      (SELECT GROUP_CONCAT(
        CONCAT(
          p2.product_name,
          CASE 
            WHEN COALESCE(p2.product_stand, '') != '' 
            THEN CONCAT(' ', p2.product_stand) 
            ELSE '' 
          END,
          '(', pd2.plan_qty, ')'
        )
        ORDER BY pd2.plan_detail_id
        SEPARATOR ', '
      )
      FROM production_plan_detail pd2 
      LEFT JOIN product p2 ON pd2.product_code = p2.product_code 
      WHERE pd2.plan_id = pm.plan_id),
      '제품없음'
    ) as product_summary,
    COALESCE((SELECT SUM(pd5.plan_qty) FROM production_plan_detail pd5 WHERE pd5.plan_id = pm.plan_id), 0) as total_qty
  FROM production_plan_master pm
  WHERE (? = '' OR pm.plan_id LIKE CONCAT('%', ?, '%')
               OR COALESCE(pm.plan_name, '') LIKE CONCAT('%', ?, '%'))
  ORDER BY pm.plan_reg_dt DESC, pm.plan_id DESC
`;

// 4. 생산계획 마스터 정보 조회 
const getProdPlanInfo = `
  SELECT 
    pm.plan_id,
    pm.plan_name,
    pm.order_id,
    pm.employee_name,
    pm.plan_reg_dt,
    pm.plan_start_dt,
    pm.plan_end_dt,
    pm.plan_remark,
    pm.employee_name as writer_name,
    pd.plan_detail_id,
    pd.product_code,
    pd.plan_qty,
    pd.plan_remark as plan_detail_remark,
    p.product_name,
    p.product_unit,
    p.product_stand,
    COALESCE(pg.process_group_code, '') as process_group_code
  FROM production_plan_master pm
    LEFT JOIN production_plan_detail pd ON pm.plan_id = pd.plan_id
    LEFT JOIN product p ON pd.product_code = p.product_code
    LEFT JOIN process_group pg ON p.product_code = pg.product_code
  WHERE pm.plan_id = ?
  ORDER BY pd.plan_detail_id
`;

// 5. 생산계획 제품 목록 조회
const getProdPlanProducts = `
  SELECT 
    pd.plan_detail_id,
    pd.product_code,
    pd.plan_qty,
    pd.plan_remark as plan_detail_remark,
    pd.plan_id,
    p.product_name,
    p.product_unit,
    p.product_stand,
    COALESCE(pg.process_group_code, '') as process_group_code
  FROM production_plan_detail pd
    LEFT JOIN product p ON pd.product_code = p.product_code
    LEFT JOIN process_group pg ON p.product_code = pg.product_code
  WHERE pd.plan_id = ?
  ORDER BY pd.plan_detail_id
`;

// 6. 생산계획 목록 조회 (불러오기용) 
const getProdPlanList = `
  SELECT 
    pm.plan_id,
    pm.plan_name,
    pm.order_id,
    pm.plan_reg_dt,
    pm.plan_start_dt, 
    pm.plan_end_dt, 
    pm.plan_remark,
    pm.employee_name as writer_name,
    CONCAT(
      COALESCE(
        (SELECT p2.product_name 
         FROM production_plan_detail pd2 
         LEFT JOIN product p2 ON pd2.product_code = p2.product_code 
         WHERE pd2.plan_id = pm.plan_id 
         ORDER BY pd2.plan_detail_id
         LIMIT 1), 
        '제품없음'
      ),
      CASE 
        WHEN (SELECT COUNT(*) FROM production_plan_detail pd3 WHERE pd3.plan_id = pm.plan_id) > 1 
        THEN CONCAT(' 외 ', (SELECT COUNT(*) - 1 FROM production_plan_detail pd4 WHERE pd4.plan_id = pm.plan_id), '건')
        ELSE ''
      END
    ) as product_summary,
    COALESCE((SELECT SUM(pd5.plan_qty) FROM production_plan_detail pd5 WHERE pd5.plan_id = pm.plan_id), 0) as total_qty
  FROM production_plan_master pm
  WHERE (? = '' OR pm.plan_id LIKE CONCAT('%', ?, '%')
               OR COALESCE(pm.plan_name, '') LIKE CONCAT('%', ?, '%')
               OR COALESCE(pm.plan_remark, '') LIKE CONCAT('%', ?, '%'))
  ORDER BY pm.plan_reg_dt DESC, pm.plan_id DESC
`;

// 7. 주문 정보 조회
const getProdPlanOrderInfo = `
  SELECT 
    om.order_id,
    om.account_id,
    om.order_date,
    om.delivery_date,
    om.remarks,
    om.reg_date,
    om.created_by,
    om.complete_date
  FROM order_master om
  WHERE om.order_id = ?
`;

// 8. 주문 제품 목록 조회 
const getProdPlanOrderProducts = `
  SELECT 
    od.order_detail_id,
    od.order_id,
    od.product_code,
    od.order_qty,
    od.delivery_qty,
    od.remain_qty,
    od.remarks,
    od.reg_date,
    om.order_date,      -- order_master에서 가져옴
    om.delivery_date,   -- order_master에서 가져옴
    p.product_name,
    p.product_unit,
    p.product_stand,
    COALESCE(pg.process_group_code, '') as process_group_code
  FROM order_detail od
    LEFT JOIN order_master om ON od.order_id = om.order_id  -- JOIN 추가
    LEFT JOIN product p ON od.product_code = p.product_code
    LEFT JOIN process_group pg ON p.product_code = pg.product_code
  WHERE od.order_id = ?
  ORDER BY od.order_detail_id
`;

// 9. 생산계획 번호 자동 생성 
const generateProdPlanId = `
  SELECT 
    CONCAT('PL', DATE_FORMAT(NOW(), '%Y%m%d'), 
           LPAD(COALESCE(MAX(CAST(RIGHT(plan_id, 3) AS UNSIGNED)), 0) + 1, 3, '0')
    ) as next_plan_id
  FROM production_plan_master 
  WHERE plan_id LIKE CONCAT('PL', DATE_FORMAT(NOW(), '%Y%m%d'), '%')
`;

// 10. 생산계획 마스터 저장 (신규/수정 통합) 
const saveProdPlan = `
  INSERT INTO production_plan_master (
    plan_id, plan_name, order_id, employee_name, plan_reg_dt,
    plan_start_dt, plan_end_dt, plan_remark
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    plan_name = VALUES(plan_name),
    order_id = VALUES(order_id),
    employee_name = VALUES(employee_name),
    plan_reg_dt = VALUES(plan_reg_dt),
    plan_start_dt = VALUES(plan_start_dt),
    plan_end_dt = VALUES(plan_end_dt),
    plan_remark = VALUES(plan_remark)
`;

// 11. 생산계획 제품 정보 저장 
const deleteProdPlanProducts = `DELETE FROM production_plan_detail WHERE plan_id = ?`;

const insertProdPlanProduct = `
  INSERT INTO production_plan_detail (
    plan_id, product_code, plan_qty
  ) VALUES (?, ?, ?);
`;

// 12. 생산계획 통합조회 목록 
const getProdPlanIntegratedList = `
  SELECT 
    pm.plan_id,
    pm.plan_name,
    pm.order_id,
    pm.plan_reg_dt,
    pm.plan_start_dt,
    pm.plan_end_dt,
    pm.plan_remark,
    pm.employee_name,
    pm.employee_name as writer_name,
    
    -- 제품 정보 (제품명 규격(수량) 포함)
    COALESCE(
      (SELECT GROUP_CONCAT(
        CONCAT(
          p2.product_name, 
          CASE 
            WHEN COALESCE(p2.product_stand, '') != '' 
            THEN CONCAT(' ', p2.product_stand) 
            ELSE '' 
          END,
          '(', pd2.plan_qty, ')'
        )
        ORDER BY pd2.plan_detail_id
        SEPARATOR ', '
      )
      FROM production_plan_detail pd2 
      LEFT JOIN product p2 ON pd2.product_code = p2.product_code 
      WHERE pd2.plan_id = pm.plan_id),
      '제품없음'
    ) as product_summary,
    
    -- 전체 계획수량 합계
    COALESCE(
      (SELECT SUM(pd3.plan_qty) FROM production_plan_detail pd3 WHERE pd3.plan_id = pm.plan_id), 
      0
    ) as total_qty

  FROM production_plan_master pm
  WHERE 1=1
    AND (? = '' OR pm.plan_id LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR COALESCE(pm.plan_name, '') LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR EXISTS (
      SELECT 1 FROM production_plan_detail pd
      LEFT JOIN product p ON pd.product_code = p.product_code
      WHERE pd.plan_id = pm.plan_id 
      AND COALESCE(p.product_name, '') LIKE CONCAT('%', ?, '%')
    ))
    AND (? = '' OR DATE(pm.plan_reg_dt) >= ?)
    AND (? = '' OR DATE(pm.plan_reg_dt) <= ?)
    
  ORDER BY pm.plan_reg_dt DESC, pm.plan_id DESC
`;

// 모든 쿼리 객체 내보내기
module.exports = {
  // 검색 관련
  searchProdPlanProducts,
  searchProdPlanOrders,
  searchProdPlanList,
  
  // 조회 관련
  getProdPlanInfo,
  getProdPlanProducts,
  getProdPlanList,
  getProdPlanOrderInfo,
  getProdPlanOrderProducts,
 
  // 저장 관련
  saveProdPlan,
  deleteProdPlanProducts,
  insertProdPlanProduct,
  
  // 번호 생성
  generateProdPlanId,

  // 조회 페이지
  getProdPlanIntegratedList,
};