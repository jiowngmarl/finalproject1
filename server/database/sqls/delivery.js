const workList =
`
    SELECT 
        wm.work_order_no,
        p.product_unit,
        p.product_name,
        p.product_stand,
        wd.work_order_qty AS production_qty,
        wm.order_start_dt
    FROM work_order_master wm
    JOIN work_order_detail wd ON wm.work_order_no = wd.work_order_no
    JOIN product p ON wd.product_code = p.product_code
    WHERE EXISTS (
        SELECT 1
        FROM work_result wr
        JOIN common_code co ON wr.code_value = co.code_value
        WHERE wr.work_order_no = wm.work_order_no
          AND co.code_label = '대기 중'

    )
`
;

const delList =
`
    WITH oldest_lot AS (
      SELECT
        material_code,
        quantity,
        lot_number,
        ROW_NUMBER() OVER (PARTITION BY material_code ORDER BY received_date ASC) AS rn
      FROM material_lot
    )
    SELECT 
    
        wm.work_order_no,
        m.material_code,
        m.material_name,
        wd.work_order_qty AS production_qty,
        m.material_unit,
        (bd.usage_qty * wd.work_order_qty) AS qty,
        IFNULL(ol.quantity, 0) AS quantity,
        IFNULL(ol.lot_number, '-') AS lot_number
    FROM work_order_master wm
    JOIN work_order_detail wd ON wm.work_order_no = wd.work_order_no
    JOIN work_result wr ON wm.work_order_no = wr.work_order_no
    JOIN bom_master bm ON wd.product_code = bm.product_code
    JOIN bom_detail bd ON bm.bom_code = bd.bom_code
    JOIN material m ON bd.material_code = m.material_code
    LEFT JOIN oldest_lot ol ON m.material_code = ol.material_code AND ol.rn = 1
    WHERE wd.work_order_no = ?;
`
;

const insertDel = 
`
  INSERT INTO material_outbound(outbound_id,
                                material_code,
                                outbound_date,
                                outbound_qty,
                                name,
                                lot_number,
                                work_order_no)
  VALUES(?, ?, NOW(), ?, ?, ?, ?)
`
;

const updateMaterial =
` UPDATE material_lot
  SET    quantity = ?
  WHERE  material_code = ?
    AND  lot_number =?
`
;

const updateResult = 
` UPDATE work_result 
  SET    code_value = "p2"
  WHERE  work_order_no = ?
`
;

const delCheckList =
`
  SELECT mo.outbound_id,
        mo.material_code,
        m.material_name,
        m.material_unit,
        m.material_cls,
        mo.outbound_date,
        mo.outbound_qty,
        mo.lot_number
  FROM   material_outbound mo
  JOIN   material m
    ON   mo.material_code = m.material_code;
`
;

module.exports = {
    workList,
    delList,
    insertDel,
    updateMaterial,
    updateResult,
    delCheckList
}