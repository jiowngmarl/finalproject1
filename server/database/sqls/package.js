// database/sqls/package.js - employees 테이블 연동 추가
module.exports = {
  
  // ========== 라인실적등록.txt 워크플로우 기반 쿼리 (employees 테이블 연동) ==========
  
  // 테이블 관계:
  // work_order_master.work_order_no = work_result.work_order_no (1:1)
  // work_result.result_id = work_result_detail.result_id (1:N)
  // work_result_detail.manager_id = employees.employee_id (N:1)

  // 2-1) 해당 제품코드의 공정흐름도 정보 가져오기
  selectProcessFlowByProduct: `
    SELECT 
      p.process_group_code as 공정그룹코드,
      p.process_seq as 순서,
      p.process_code as 공정코드,
      p.process_name as 공정명,
      pg.product_code as 제품코드
    FROM tablets.process p
    JOIN tablets.process_group pg ON p.process_group_code = pg.process_group_code
    WHERE pg.product_code = ?
    AND p.process_name LIKE '%포장%'
    ORDER BY p.process_seq
  `,

  // 2-2) 작업실적테이블에서 진행중인 실적 가져오기 (employees 테이블 조인)
  selectInProgressWorkResult: `
    SELECT DISTINCT
      wom.work_order_no as 작업번호,
      wr.result_id as 실적ID,
      wrd.process_code as 공정코드,
      wrd.code_value as 진행상태,
      COALESCE(e.employee_name, '직원명없음') as 담당자명
    FROM tablets.work_order_master wom
    JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.code_value = 'completed'
    ORDER BY wom.order_start_dt DESC
    LIMIT 1
  `,

  // 2-3) 작업번호와 함께 상세 정보 가져오기 (employees 테이블 조인)
  selectWaitingWorkNumber: `
    SELECT 
      wom.work_order_no as 작업번호,
      wrd.result_detail,
      wrd.process_code as 공정코드,
      wrd.code_value as 진행상태,
      wr.result_id as 실적ID,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COALESCE(wrd.pass_qty, 1000) as input_qty,
      'READY' as step_status,
      COALESCE(e.employee_name, '담당자미정') as employee_name
    FROM tablets.work_order_master wom
    JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.process_code = ?
    AND wrd.code_value IN ('waiting', 'ready', '대기', '준비')
    ORDER BY wrd.work_start_time DESC
    LIMIT 1
  `,

  // 2-4) 작업시작 시 - 내포장시 진행상태를 진행으로 업데이트
  startInnerPackaging: `
    UPDATE tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    SET 
      wrd.code_value = 'in_progress',
      wrd.work_start_time = NOW()
    WHERE wom.work_order_no = ?
    AND wrd.process_code = 'p3'
  `,

  // 내포장 완료시 실적 상세 테이블에 종료시간 업데이트
  completeInnerPackaging: `
    UPDATE tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    SET 
      wrd.code_value = 'completed',
      wrd.work_end_time = NOW(),
      wrd.pass_qty = ?,
      wrd.process_defective_qty = ?
    WHERE wom.work_order_no = ?
    AND wrd.process_code = 'p3'
  `,

  // 3-1) 포장공정실적에서 내포장 완료된 건 가져오기 (employees 테이블 조인)
  selectCompletedInnerPackaging: `
    SELECT 
      wom.work_order_no as 작업번호,
      wr.result_id as 실적ID,
      wrd.process_code as 공정코드,
      wrd.work_start_time as 시작시간,
      wrd.work_end_time as 종료시간,
      wrd.pass_qty as 합격수량,
      wrd.result_detail,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COALESCE(e.employee_name, '담당자미정') as 담당자명
    FROM tablets.work_order_master wom
    JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.code_value = 'completed'
    AND wrd.process_code = 'p3'
    AND wom.plan_id = ?
    ORDER BY wrd.work_end_time DESC
    LIMIT 1
  `,

  // 외포장 작업 시작
  startOuterPackaging: `
    UPDATE tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    SET 
      wrd.code_value = 'in_progress',
      wrd.work_start_time = NOW(),
      wrd.pass_qty = ?
    WHERE wom.work_order_no = ?
    AND wrd.process_code = 'p5'
  `,

  // 3-2) 외포장공정 종료 시 - 진행상태를 검사중으로 업데이트
  completeOuterPackaging: `
    UPDATE tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    SET 
      wrd.code_value = 'inspection',
      wrd.work_end_time = NOW(),
      wrd.pass_qty = ?,
      wrd.process_defective_qty = ?
    WHERE wom.work_order_no = ?
    AND wrd.process_code = 'p5'
  `,

  // ========== 새 작업 생성 쿼리 ==========

  // 새 work_order_master 생성
  createNewWorkOrderMaster: `
    INSERT INTO tablets.work_order_master (
      work_order_no, plan_id, writer_id, write_date, 
      order_start_dt, order_end_dt, order_remark
    ) VALUES (?, ?, 2, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), ?)
  `,

  // 새 work_result 생성
  createNewWorkResult: `
    INSERT INTO tablets.work_result (
      result_id, work_order_no, process_group_code, result_remark, 
      code_value, work_start_date, work_end_date
    ) VALUES (?, ?, ?, ?, 'waiting', NOW(), NULL)
  `,

  // 새 work_result_detail 생성 (활성 직원 자동 할당)
  createNewWorkResultDetail: `
    INSERT INTO tablets.work_result_detail (
      result_detail, result_id, process_code, code_value, 
      work_start_time, pass_qty, process_defective_qty, 
      manager_id, eq_type_code
    ) VALUES (?, ?, ?, 'waiting', NOW(), ?, '0', 
      (SELECT employee_id FROM tablets.employees WHERE employment_status = 'ACTIVE' LIMIT 1), 
      'i8')
  `,

  // 기존 실적에 외포장 단계 추가 (활성 직원 자동 할당)
  addOuterPackagingStep: `
    INSERT INTO tablets.work_result_detail (
      result_detail, result_id, process_code, code_value, 
      work_start_time, pass_qty, process_defective_qty, 
      manager_id, eq_type_code
    ) VALUES (?, ?, 'p5', 'waiting', NOW(), ?, '0', 
      (SELECT employee_id FROM tablets.employees WHERE employment_status = 'ACTIVE' LIMIT 1), 
      'i8')
  `,

  // ========== 데이터 조회 쿼리들 (employees 테이블 조인) ==========

  // work_result_detail과 work_order_master 조인 데이터 확인 (employees 테이블 조인)
  selectAllWorkResultDetail: `
    SELECT 
      wom.work_order_no as 작업번호,
      wrd.result_detail,
      wr.result_id,
      wrd.process_code,
      wrd.code_value,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      wrd.pass_qty,
      wrd.work_start_time,
      COALESCE(e.employee_name, '담당자미정') as 담당자명,
      COALESCE(e.position, '직급미정') as 직급
    FROM tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    ORDER BY wrd.work_start_time DESC
    LIMIT 20
  `,

  // 내포장(p3) 관련 데이터만 확인 (employees 테이블 조인)
  selectInnerPackagingData: `
    SELECT 
      wom.work_order_no as 작업번호,
      wrd.result_detail,
      wr.result_id,
      wrd.process_code,
      wrd.code_value as 진행상태,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      wrd.pass_qty as 합격수량,
      wrd.work_start_time as 등록일시,
      COALESCE(e.employee_name, '담당자미정') as 담당자명,
      COALESCE(e.position, '직급미정') as 직급
    FROM tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.process_code = 'p3'
    ORDER BY wrd.work_start_time DESC
    LIMIT 10
  `,

  // 외포장(p5) 관련 데이터만 확인 (employees 테이블 조인)
  selectOuterPackagingData: `
    SELECT 
      wom.work_order_no as 작업번호,
      wrd.result_detail,
      wr.result_id,
      wrd.process_code,
      wrd.code_value as 진행상태,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      wrd.pass_qty as 합격수량,
      wrd.work_start_time as 등록일시,
      COALESCE(e.employee_name, '담당자미정') as 담당자명,
      COALESCE(e.position, '직급미정') as 직급
    FROM tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.process_code = 'p5'
    ORDER BY wrd.work_start_time DESC
    LIMIT 10
  `,

  // 특정 실적ID의 외포장 작업 확인 (employees 테이블 조인)
  selectOuterWorkByResultId: `
    SELECT 
      wom.work_order_no as 작업번호,
      wrd.result_detail,
      wrd.process_code as 공정코드,
      wrd.code_value as 진행상태,
      wr.result_id as 실적ID,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COALESCE(wrd.pass_qty, 1000) as input_qty,
      'READY' as step_status,
      COALESCE(e.employee_name, '담당자미정') as employee_name
    FROM tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wr.result_id = ?
    AND wrd.process_code = 'p5'
    AND wrd.code_value IN ('waiting', 'ready', '대기', '준비')
    LIMIT 1
  `,

  // ========== 라인별 작업번호 조회 (employees 테이블 조인) ==========
  
  // 내포장 라인별 작업번호 조회 (employees 테이블 조인)
  selectInnerWorksByLine: `
    SELECT 
      wom.work_order_no as 작업번호,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      wrd.code_value as 진행상태,
      wrd.pass_qty as input_qty,
      0 as output_qty,
      COALESCE(e.employee_name, '담당자미정') as employee_name,
      ? as line_id,
      ? as line_name,
      wrd.result_detail,
      '내포장' as step_name,
      'READY' as step_status
    FROM tablets.work_order_master wom
    JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.process_code = 'p3'
    AND wrd.code_value IN ('waiting', 'ready', '대기', '준비')
    AND (wom.plan_id LIKE ? OR p.product_name LIKE ?)
    ORDER BY wom.order_start_dt ASC
    LIMIT 1
  `,

  // 외포장 라인별 작업번호 조회 (employees 테이블 조인)
  selectOuterWorksByLine: `
    SELECT 
      wom.work_order_no as 작업번호,
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      wrd.code_value as 진행상태,
      wrd.pass_qty as input_qty,
      0 as output_qty,
      COALESCE(e.employee_name, '담당자미정') as employee_name,
      ? as line_id,
      ? as line_name,
      wrd.result_detail,
      '외포장' as step_name,
      'READY' as step_status
    FROM tablets.work_order_master wom
    JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.process_code = 'p5'
    AND wrd.code_value IN ('waiting', 'ready', '대기', '준비')
    AND (wom.plan_id LIKE ? OR p.product_name LIKE ?)
    ORDER BY wom.order_start_dt ASC
    LIMIT 1
  `,

  // ========== 작업실적 조회 쿼리들 (employees 테이블 조인) ==========

  // 작업실적 전체 조회 (employees 테이블 조인)
  selectAllWorkResults: `
    SELECT 
      wom.work_order_no as 작업번호,
      wom.plan_id as 제품코드,
      wr.result_id,
      wom.order_start_dt,
      wom.order_end_dt,
      wrd.result_detail,
      wrd.process_code,
      wrd.code_value as detail_status,
      wrd.work_start_time,
      wrd.work_end_time,
      wrd.pass_qty,
      wrd.process_defective_qty,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COALESCE(e.employee_name, '담당자미정') as 담당자명,
      COALESCE(e.position, '직급미정') as 직급
    FROM tablets.work_order_master wom
    LEFT JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    LEFT JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    ORDER BY wom.order_start_dt DESC, wrd.process_code ASC
  `,
  
  // 특정 작업번호의 실적 조회 (employees 테이블 조인)
  selectWorkResultByWorkNo: `
    SELECT 
      wom.work_order_no as 작업번호,
      wom.plan_id as 제품코드,
      wr.result_id,
      wom.order_start_dt,
      wom.order_end_dt,
      wrd.result_detail,
      wrd.process_code,
      wrd.code_value as detail_status,
      wrd.work_start_time,
      wrd.work_end_time,
      wrd.pass_qty,
      wrd.process_defective_qty,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COALESCE(e.employee_name, '담당자미정') as 담당자명,
      COALESCE(e.position, '직급미정') as 직급
    FROM tablets.work_order_master wom
    JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wom.work_order_no = ?
    ORDER BY wrd.process_code
  `,

  // ========== 디버깅용 쿼리들 (employees 테이블 조인) ==========

  // 제품별 작업 현황 확인 (employees 테이블 조인)
  selectWorkStatusByProduct: `
    SELECT 
      wom.plan_id as 제품코드,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COUNT(DISTINCT wom.work_order_no) as 총작업수,
      COUNT(CASE WHEN wrd.code_value = 'completed' AND wrd.process_code = 'p3' THEN 1 END) as 내포장완료,
      COUNT(CASE WHEN wrd.code_value = 'completed' AND wrd.process_code = 'p5' THEN 1 END) as 외포장완료,
      COUNT(CASE WHEN wrd.code_value IN ('waiting', 'ready') THEN 1 END) as 대기중작업,
      GROUP_CONCAT(DISTINCT e.employee_name) as 담당자목록
    FROM tablets.work_order_master wom
    LEFT JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    LEFT JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    GROUP BY wom.plan_id, p.product_name
    ORDER BY wom.plan_id
  `,

  // 라인별 작업 현황 확인 (employees 테이블 조인)
  selectWorkStatusByLine: `
    SELECT 
      wrd.process_code as 라인구분,
      CASE WHEN wrd.process_code = 'p3' THEN '내포장' ELSE '외포장' END as 라인명,
      COUNT(*) as 총작업수,
      COUNT(CASE WHEN wrd.code_value = 'waiting' THEN 1 END) as 대기중,
      COUNT(CASE WHEN wrd.code_value = 'in_progress' THEN 1 END) as 진행중,
      COUNT(CASE WHEN wrd.code_value = 'completed' THEN 1 END) as 완료,
      COUNT(CASE WHEN wrd.code_value = 'inspection' THEN 1 END) as 검사중,
      GROUP_CONCAT(DISTINCT e.employee_name) as 담당자목록
    FROM tablets.work_result_detail wrd
    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    WHERE wrd.process_code IN ('p3', 'p5')
    GROUP BY wrd.process_code
    ORDER BY wrd.process_code
  `,

  // work_order_master 테이블에서 실제 작업번호들 확인 (employees 테이블 조인)
  selectActualWorkOrders: `
    SELECT 
      wom.work_order_no as 작업번호,
      wom.plan_id as 제품코드,
      wom.order_start_dt as 시작일시,
      wom.order_end_dt as 종료일시,
      wom.order_remark as 비고,
      COALESCE(p.product_name, '제품명없음') as 제품명,
      COUNT(wrd.result_detail) as 작업상세수,
      GROUP_CONCAT(DISTINCT e.employee_name) as 담당자목록
    FROM tablets.work_order_master wom
    LEFT JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
    LEFT JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
    LEFT JOIN tablets.employees e ON wrd.manager_id = e.employee_id
    GROUP BY wom.work_order_no, wom.plan_id, wom.order_start_dt, 
             wom.order_end_dt, wom.order_remark, p.product_name
    ORDER BY wom.order_start_dt DESC
    LIMIT 20
  `,

  // ========== employees 테이블 관련 쿼리 추가 ==========

  // 활성 직원 목록 조회
  selectActiveEmployees: `
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
  `,

  // 특정 직원 정보 조회
  selectEmployeeById: `
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
  `,

  // 직원별 작업 현황 조회
  selectWorkStatusByEmployee: `
    SELECT 
      e.employee_id,
      e.employee_name,
      e.position,
      COUNT(wrd.result_detail) as 총담당작업수,
      COUNT(CASE WHEN wrd.code_value = 'waiting' THEN 1 END) as 대기중작업,
      COUNT(CASE WHEN wrd.code_value = 'in_progress' THEN 1 END) as 진행중작업,
      COUNT(CASE WHEN wrd.code_value = 'completed' THEN 1 END) as 완료작업,
      COUNT(CASE WHEN wrd.process_code = 'p3' THEN 1 END) as 내포장작업,
      COUNT(CASE WHEN wrd.process_code = 'p5' THEN 1 END) as 외포장작업
    FROM tablets.employees e
    LEFT JOIN tablets.work_result_detail wrd ON e.employee_id = wrd.manager_id
    WHERE e.employment_status = 'ACTIVE'
    GROUP BY e.employee_id, e.employee_name, e.position
    ORDER BY e.employee_name
  `
}