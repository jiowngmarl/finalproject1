// sqls/productInbound.js - 제품 입고 관리 SQL 쿼리

// 1. 입고 대기 목록 조회 (검색 기능 추가, 특정 날짜 검색)
const getInboundWaitingList = `
  SELECT 
    wr.result_id,
    wr.work_order_no,
    wod.product_code,
    p.product_name,
    p.product_unit,
    p.product_stand,
    wrd.pass_qty as inbound_qty,
    DATE_FORMAT(wrd.work_end_time, '%Y-%m-%d') as request_date,
    wrd.work_end_time as manufacture_datetime
  FROM work_result wr
  JOIN work_result_detail wrd ON wr.result_id = wrd.result_id
  JOIN work_order_detail wod ON wr.work_order_no = wod.work_order_no
  LEFT JOIN product p ON wod.product_code = p.product_code
  WHERE 
    -- 작업이 완료된 것들
    wrd.work_end_time IS NOT NULL
    AND wrd.pass_qty > 0
    
    -- 더미 포장품질검사 합격 조건
    AND (1 = 1)
    
    -- 아직 입고되지 않은 제품들만
    AND NOT EXISTS (
      SELECT 1 FROM product_lot pl 
      WHERE pl.result_id = wr.result_id
      AND pl.product_code = wod.product_code
    )
    
    -- 검색 조건 (특정 날짜 검색)
    AND (? = '' OR wr.result_id LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR p.product_name LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR wod.product_code LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR DATE(wrd.work_end_time) = ?)
    
  GROUP BY wr.work_order_no, wod.product_code, wr.result_id
  ORDER BY MAX(wrd.work_end_time) DESC, wr.result_id, wod.product_code
  LIMIT 50
`;

// 2. 제품 입고 처리 (LOT 번호 순차적 생성)
const insertProductInbound = `
  INSERT INTO product_lot (
    lot_num,
    product_code,
    manufacture_date,
    expiry_date,
    quantity,
    inbound_date,
    status,
    result_id
  ) VALUES (
    CONCAT(
      'LOT', 
      DATE_FORMAT(NOW(), '%Y%m%d'), 
      '-', 
      LPAD(
        COALESCE(
          (SELECT MAX(CAST(RIGHT(lot_num, 3) AS UNSIGNED)) + 1
           FROM product_lot pl2 
           WHERE pl2.lot_num LIKE CONCAT('LOT', DATE_FORMAT(NOW(), '%Y%m%d'), '-%')
          ), 
          1
        ), 3, '0'
      )
    ),  -- 순차적 LOT 번호 생성
    ?,  -- product_code
    ?,  -- manufacture_date  
    ?,  -- expiry_date
    ?,  -- quantity
    ?,  -- inbound_date
    ?,  -- status
    ?   -- result_id
  )
`;

// 3. 입고 완료 목록 조회 (특정 날짜 검색)
const getInboundCompletedList = `
  SELECT 
    pl.lot_num,
    pl.product_code,
    p.product_name,
    p.product_unit,
    p.product_stand,
    pl.quantity,
    DATE_FORMAT(pl.manufacture_date, '%Y-%m-%d') as manufacture_date,
    DATE_FORMAT(pl.expiry_date, '%Y-%m-%d') as expiry_date,
    DATE_FORMAT(pl.inbound_date, '%Y-%m-%d %H:%i:%s') as inbound_date,
    pl.status,
    pl.result_id
  FROM product_lot pl
  JOIN product p ON pl.product_code = p.product_code
  WHERE 
    (? = '' OR pl.lot_num LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR p.product_name LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR pl.product_code LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR DATE(pl.inbound_date) = ?)
  ORDER BY pl.inbound_date DESC
  LIMIT 100
`;

// 4. 입고 완료 확인 조회 (LOT 번호 반환 포함)
const getInboundResult = `
  SELECT 
    pl.lot_num,
    pl.product_code,
    p.product_name,
    p.product_unit,
    p.product_stand,
    pl.quantity,
    DATE_FORMAT(pl.manufacture_date, '%Y-%m-%d') as manufacture_date,
    DATE_FORMAT(pl.expiry_date, '%Y-%m-%d') as expiry_date,
    DATE_FORMAT(pl.inbound_date, '%Y-%m-%d %H:%i:%s') as inbound_date,
    pl.status,
    pl.result_id
  FROM product_lot pl
  JOIN product p ON pl.product_code = p.product_code
  WHERE pl.result_id = ? AND pl.product_code = ?
  ORDER BY pl.inbound_date DESC
  LIMIT 1
`;

// 5. 입고 이력 조회 (범위 검색 유지)
const getInboundHistory = `
  SELECT 
    pl.lot_num,
    pl.product_code,
    p.product_name,
    pl.quantity,
    DATE_FORMAT(pl.manufacture_date, '%Y-%m-%d') as manufacture_date,
    DATE_FORMAT(pl.expiry_date, '%Y-%m-%d') as expiry_date,
    DATE_FORMAT(pl.inbound_date, '%Y-%m-%d %H:%i:%s') as inbound_date,
    pl.status,
    pl.result_id
  FROM product_lot pl
  JOIN product p ON pl.product_code = p.product_code
  WHERE 
    (? = '' OR pl.lot_num LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR p.product_name LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR DATE(pl.inbound_date) >= ?)
    AND (? = '' OR DATE(pl.inbound_date) <= ?)
  ORDER BY pl.inbound_date DESC
  LIMIT 100
`;

// 6. 특정 실적의 입고 상태 확인
const checkInboundStatus = `
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM product_lot 
        WHERE result_id = ? AND product_code = ?
      ) THEN '입고완료'
      ELSE '입고대기'
    END as inbound_status
`;

module.exports = {
  getInboundWaitingList,
  insertProductInbound,
  getInboundCompletedList,
  getInboundResult,
  getInboundHistory,
  checkInboundStatus
};