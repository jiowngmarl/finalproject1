const express = require('express');
const router = express.Router();
const qualityInsertListService = require('../services/qualityInsertListService');

router.get('/filterOptions', async (req, res) => {
  try {
    const data = await qualityInsertListService.getDistinctFilters();
    res.send(data);
  } catch (err) {
    console.error('필터 옵션 조회 실패:', err);
    res.status(500).send({ error: '서버 오류' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { productCode, workOrderNo, processName } = req.query;
    const data = await qualityInsertListService.searchQualityTests(productCode, workOrderNo, processName);
    res.send(data);
  } catch (err) {
    console.error('검색 실패:', err);
    res.status(500).send({ error: '서버 오류' });
  }
});

module.exports = router;