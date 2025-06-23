const deleteResult = `DELETE FROM work_result WHERE work_order_no = ?;`;

const getProcessCodesByGroupQuery = `
  SELECT process_code,
         process_seq,
         code_value
  FROM   process
  WHERE  process_group_code = ?
`;

const insertResult =
` INSERT INTO work_result (
                           work_order_no,
                           process_group_code,
                           result_id,
                           work_start_date) 
  VALUES (?, ?, ?, ?)
`
;

const endEq =
`
  SELECT code_value,
        code_label
  FROM   common_code
  WHERE  code_group = '0D';
`
;

const materialOutList =
` 
  SELECT DISTINCT
         mo.material_code,
         m.material_name,
         mo.outbound_qty,
         m.material_unit
  FROM   material_outbound mo
  JOIN   material m
    ON   mo.material_code = m.material_code
  JOIN   process_detail pd
    ON   mo.material_code = pd.material_code
  WHERE  pd.process_code = ?

`

const selectResultList = 
`
    SELECT DISTINCT
      wr.result_id,
      wrd.result_remark,
      wrd.result_detail,
      wrd.product_qual_qty,
      wrd.process_defective_qty,
      p.product_name,
      p.product_stand,
      pc.process_code,
      pc.process_name,
      pc.process_time,
      eq.eq_type_code,
      eq.eq_id,
      eq.eq_name,
      eq.eq_run_code,
      eq.stop_reason AS end_reason_code,
      wr.work_start_date,
      wrd.work_start_time,
      wrd.work_end_time,
      wd.work_order_qty,
      wrd.pass_qty,
      cm.code_label AS result_code_label,
      cd.code_label AS detail_code_label,
      cq.code_label,
      wrd.manager_id

    FROM work_result wr
    JOIN work_result_detail wrd ON wr.result_id = wrd.result_id
    JOIN work_order_master wm ON wr.work_order_no = wm.work_order_no
    JOIN work_order_detail wd ON wm.work_order_no = wd.work_order_no
    JOIN process_group pg ON wr.process_group_code = pg.process_group_code
    JOIN process pc ON pc.process_code = wrd.process_code
    JOIN product p ON pg.product_code = p.product_code
    JOIN common_code cm ON wr.code_value = cm.code_value
    JOIN common_code cd ON wrd.code_value = cd.code_value

    JOIN (
      SELECT e1.*
      FROM equipment e1
      WHERE NOT EXISTS (
        SELECT 1 FROM equipment e2
        WHERE e1.eq_type_code = e2.eq_type_code
          AND e1.eq_id > e2.eq_id
      )
    ) eq ON wrd.eq_type_code = eq.eq_type_code

    JOIN common_code cq ON eq.eq_run_code = cq.code_value
    WHERE wm.work_order_no = ?
      AND p.product_stand = ?

    ORDER BY process_code
`
;

const selectNoList =
`
SELECT
    wr.result_id,
    wr.work_order_no,
    p.product_name,
    p.product_stand
  FROM work_result wr
  JOIN process_group pg 
    ON wr.process_group_code = pg.process_group_code
  JOIN product p 
    ON pg.product_code = p.product_code

`
;

const selectProcessList =
`
  SELECT  pc.process_code,
          pc.process_name,
          p.product_name,
          p.product_stand
  FROM    process_group pg
  JOIN    process pc
    ON    pg.process_group_code = pc.process_group_code
  JOIN    product p
    ON    pg.product_code = p.product_code;

`
;

const selectEqList = 
`
  SELECT eq.eq_id,
         eq.eq_name,
         eq.eq_run_code,
         cm.code_label
  FROM   equipment eq
  JOIN   common_code cm
    ON   eq.eq_run_code = cm.code_value 
  WHERE  eq.eq_type_code = ?
`
;

const getOrderIdByProductCode = 
`
SELECT  od.product_code,
		    od.order_id
FROM    order_detail od
JOIN    order_master om
  ON    od.order_id = om.order_id
WHERE   od.product_code = ?
`
;

const insertResultDetail =
`
  INSERT INTO work_result_detail(
                            result_id,
                            process_code,
                            process_seq,
                            eq_type_code)
  VALUES(?, ?, ?, ?)
`
;

const updateOrderStatusToProcessing =
`
  UPDATE order_master
  SET    status = '진행중'
  WHERE  order_id = ?
` 
;

const updateResultStatus =
`
  UPDATE work_result
  SET    code_value = "p3"
  WHERE  result_id = ?
`
;

const updateStart =
`
  UPDATE work_result_detail  
  SET    work_start_time = ?,
         pass_qty = ?,
         manager_id = ?,
         eq_id = ?,
         code_value = "p3"
  WHERE  result_detail = ?
`
;

const updateStop =
`
  UPDATE work_result_detail  
  SET    work_end_time = ?,
         pass_qty = ?,
         result_remark = ?,
         code_value = "p4"
  WHERE  result_detail = ?
`
;

const updateEquipment =
`
  UPDATE equipment 
  SET    eq_run_code = "s1"
  WHERE  eq_id = ?
`
;

const updateStopEq =
`
  UPDATE equipment 
  SET    eq_run_code = "s3",
         stop_reason = ?
  WHERE  eq_id = ?
`

const startResultWork =
`
  UPDATE work_result
  SET    code_value = "p3"
  WHERE  result_id = ?
`

const endResultWork =
`
  UPDATE work_result
  SET    work_end_date =  NOW(),
         code_value = "p5"
  WHERE  result_id = ?
`
;

module.exports = {
  selectResultList,
  insertResult,
  deleteResult,
  selectNoList,
  selectProcessList,
  selectEqList,
  insertResultDetail,
  updateStart,
  updateEquipment,
  updateStop,
  updateStopEq,
  startResultWork,
  endResultWork,
  updateResultStatus,
  getProcessCodesByGroupQuery,
  materialOutList,
  endEq,
  getOrderIdByProductCode,
  updateOrderStatusToProcessing
}