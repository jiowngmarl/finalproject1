const mariadb = require('../database/mapper');

const getDistinctFilters = async () => {
  return await mariadb.query('selectProductWorkOrdersAndProcessNames');
};

const searchQualityTests = async (productCode, workOrderNo, processName) => {
  return await mariadb.query('searchQualityTestResults', [
    productCode || null, productCode || null,
    workOrderNo || null, workOrderNo || null,
    processName || null, processName || null
  ]);
};

module.exports = {
  getDistinctFilters,
  searchQualityTests
};