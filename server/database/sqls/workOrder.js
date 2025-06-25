// sqls/workOrder.js 

// 2. 제품 검색 (모달) 
const searchProducts = `SELECT p.product_code, p.product_name, p.product_unit, p.product_stand,
                               (SELECT pg.process_group_code 
                                FROM process_group pg 
                                WHERE pg.product_code = p.product_code 
                                LIMIT 1) as process_group_code
        FROM product p
        WHERE (? = '' OR p.product_name LIKE CONCAT('%', ?, '%') 
                     OR p.product_code LIKE CONCAT('%', ?, '%'))
        ORDER BY p.product_name;`;

// 3. 작업지시서 검색 (모달) - 외 X건 제거하고 product_stand 추가
const searchWorkOrders = `SELECT 
            wom.work_order_no, 
            wom.plan_id, 
            wom.writer_id,
            wom.write_date,
            wom.order_start_dt,
            wom.order_end_dt,
            wom.order_remark,
            e.employee_name as writer_name,
            COALESCE(
                (SELECT GROUP_CONCAT(
                    CONCAT(
                        p2.product_name,
                        CASE 
                            WHEN COALESCE(p2.product_stand, '') != '' 
                            THEN CONCAT(' ', p2.product_stand) 
                            ELSE '' 
                        END,
                        '(', wod2.work_order_qty, ')'
                    )
                    ORDER BY wod2.work_order_priority, wod2.work_order_detail_id
                    SEPARATOR ', '
                )
                FROM work_order_detail wod2 
                LEFT JOIN product p2 ON wod2.product_code = p2.product_code 
                WHERE wod2.work_order_no = wom.work_order_no),
                '제품 정보 없음'
            ) as product_summary
        FROM work_order_master wom
            LEFT JOIN employees e ON wom.writer_id = e.employee_id
            LEFT JOIN work_order_detail wod ON wom.work_order_no = wod.work_order_no
            LEFT JOIN product p ON wod.product_code = p.product_code
        WHERE (? = '' OR wom.work_order_no LIKE CONCAT('%', ?, '%')
                     OR p.product_name LIKE CONCAT('%', ?, '%'))
        GROUP BY wom.work_order_no
        ORDER BY wom.write_date DESC, wom.work_order_no DESC;`;

// 4. 계획 검색 (모달) - 외 X건 제거하고 product_stand 추가
const searchPlans = `SELECT 
    pm.plan_id,
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
            ORDER BY pd2.plan_qty DESC
            SEPARATOR ', '
        )
         FROM production_plan_detail pd2 
         LEFT JOIN product p2 ON pd2.product_code = p2.product_code 
         WHERE pd2.plan_id = pm.plan_id),
        '제품 정보 없음'
    ) as product_summary,
    COALESCE(
        (SELECT SUM(pd5.plan_qty) FROM production_plan_detail pd5 WHERE pd5.plan_id = pm.plan_id), 
        0
    ) as total_qty
FROM production_plan_master pm
WHERE pm.plan_id NOT IN (
        SELECT DISTINCT wom.plan_id 
        FROM work_order_master wom 
        WHERE wom.plan_id IS NOT NULL AND wom.plan_id != ''
    )
    AND (? = '' OR pm.plan_id LIKE CONCAT('%', ?, '%')
               OR EXISTS (
                   SELECT 1 FROM production_plan_detail pd 
                   LEFT JOIN product p ON pd.product_code = p.product_code 
                   WHERE pd.plan_id = pm.plan_id 
                   AND p.product_name LIKE CONCAT('%', ?, '%')
               ))
ORDER BY pm.plan_end_dt ASC;`;

// 5. 계획 정보 불러오기 (계획 시작일, 종료일 추가)
const getPlanInfo = `SELECT 
            pm.plan_id,
            pm.employee_name,
            pm.plan_reg_dt,
            pm.plan_start_dt,
            pm.plan_end_dt,
            pm.plan_remark,
            pd.product_code,
            pd.plan_qty,
            p.product_name,
            p.product_unit,
            p.product_stand,
            (SELECT pg.process_group_code 
             FROM process_group pg 
             WHERE pg.product_code = p.product_code 
             LIMIT 1) as process_group_code
        FROM production_plan_master pm
            LEFT JOIN production_plan_detail pd ON pm.plan_id = pd.plan_id
            LEFT JOIN product p ON pd.product_code = p.product_code
        WHERE pm.plan_id = ?;`;

// 6. 기존 작업지시서 불러오기 (employees 테이블과 조인하여 이름 가져오기)
const getWorkOrderInfo = `SELECT 
            wom.work_order_no,
            wom.plan_id,
            wom.writer_id,
            wom.write_date,
            wom.order_start_dt,
            wom.order_end_dt,
            wom.order_remark,
            e.employee_name as writer_name
        FROM work_order_master wom
            LEFT JOIN employees e ON wom.writer_id = e.employee_id
        WHERE wom.work_order_no = ?;`;

// 7. 작업지시서 제품 목록 조회
const getWorkOrderProducts = `SELECT 
            wod.work_order_detail_id,
            wod.product_code,
            wod.work_order_qty,
            wod.work_order_priority,
            wod.order_detail_remark,
            wod.work_order_no,
            wod.process_group_code,
            p.product_name,
            p.product_unit,
            p.product_stand
        FROM work_order_detail wod
            LEFT JOIN product p ON wod.product_code = p.product_code
        WHERE wod.work_order_no = ?
        ORDER BY wod.work_order_priority, wod.work_order_detail_id;`;

// 8. 작업지시서 저장 (writer_id만 저장, writer_name 제거)
const saveWorkOrder = `INSERT INTO work_order_master (
            work_order_no, plan_id, writer_id, write_date,
            order_start_dt, order_end_dt, order_remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            plan_id = VALUES(plan_id),
            writer_id = VALUES(writer_id),
            write_date = VALUES(write_date),
            order_start_dt = VALUES(order_start_dt),
            order_end_dt = VALUES(order_end_dt),
            order_remark = VALUES(order_remark);`;

// 9. 제품 정보 저장
const deleteWorkOrderProducts = `DELETE FROM work_order_detail WHERE work_order_no = ?;`;

const insertWorkOrderProduct = `INSERT INTO work_order_detail (
            work_order_no, product_code, work_order_qty, work_order_priority, 
            order_detail_remark, process_group_code
        ) VALUES (?, ?, ?, ?, ?, ?);`;

// 10. 작업지시서 목록 조회 (employees 테이블과 조인하여 이름 가져오기)
const getWorkOrderList = `SELECT 
            wom.work_order_no, wom.plan_id, wom.write_date,
            wom.order_start_dt, wom.order_end_dt, wom.order_remark,
            e.employee_name as writer_name
        FROM work_order_master wom
            LEFT JOIN employees e ON wom.writer_id = e.employee_id
        WHERE (? = '' OR wom.work_order_no LIKE CONCAT('%', ?, '%')
                     OR wom.order_remark LIKE CONCAT('%', ?, '%'))
        ORDER BY wom.write_date DESC, wom.work_order_no DESC;`;

// 11. 작업지시서 번호 자동 생성
const generateWorkOrderNo = `
  SELECT 
    CONCAT('WO', DATE_FORMAT(NOW(), '%Y%m%d'), 
           LPAD(COALESCE(MAX(CAST(SUBSTRING(work_order_no, 11, 3) AS UNSIGNED)), 0) + 1, 3, '0')
    ) as next_work_order_no
  FROM work_order_master 
  WHERE work_order_no LIKE CONCAT('WO', DATE_FORMAT(NOW(), '%Y%m%d'), '%')
`;

// 12. 작업지시서 조회 페이지 (employees 테이블과 조인하여 이름 가져오기)
const getWorkOrderListPage = `SELECT 
    wom.work_order_no,
    wom.write_date,
    wom.order_start_dt,
    wom.order_end_dt,
    e.employee_name as writer_name,
    COALESCE(
        (SELECT GROUP_CONCAT(
            CONCAT(
                p2.product_name,
                CASE 
                    WHEN COALESCE(p2.product_stand, '') != '' 
                    THEN CONCAT(' ', p2.product_stand) 
                    ELSE '' 
                END,
                '(', wod2.work_order_qty, ')'
            )
            ORDER BY wod2.work_order_priority, wod2.work_order_detail_id
            SEPARATOR ', '
        )
         FROM work_order_detail wod2 
         LEFT JOIN product p2 ON wod2.product_code = p2.product_code 
         WHERE wod2.work_order_no = wom.work_order_no),
        '제품 정보 없음'
    ) as product_summary,
    COALESCE(
        (SELECT SUM(wod3.work_order_qty) 
         FROM work_order_detail wod3 
         WHERE wod3.work_order_no = wom.work_order_no), 
        0
    ) as total_qty
FROM work_order_master wom
    LEFT JOIN employees e ON wom.writer_id = e.employee_id
WHERE (? = '' OR wom.work_order_no LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR EXISTS (
        SELECT 1 FROM work_order_detail wod 
        LEFT JOIN product p ON wod.product_code = p.product_code 
        WHERE wod.work_order_no = wom.work_order_no 
        AND p.product_name LIKE CONCAT('%', ?, '%')
    ))
    AND (? = '' OR DATE(wom.write_date) = ?)
    AND (? = '' OR DATE(wom.order_start_dt) = ?)
    AND (? = '' OR DATE(wom.order_end_dt) = ?)
ORDER BY wom.write_date DESC, wom.work_order_no DESC;`;

// 모든 쿼리 객체 내보내기
module.exports = {
  searchProducts,
  searchWorkOrders,
  searchPlans,
  getPlanInfo,
  getWorkOrderInfo,
  getWorkOrderProducts,
  saveWorkOrder,
  deleteWorkOrderProducts,
  insertWorkOrderProduct,
  getWorkOrderList,
  generateWorkOrderNo,
  getWorkOrderListPage
};