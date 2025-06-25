const selectProductWorkOrdersAndProcessNames = `
SELECT DISTINCT
  p.product_name,
  p.product_code,
  wom.work_order_no,
  pr.process_name
FROM quality_test qt
JOIN product p ON qt.product_code = p.product_code
JOIN work_order_master wom ON qt.work_order_no = wom.work_order_no
JOIN process pr ON qt.process_name = pr.process_name
`;

const searchQualityTestResults = `
SELECT 
  p.product_name,
  qt.work_order_no,
  qt.process_name,
  qt.qual_result,
  qt.insp_value_qty,
  qt.qual_remark
FROM quality_test qt
JOIN product p ON qt.product_code = p.product_code
WHERE (? IS NULL OR qt.product_code = ?)
  AND (? IS NULL OR qt.work_order_no = ?)
  AND (? IS NULL OR qt.process_name = ?)
`;

module.exports = {
  selectProductWorkOrdersAndProcessNames,
  searchQualityTestResults
};