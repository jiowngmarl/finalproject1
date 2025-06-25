// routers/packageRouter.js - p1,p3,p5 3단계 시스템 (정리본)
const express = require('express');
const router = express.Router();
const packageService = require('../services/packageService');

// 헬스체크
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Package API is running (p1,p3,p5 3단계 시스템)',
    timestamp: new Date().toISOString(),
    table_structure: 'work_result_detail + employees',
    workflow_steps: 'p1(대기중) → p3(진행중) → p5(완료)',
    join_relationship: 'work_result_detail.manager_id = employees.employee_id'
  });
});

// ==============================================
// 작업번호 조회 API (p1,p3,p5 3단계)
// ==============================================

// 내포장 라인별 작업번호 조회
router.get('/works/inner/:lineId', async (req, res) => {
  try {
    const { lineId } = req.params;
    const { line_name, product_code } = req.query;
    
    console.log(`=== 내포장 작업번호 조회 API ===`);
    console.log(`라인: ${lineId}, ${line_name}, 제품코드: ${product_code}`);
    
   // const work = await packageService.getInnerWorkByLine(lineId, line_name);
    const work = await packageService.getInnerWorkByProjectKnowledge(product_code); 
    
    if (work) {
      console.log(`내포장 작업번호 조회 성공: ${work.work_order_no}`);
      console.log(`담당자: ${work.employee_name || '담당자미정'}`);
      
      res.json({
        success: true,
        message: `내포장 작업번호 조회 성공: ${work.work_order_no}`,
        data: work,
        line_id: lineId,
        line_name: line_name,
        product_code: work.product_code,
        employee_name: work.employee_name || '담당자미정',
        package_type: 'INNER',
        workflow_source: 'p1,p3,p5 3단계 시스템',
        workflow_steps: [
          '1) 제품코드 추출',
          '2) work_result_detail 조회',
          '3) employees 테이블 조인으로 담당자명 조회',
          '4) code_value IN (p1,p3,p5) 조건으로 조회',
          '5) 대기중인 작업번호 반환'
        ],
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`${lineId} 라인의 내포장 작업번호가 없습니다.`);
      res.json({
        success: false,
        message: `${lineId} 라인의 내포장 작업번호가 없습니다.`,
        data: null,
        line_id: lineId,
        package_type: 'INNER',
        workflow_source: 'p1,p3,p5 3단계 시스템',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (err) {
    console.error(`내포장 작업번호 조회 실패 (${req.params.lineId}):`, err);
    res.status(500).json({
      success: false,
      message: `내포장 작업번호 조회 실패: ${err.message}`,
      error: err.message,
      data: null,
      line_id: req.params.lineId,
      workflow_source: 'p1,p3,p5 3단계 시스템',
      timestamp: new Date().toISOString()
    });
  }
});

// 외포장 라인별 작업번호 조회
router.get('/works/outer/:lineId', async (req, res) => {
  try {
    const { lineId } = req.params;
    const { line_name, product_code } = req.query;
    
    console.log(`=== 외포장 작업번호 조회 API ===`);
    console.log(`라인: ${lineId}, ${line_name}, 제품코드: ${product_code}`);
    
    const work = await packageService.getOuterWorkByLine(lineId, line_name);
    
    if (work) {
      console.log(`외포장 작업번호 조회 성공: ${work.work_order_no}`);
      console.log(`담당자: ${work.employee_name || '담당자미정'}`);
      
      res.json({
        success: true,
        message: `외포장 작업번호 조회 성공: ${work.work_order_no}`,
        data: work,
        line_id: lineId,
        line_name: line_name,
        product_code: work.product_code,
        employee_name: work.employee_name || '담당자미정',
        package_type: 'OUTER',
        workflow_source: 'p1,p3,p5 3단계 시스템',
        workflow_steps: [
          '포장공정에서 p5(완료) 상태 작업 조회',
          'employees 테이블 조인으로 담당자명 조회',
          '외포장 시작 가능한 작업번호 반환'
        ],
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`${lineId} 라인의 외포장 작업번호가 없습니다.`);
      res.json({
        success: false,
        message: `${lineId} 라인의 외포장 작업번호가 없습니다.`,
        data: null,
        line_id: lineId,
        package_type: 'OUTER',
        workflow_source: 'p1,p3,p5 3단계 시스템',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (err) {
    console.error(`외포장 작업번호 조회 실패 (${req.params.lineId}):`, err);
    res.status(500).json({
      success: false,
      message: `외포장 작업번호 조회 실패: ${err.message}`,
      error: err.message,
      data: null,
      line_id: req.params.lineId,
      workflow_source: 'p1,p3,p5 3단계 시스템',
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// 워크플로우 API (p1→p3→p5)
// ==============================================

// 내포장 작업 시작 (p1 → p3)
router.post('/workflow/start-inner', async (req, res) => {
  try {
    const { result_detail, start_time, manager_id, pass_qty, work_order_no, product_code, process_group_code } = req.body;
    
    console.log('내포장 작업 시작 (p1 → p3):', { 
      result_detail, 
      start_time, 
      manager_id, 
      pass_qty, 
      work_order_no, 
      product_code, 
      process_group_code 
    });
    
    // result_detail이 없으면 work_order_no 사용 (호환성)
    const actualResultDetail = result_detail || work_order_no;
    
    // 필수 파라미터 검증
    if (!actualResultDetail) {
      return res.status(400).json({
        success: false,
        message: 'result_detail 또는 work_order_no(작업번호)가 필요합니다.',
        required_params: ['result_detail', 'work_order_no'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    // 작업 시작: p1 → p3
    const result = await packageService.startInnerPackaging(
      actualResultDetail, 
      start_time || new Date(), 
      manager_id, 
      pass_qty || 1000
    );
    
    // 담당자 정보 조회 (성공한 경우에만)
    let employeeInfo = { employee_name: '담당자미정', position: '직급미정' };
    
    if (result.success && manager_id) {
      try {
        const employeeQuery = await packageService.executeQuery(`
          SELECT 
            employee_name,
            position
          FROM tablets.employees 
          WHERE employee_id = ? AND employment_status = 'ACTIVE'
          LIMIT 1
        `, [manager_id]);
        
        if (employeeQuery.length > 0) {
          employeeInfo = employeeQuery[0];
        }
      } catch (empErr) {
        console.warn('담당자 정보 조회 실패:', empErr.message);
      }
    }
    
    res.json({
      success: result.success,
      message: result.success ? '내포장 작업이 시작되었습니다 (p1 → p3)' : result.message || '내포장 작업 시작 실패',
      data: result.data,
      employee_info: employeeInfo,
      error: result.error || null,
      workflow_type: 'inner_packaging_start',
      workflow_step: 'p1(대기중) → p3(진행중)',
      sql_executed: 'UPDATE work_result_detail SET code_value = p3',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      request_params: {
        result_detail: actualResultDetail,
        start_time: start_time || new Date(),
        manager_id,
        pass_qty: pass_qty || 1000,
        original_work_order_no: work_order_no
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('내포장 작업 시작 실패:', err);
    res.status(500).json({
      success: false,
      message: '내포장 작업 시작 중 오류 발생',
      error: err.message,
      data: null,
      workflow_type: 'inner_packaging_start',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      timestamp: new Date().toISOString()
    });
  }
});

// 내포장 작업 완료 (p3 → p5)
router.post('/workflow/complete-inner', async (req, res) => {
  try {
    const { result_detail, end_time, manager_id, pass_qty, work_order_no } = req.body;
    
    console.log('내포장 작업 완료 (p3 → p5):', { 
      result_detail, 
      end_time, 
      manager_id, 
      pass_qty, 
      work_order_no 
    });
    
    // result_detail이 없으면 work_order_no 사용 (호환성)
    const actualResultDetail = result_detail || work_order_no;
    
    // 필수 파라미터 검증
    if (!actualResultDetail) {
      return res.status(400).json({
        success: false,
        message: 'result_detail 또는 work_order_no(작업번호)가 필요합니다.',
        required_params: ['result_detail', 'work_order_no'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    // 내포장 작업 완료: p3 → p5
    const result = await packageService.completeInnerPackaging(
      actualResultDetail, 
      end_time || new Date(), 
      pass_qty || 1000, 
      manager_id
    );
    
    // 담당자 정보 조회 (성공한 경우에만)
    let employeeInfo = { employee_name: '담당자미정', position: '직급미정' };
    
    if (result.success && manager_id) {
      try {
        const employeeQuery = await packageService.executeQuery(`
          SELECT 
            employee_name,
            position
          FROM tablets.employees 
          WHERE employee_id = ? AND employment_status = 'ACTIVE'
          LIMIT 1
        `, [manager_id]);
        
        if (employeeQuery.length > 0) {
          employeeInfo = employeeQuery[0];
        }
      } catch (empErr) {
        console.warn('담당자 정보 조회 실패:', empErr.message);
      }
    }
    
    res.json({
      success: result.success,
      message: result.success ? '내포장 작업이 완료되었습니다 (p3 → p5). 외포장을 시작할 수 있습니다.' : result.message || '내포장 작업 완료 실패',
      data: result.data,
      employee_info: employeeInfo,
      error: result.error || null,
      workflow_type: 'inner_packaging_complete',
      workflow_step: 'p3(진행중) → p5(완료)',
      sql_executed: 'UPDATE work_result_detail SET code_value = p5',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      request_params: {
        result_detail: actualResultDetail,
        end_time: end_time || new Date(),
        manager_id,
        pass_qty: pass_qty || 1000,
        original_work_order_no: work_order_no
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('내포장 작업 완료 실패:', err);
    res.status(500).json({
      success: false,
      message: '내포장 작업 완료 중 오류 발생',
      error: err.message,
      data: null,
      workflow_type: 'inner_packaging_complete',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      timestamp: new Date().toISOString()
    });
  }
});

// 외포장 작업 시작 (현재는 p5 상태에서 별도 처리 - 외포장 워크플로우 구현 필요)
router.post('/workflow/start-outer', async (req, res) => {
  try {
    const { result_detail, start_time, manager_id, pass_qty, work_order_no, product_code, process_group_code, inner_output_qty } = req.body;
    
    console.log('외포장 작업 시작 (별도 워크플로우):', { 
      result_detail, 
      start_time, 
      manager_id, 
      pass_qty, 
      work_order_no, 
      product_code, 
      process_group_code, 
      inner_output_qty 
    });
    
    // result_detail이 없으면 work_order_no 사용 (호환성)
    const actualResultDetail = result_detail || work_order_no;
    
    // 필수 파라미터 검증
    if (!actualResultDetail) {
      return res.status(400).json({
        success: false,
        message: 'result_detail 또는 work_order_no(작업번호)가 필요합니다.',
        required_params: ['result_detail', 'work_order_no'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: false,
      message: '외포장 워크플로우는 p1,p3,p5 3단계 시스템에서 별도 구현이 필요합니다.',
      note: '현재 내포장만 p1→p3→p5 단계로 구현됨. 외포장은 별도 워크플로우 필요.',
      current_system: 'p1(대기중) → p3(진행중) → p5(완료)',
      recommendation: '외포장을 위한 별도 테이블 또는 워크플로우 구현 필요',
      data: null,
      workflow_type: 'outer_packaging_start',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      request_params: {
        result_detail: actualResultDetail,
        start_time: start_time || new Date(),
        manager_id,
        pass_qty: pass_qty || inner_output_qty || 1000,
        original_work_order_no: work_order_no
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('외포장 작업 시작 실패:', err);
    res.status(500).json({
      success: false,
      message: '외포장 작업 시작 중 오류 발생',
      error: err.message,
      data: null,
      workflow_type: 'outer_packaging_start',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      timestamp: new Date().toISOString()
    });
  }
});

// 외포장 작업 완료 (현재는 별도 워크플로우 필요)
router.post('/workflow/complete-outer', async (req, res) => {
  try {
    const { result_detail, end_time, manager_id, pass_qty, defective_qty, work_order_no } = req.body;
    
    console.log('외포장 작업 완료 (별도 워크플로우):', { 
      result_detail, 
      end_time, 
      manager_id, 
      pass_qty, 
      defective_qty, 
      work_order_no 
    });
    
    // result_detail이 없으면 work_order_no 사용 (호환성)
    const actualResultDetail = result_detail || work_order_no;
    
    // 필수 파라미터 검증
    if (!actualResultDetail) {
      return res.status(400).json({
        success: false,
        message: 'result_detail 또는 work_order_no(작업번호)가 필요합니다.',
        required_params: ['result_detail', 'work_order_no'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: false,
      message: '외포장 완료 워크플로우는 p1,p3,p5 3단계 시스템에서 별도 구현이 필요합니다.',
      note: '현재 내포장만 p1→p3→p5 단계로 구현됨. 외포장은 별도 워크플로우 필요.',
      current_system: 'p1(대기중) → p3(진행중) → p5(완료)',
      recommendation: '외포장을 위한 별도 테이블 또는 워크플로우 구현 필요',
      data: null,
      workflow_type: 'outer_packaging_complete',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      request_params: {
        result_detail: actualResultDetail,
        end_time: end_time || new Date(),
        manager_id,
        pass_qty: pass_qty || 1000,
        defective_qty: defective_qty || 0,
        original_work_order_no: work_order_no
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('외포장 작업 완료 실패:', err);
    res.status(500).json({
      success: false,
      message: '외포장 작업 완료 중 오류 발생',
      error: err.message,
      data: null,
      workflow_type: 'outer_packaging_complete',
      workflow_source: 'p1,p3,p5 3단계 시스템',
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// 시간 업데이트 전용 API (상태 변경 없이 시간만 수정)
// ==============================================

// 작업 시작 시간 업데이트 (상태 변경 없음)
router.put('/workflow/update-start-time', async (req, res) => {
  try {
    const { result_detail_id, start_time, manager_id } = req.body;
    
    console.log('작업 시작 시간 업데이트:', {
      result_detail_id,
      start_time,
      manager_id
    });
    
    // 필수 파라미터 검증
    if (!result_detail_id) {
      return res.status(400).json({
        success: false,
        message: 'result_detail_id(작업번호)가 필요합니다.',
        required_params: ['result_detail_id'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!start_time) {
      return res.status(400).json({
        success: false,
        message: 'start_time(시작시간)이 필요합니다.',
        required_params: ['result_detail_id', 'start_time'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    // 현재 상태 확인
    const currentWork = await packageService.executeQuery(`
      SELECT 
        result_detail,
        code_value,
        work_start_time,
        CASE 
          WHEN manager_id REGEXP '^[0-9]+$' THEN e.employee_name
          ELSE COALESCE(manager_id, '담당자미정')
        END as employee_name
      FROM tablets.work_result_detail wrd
      LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
      WHERE result_detail = ?
      AND (process_code LIKE '%Process7%' OR process_seq = 7)
      AND code_value IN ('p1', 'p3', 'p5')
      LIMIT 1
    `, [result_detail_id]);
    
    if (currentWork.length === 0) {
      return res.status(404).json({
        success: false,
        message: `작업번호 ${result_detail_id}를 찾을 수 없습니다.`,
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    const work = currentWork[0];
    
    // 시작 시간만 업데이트 (상태 변경 없음)
    const updateParams = [new Date(start_time)];
    let updateQuery = `
      UPDATE tablets.work_result_detail
      SET work_start_time = ?
    `;
    
    // manager_id가 제공된 경우 함께 업데이트
    if (manager_id) {
      updateQuery += `, manager_id = ?`;
      updateParams.push(manager_id);
    }
    
    updateQuery += `
      WHERE result_detail = ?
      AND (process_code LIKE '%Process7%' OR process_seq = 7)
    `;
    updateParams.push(result_detail_id);
    
    const result = await packageService.executeQuery(updateQuery, updateParams);
    
    console.log(`시작 시간 업데이트 완료: ${result.affectedRows}건`);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: '시작 시간 업데이트에 실패했습니다.',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    // 담당자 정보 조회 (업데이트 후)
    let employeeInfo = { employee_name: '담당자미정', position: '직급미정' };
    if (manager_id) {
      try {
        const employeeQuery = await packageService.executeQuery(`
          SELECT employee_name, position
          FROM tablets.employees 
          WHERE employee_id = ? 
          LIMIT 1
        `, [manager_id]);
        
        if (employeeQuery.length > 0) {
          employeeInfo = employeeQuery[0];
        }
      } catch (empErr) {
        console.warn('담당자 정보 조회 실패:', empErr.message);
      }
    }
    
    res.json({
      success: true,
      message: '작업 시작 시간이 업데이트되었습니다.',
      data: {
        result_detail: result_detail_id,
        previous_start_time: work.work_start_time,
        new_start_time: new Date(start_time),
        current_status: work.code_value,
        manager_id: manager_id,
        updated_fields: manager_id ? ['work_start_time', 'manager_id'] : ['work_start_time']
      },
      employee_info: employeeInfo,
      workflow_type: 'time_update_only',
      note: '상태 변경 없이 시간만 업데이트됨',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('작업 시작 시간 업데이트 실패:', err);
    res.status(500).json({
      success: false,
      message: '작업 시작 시간 업데이트 중 오류 발생',
      error: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

// 작업 종료 시간 업데이트 (상태 변경 없음)
router.put('/workflow/update-end-time', async (req, res) => {
  try {
    const { result_detail_id, end_time, pass_qty, defective_qty, manager_id } = req.body;
    
    console.log('작업 종료 시간 업데이트:', {
      result_detail_id,
      end_time,
      pass_qty,
      defective_qty,
      manager_id
    });
    
    // 필수 파라미터 검증
    if (!result_detail_id) {
      return res.status(400).json({
        success: false,
        message: 'result_detail_id(작업번호)가 필요합니다.',
        required_params: ['result_detail_id'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!end_time) {
      return res.status(400).json({
        success: false,
        message: 'end_time(종료시간)이 필요합니다.',
        required_params: ['result_detail_id', 'end_time'],
        provided_params: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    // 현재 상태 확인
    const currentWork = await packageService.executeQuery(`
      SELECT 
        result_detail,
        code_value,
        work_end_time,
        pass_qty,
        CASE 
          WHEN manager_id REGEXP '^[0-9]+$' THEN e.employee_name
          ELSE COALESCE(manager_id, '담당자미정')
        END as employee_name
      FROM tablets.work_result_detail wrd
      LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
      WHERE result_detail = ?
      AND (process_code LIKE '%Process7%' OR process_seq = 7)
      AND code_value IN ('p1', 'p3', 'p5')
      LIMIT 1
    `, [result_detail_id]);
    
    if (currentWork.length === 0) {
      return res.status(404).json({
        success: false,
        message: `작업번호 ${result_detail_id}를 찾을 수 없습니다.`,
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    const work = currentWork[0];
    
   // 종료 시간 및 관련 데이터 업데이트 (상태 변경 없음)
    const updateParams = [new Date(end_time), 'p5']; // p5 값 추가
    let updateQuery = `
      UPDATE tablets.work_result_detail
      SET work_end_time = ?, 
          code_value = ?    -- p5 (완료 상태)
    `;

    // 선택적 필드들 추가
    if (pass_qty !== undefined) {
      updateQuery += `, pass_qty = ?`;
      updateParams.push(pass_qty);
    }

    if (defective_qty !== undefined) {
      updateQuery += `, defective_qty = ?`;
      updateParams.push(defective_qty);
    }

    if (manager_id) {
      updateQuery += `, manager_id = ?`;
      updateParams.push(manager_id);
    }

    updateQuery += `
      WHERE result_detail = ?
      AND (process_code LIKE '%Process7%' OR process_seq = 7)
    `;
    updateParams.push(result_detail_id);

    const result = await packageService.executeQuery(updateQuery, updateParams);

    console.log(`종료 시간 업데이트 완료: ${result.affectedRows}건`);

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: '종료 시간 업데이트에 실패했습니다.',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    // 담당자 정보 조회 (업데이트 후)
    let employeeInfo = { employee_name: '담당자미정', position: '직급미정' };
    if (manager_id) {
      try {
        const employeeQuery = await packageService.executeQuery(`
          SELECT employee_name, position
          FROM tablets.employees 
          WHERE employee_id = ? AND employment_status = 'ACTIVE'
          LIMIT 1
        `, [manager_id]);
        
        if (employeeQuery.length > 0) {
          employeeInfo = employeeQuery[0];
        }
      } catch (empErr) {
        console.warn('담당자 정보 조회 실패:', empErr.message);
      }
    }
    
    // 업데이트된 필드 목록 생성
    const updatedFields = ['work_end_time'];
    if (pass_qty !== undefined) updatedFields.push('pass_qty');
    if (defective_qty !== undefined) updatedFields.push('defective_qty');
    if (manager_id) updatedFields.push('manager_id');
    
    res.json({
      success: true,
      message: '작업 종료 시간이 업데이트되었습니다.',
      data: {
        result_detail: result_detail_id,
        previous_end_time: work.work_end_time,
        new_end_time: new Date(end_time),
        previous_pass_qty: work.pass_qty,
        new_pass_qty: pass_qty || work.pass_qty,
        current_status: work.code_value,
        manager_id: manager_id,
        updated_fields: updatedFields
      },
      employee_info: employeeInfo,
      workflow_type: 'time_update_only',
      note: '상태 변경 없이 시간과 수량만 업데이트됨',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('작업 종료 시간 업데이트 실패:', err);
    res.status(500).json({
      success: false,
      message: '작업 종료 시간 업데이트 중 오류 발생',
      error: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// 워크플로우 연계 API (내포장 → 외포장)
// ==============================================

// 내포장 완료 정보 조회 (외포장 워크플로우 연계용)
router.get('/workflow/inner-completed', async (req, res) => {
  try {
    const { base_line_name, line_id } = req.query;
    
    console.log(`=== 내포장 완료 정보 조회 (외포장 연계용) ===`);
    console.log(`기본 라인명: ${base_line_name}, 라인ID: ${line_id}`);
    
    if (!base_line_name) {
      return res.status(400).json({
        success: false,
        message: 'base_line_name 파라미터가 필요합니다.',
        required_params: ['base_line_name'],
        provided_params: req.query,
        timestamp: new Date().toISOString()
      });
    }
    
    // 기본 라인명으로 제품코드 추출
    const productCode = packageService.extractProductCodeFromLine(base_line_name);
    console.log(`추출된 제품코드: ${productCode}`);
    
    // p5(완료) 상태인 내포장 작업 조회
    const completedInnerWork = await packageService.executeQuery(`
      SELECT 
        wrd.result_detail,
        wrd.result_id,
        wrd.process_code,
        wrd.code_value,
        wrd.work_start_time,
        wrd.work_end_time,
        wrd.pass_qty,
        wrd.process_seq,
        CASE 
          WHEN wrd.manager_id REGEXP '^[0-9]+$' THEN e.employee_name
          ELSE COALESCE(wrd.manager_id, '담당자미정')
        END as employee_name,
        e.position as employee_position
      FROM tablets.work_result_detail wrd
      LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
      WHERE (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
      AND wrd.result_detail IS NOT NULL
      AND (wrd.process_code LIKE ? OR wrd.process_code LIKE 'BJA-STD-10%')
      AND wrd.code_value = 'p5'  -- 완료 상태만
      ORDER BY wrd.work_end_time DESC
      LIMIT 5
    `, [`%${productCode}%`]);
    
    if (completedInnerWork.length > 0) {
      const work = completedInnerWork[0]; // 가장 최근 완료 작업
      
      console.log('내포장 완료 작업 발견:', work);
      
      const responseData = {
        success: true,
        message: `${base_line_name} 라인의 내포장 완료 정보 조회 성공`,
        data: {
          // 프론트엔드에서 기대하는 필드명
          result_detail_id: work.result_detail,
          work_order_no: work.result_detail,
          result_id: work.result_id,
          pass_qty: work.pass_qty,
          work_end_time: work.work_end_time,
          completion_time: work.work_end_time,
          code_value: work.code_value,
          status_korean: '완료',
          process_code: work.process_code,
          employee_name: work.employee_name,
          employee_position: work.employee_position,
          // 외포장 연계를 위한 추가 정보
          product_code: productCode,
          product_name: packageService.getProductNameFromCode(productCode),
          base_line_name: base_line_name,
          workflow_ready: true,
          next_step: '외포장 시작 가능 (별도 워크플로우 필요)'
        },
        metadata: {
          base_line_name: base_line_name,
          product_code: productCode,
          search_condition: 'code_value = p5 (완료)',
          total_completed_works: completedInnerWork.length,
          table_structure: 'work_result_detail + employees',
          workflow_source: 'p1,p3,p5 3단계 시스템',
          timestamp: new Date().toISOString()
        }
      };
      
      res.json(responseData);
    } else {
      console.log('완료된 내포장 작업 없음');
      
      // 진행중인 작업이 있는지 확인
      const inProgressWork = await packageService.executeQuery(`
        SELECT 
          wrd.result_detail,
          wrd.code_value,
          CASE wrd.code_value 
            WHEN 'p1' THEN '대기중'
            WHEN 'p3' THEN '진행중'
            ELSE wrd.code_value
          END as status_korean
        FROM tablets.work_result_detail wrd
        WHERE (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
        AND (wrd.process_code LIKE ? OR wrd.process_code LIKE 'BJA-STD-10%')
        AND wrd.code_value IN ('p1', 'p3')
        ORDER BY wrd.work_start_time DESC
        LIMIT 3
      `, [`%${productCode}%`]);
      
      res.json({
        success: false,
        message: `${base_line_name} 라인의 완료된 내포장 작업이 없습니다.`,
        data: null,
        alternative_works: inProgressWork,
        guidance: {
          message: '내포장을 먼저 완료해주세요.',
          required_steps: [
            '1. 내포장 작업 시작 (p1 → p3)',
            '2. 내포장 작업 완료 (p3 → p5)',
            '3. 외포장 워크플로우 연계 (별도 구현 필요)'
          ],
          current_status: inProgressWork.length > 0 ? 
            `현재 ${inProgressWork[0].status_korean} 작업이 있습니다 (${inProgressWork[0].result_detail})` :
            '진행중인 내포장 작업이 없습니다.'
        },
        metadata: {
          base_line_name: base_line_name,
          product_code: productCode,
          search_condition: 'code_value = p5 (완료)',
          in_progress_works_count: inProgressWork.length,
          workflow_source: 'p1,p3,p5 3단계 시스템',
          timestamp: new Date().toISOString()
        }
      });
    }
    
  } catch (err) {
    console.error('내포장 완료 정보 조회 실패:', err);
    res.status(500).json({
      success: false,
      message: '내포장 완료 정보 조회 중 오류 발생',
      error: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

// 워크플로우 상태 확인 (내포장 → 외포장 연계 상태)
router.get('/workflow/status/:baseLineName', async (req, res) => {
  try {
    const { baseLineName } = req.params;
    
    console.log(`=== 워크플로우 상태 확인: ${baseLineName} ===`);
    
    const productCode = packageService.extractProductCodeFromLine(baseLineName);
    
    // 해당 라인의 모든 포장 작업 상태 조회 (p1,p3,p5만)
    const allWorks = await packageService.executeQuery(`
      SELECT 
        wrd.result_detail,
        wrd.code_value,
        wrd.work_start_time,
        wrd.work_end_time,
        wrd.pass_qty,
        CASE wrd.code_value 
          WHEN 'p1' THEN '대기중'
          WHEN 'p3' THEN '진행중'
          WHEN 'p5' THEN '완료'
          ELSE wrd.code_value
        END as status_korean,
        CASE 
          WHEN wrd.manager_id REGEXP '^[0-9]+$' THEN e.employee_name
          ELSE COALESCE(wrd.manager_id, '담당자미정')
        END as employee_name
      FROM tablets.work_result_detail wrd
      LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
      WHERE (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
      AND (wrd.process_code LIKE ? OR wrd.process_code LIKE 'BJA-STD-10%')
      AND wrd.code_value IN ('p1', 'p3', 'p5')
      ORDER BY wrd.work_start_time DESC
    `, [`%${productCode}%`]);
    
    const statusSummary = {
      waiting: allWorks.filter(w => w.code_value === 'p1').length,
      in_progress: allWorks.filter(w => w.code_value === 'p3').length,
      completed: allWorks.filter(w => w.code_value === 'p5').length
    };
    
    const canStartOuter = statusSummary.completed > 0;
    const latestCompleted = canStartOuter ? 
      allWorks.find(w => w.code_value === 'p5') : null;
    
    res.json({
      success: true,
      message: `${baseLineName} 워크플로우 상태 조회 성공`,
      data: {
        base_line_name: baseLineName,
        product_code: productCode,
        all_works: allWorks,
        status_summary: statusSummary,
        workflow_status: {
          can_start_outer: canStartOuter,
          latest_completed_work: latestCompleted,
          workflow_ready: canStartOuter,
          next_action: canStartOuter ? '외포장 시작 가능 (별도 워크플로우 필요)' : '내포장 완료 필요'
        },
        system_info: {
          current_system: 'p1(대기중) → p3(진행중) → p5(완료)',
          note: '외포장은 별도 워크플로우 구현 필요'
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('워크플로우 상태 확인 실패:', err);
    res.status(500).json({
      success: false,
      message: '워크플로우 상태 확인 중 오류 발생',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// 직원 관리 API
// ==============================================

// 활성 직원 목록 조회
router.get('/employees/active', async (req, res) => {
  try {
    console.log('활성 직원 목록 조회 API 호출');
    
    const activeEmployees = await packageService.executeQuery(`
      SELECT 
        employee_id,
        employee_name,
        position,
        hire_date,
        phone,
        email,
        employment_status
      FROM tablets.employees
      WHERE employment_status = 'ACTIVE'
      ORDER BY employee_name
    `);
    
    res.json({
      success: true,
      message: '활성 직원 목록 조회 성공',
      data: activeEmployees,
      count: activeEmployees.length,
      filters: {
        employment_status: 'ACTIVE'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('활성 직원 목록 조회 실패:', err);
    res.status(500).json({
      success: false,
      message: '활성 직원 목록 조회 실패',
      error: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

// 특정 직원 정보 및 담당 작업 조회
router.get('/employees/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log(`직원 정보 조회: ${employeeId}`);
    
    // 직원 기본 정보
    const employeeInfo = await packageService.executeQuery(`
      SELECT 
        employee_id,
        employee_name,
        position,
        hire_date,
        phone,
        email,
        employment_status
      FROM tablets.employees
      WHERE employee_id = ?
    `, [employeeId]);
    
    if (employeeInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: `직원 ID ${employeeId}를 찾을 수 없습니다.`,
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    // 해당 직원의 담당 작업 목록 (p1,p3,p5만)
    const employeeWorks = await packageService.executeQuery(`
      SELECT 
        wrd.result_detail as 작업번호,
        wrd.process_code as 공정코드,
        wrd.code_value as 진행상태,
        CASE wrd.code_value 
          WHEN 'p1' THEN '대기중'
          WHEN 'p3' THEN '진행중'
          WHEN 'p5' THEN '완료'
          ELSE wrd.code_value
        END as 상태명,
        wrd.work_start_time as 시작시간,
        wrd.work_end_time as 종료시간,
        wrd.pass_qty as 합격수량
      FROM tablets.work_result_detail wrd
      WHERE wrd.manager_id = ?
      AND (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
      AND wrd.code_value IN ('p1', 'p3', 'p5')
      ORDER BY wrd.work_start_time DESC
    `, [employeeId]);
    
    res.json({
      success: true,
      message: `직원 ${employeeInfo[0].employee_name} 정보 조회 성공`,
      data: {
        employee_info: employeeInfo[0],
        assigned_works: employeeWorks,
        work_summary: {
          total_works: employeeWorks.length,
          waiting_works: employeeWorks.filter(w => w.진행상태 === 'p1').length,
          in_progress_works: employeeWorks.filter(w => w.진행상태 === 'p3').length,
          completed_works: employeeWorks.filter(w => w.진행상태 === 'p5').length
        }
      },
      system_info: {
        workflow_system: 'p1(대기중) → p3(진행중) → p5(완료)',
        note: '3단계 포장 워크플로우 시스템'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error(`직원 정보 조회 실패 (${req.params.employeeId}):`, err);
    res.status(500).json({
      success: false,
      message: `직원 정보 조회 실패: ${err.message}`,
      error: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// 디버깅 API
// ==============================================

// 데이터베이스 연결 테스트
router.get('/debug/connection-test', async (req, res) => {
  try {
    console.log('데이터베이스 연결 테스트 시작');
    
    const connectionTest = await packageService.executeQuery('SELECT 1 as test_value');
    const schemaTest = await packageService.executeQuery('SELECT DATABASE() as current_db');
    
    const workResultDetailTest = await packageService.executeQuery(`SELECT COUNT(*) as work_result_detail_count FROM work_result_detail`);
    const employeesTest = await packageService.executeQuery(`SELECT COUNT(*) as employees_count FROM employees`);
    
    res.json({
      success: true,
      message: '데이터베이스 연결 테스트 성공 (p1,p3,p5 3단계 시스템)',
      data: {
        connection_status: 'OK',
        test_query_result: connectionTest[0].test_value,
        current_database: schemaTest[0].current_db,
        work_result_detail_rows: workResultDetailTest[0].work_result_detail_count,
        employees_rows: employeesTest[0].employees_count,
        workflow_system: 'p1(대기중) → p3(진행중) → p5(완료)',
        table_structure: 'work_result_detail + employees',
        join_relationship: 'work_result_detail.manager_id = employees.employee_id',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error('데이터베이스 연결 테스트 실패:', err);
    res.status(500).json({
      success: false,
      message: '데이터베이스 연결 테스트 실패',
      error: err.message,
      error_code: err.code || 'UNKNOWN',
      data: null
    });
  }
});

module.exports = router;