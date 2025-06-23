// services/packageService.js - 실제 제품명 매핑 완전 적용
const mariadb = require('mariadb');
const packageQueries = require('../database/sqls/package');
require('dotenv').config();

class PackageService {
    constructor() {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PWD || '',
            database: process.env.DB_DB || 'tablets',
            port: parseInt(process.env.DB_PORT) || 3306,
            connectionLimit: parseInt(process.env.DB_LIMIT) || 10,
            acquireTimeout: 30000,
            timeout: 30000,
            idleTimeout: 60000,
            supportBigNumbers: true,
            bigNumberStrings: true,
            resetAfterUse: true
        };

        console.log('데이터베이스 연결 설정 (실제 제품명 매핑):');
        console.log('- HOST:', dbConfig.host);
        console.log('- USER:', dbConfig.user);
        console.log('- PASSWORD:', dbConfig.password ? '****' : 'MISSING');
        console.log('- DATABASE:', dbConfig.database);
        console.log('- PORT:', dbConfig.port);

        this.pool = mariadb.createPool(dbConfig);
    }

    // 연결 테스트
    async testConnection() {
        let conn;
        try {
            console.log('데이터베이스 연결 테스트 시작...');
            conn = await this.pool.getConnection();
            console.log('데이터베이스 연결 성공!');
            
            const result = await conn.query('SELECT 1 as test');
            console.log('쿼리 테스트 성공:', result);
            
            return { success: true, message: '연결 성공' };
        } catch (error) {
            console.error('데이터베이스 연결 실패:', error.message);
            return { success: false, error: error.message };
        } finally {
            if (conn) conn.release();
        }
    }

    // 안전한 쿼리 실행
    async executeRawQuery(query, params = [], retries = 2) {
        let conn;
        let lastError;
        
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                console.log(`쿼리 실행 시도 ${attempt}/${retries + 1}:`, query.substring(0, 100) + '...');
                
                conn = await this.pool.getConnection();
                const rows = await conn.query(query, params);
                
                console.log(`쿼리 실행 성공 (시도 ${attempt}): ${Array.isArray(rows) ? rows.length : 1}건`);
                return rows;
                
            } catch (error) {
                lastError = error;
                console.error(`쿼리 실행 실패 (시도 ${attempt}):`, error.message);
                
                if (conn) {
                    conn.release();
                    conn = null;
                }
                
                if (attempt <= retries && (
                    error.code === 'ER_GET_CONNECTION_TIMEOUT' ||
                    error.code === 'ER_ACCESS_DENIED_ERROR' ||
                    error.code === 'ECONNREFUSED'
                )) {
                    console.log(`${attempt * 1000}ms 후 재시도...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                } else {
                    break;
                }
            } finally {
                if (conn) conn.release();
            }
        }
        
        throw lastError;
    }

    // 제품코드를 실제 제품명으로 변환하는 함수
    getProductNameFromCode(productCode) {
        if (!productCode) return '제품명 없음';
        
        const productNameMap = {
            // BJA 계열 - 베아제정
            'BJA-STD-10': '베아제정',
            'BJA-STD-30': '베아제정',
            'BJA-STD-60': '베아제정',
            
            // BJA 계열 - 닥터베아제정
            'BJA-DR-10': '닥터베아제정',
            'BJA-DR-30': '닥터베아제정', 
            'BJA-DR-60': '닥터베아제정',
            
            // FST 계열 - 헬스컵골드정
            'FST-GOLD-10': '헬스컵골드정',
            'FST-GOLD-30': '헬스컵골드정',
            'FST-GOLD-60': '헬스컵골드정',
            
            // FST 계열 - 헬스컵플러스정
            'FST-PLUS-10': '헬스컵플러스정',
            'FST-PLUS-30': '헬스컵플러스정',
            'FST-PLUS-60': '헬스컵플러스정',
            
            // GB 계열 - 게보린정
            'GB-STD-10': '게보린정',
            'GB-STD-30': '게보린정',
            'GB-STD-60': '게보린정',
            
            // GB 계열 - 게보린브이정
            'GB-V-10': '게보린브이정',
            'GB-V-30': '게보린브이정',
            'GB-V-60': '게보린브이정',
            
            // GN 계열 - 그날엔큐정
            'GN-Q-10': '그날엔큐정',
            'GN-Q-30': '그날엔큐정',
            'GN-Q-60': '그날엔큐정',
            
            // GN 계열 - 그날엔정
            'GN-STD-10': '그날엔정',
            'GN-STD-30': '그날엔정',
            'GN-STD-60': '그날엔정',
            
            // PCT 계열 - 판코레아정
            'PCT-STD-10': '판코레아정',
            'PCT-STD-30': '판코레아정',
            'PCT-STD-60': '판코레아정',
            
            // TN 계열 - 타이레놀정500mg
            'TN-500-10': '타이레놀정500mg',
            'TN-500-30': '타이레놀정500mg',
            'TN-500-60': '타이레놀정500mg',
            
            // TN 계열 - 타이레놀정8시간 ER
            'TN-8HR-10': '타이레놀정8시간 ER',
            'TN-8HR-30': '타이레놀정8시간 ER',
            'TN-8HR-60': '타이레놀정8시간 ER',
            
            // TN 계열 - 타이레놀우먼스정
            'TN-WMN-10': '타이레놀우먼스정',
            'TN-WMN-30': '타이레놀우먼스정',
            'TN-WMN-60': '타이레놀우먼스정'
        };
        
        // 정확한 매칭
        if (productNameMap[productCode]) {
            console.log(`제품명 매핑: ${productCode} -> ${productNameMap[productCode]}`);
            return productNameMap[productCode];
        }
        
        // 부분 매칭 (용량 정보 제거하고 매칭)
        const baseCode = productCode.replace(/-\d+$/, '');
        for (const [code, name] of Object.entries(productNameMap)) {
            if (code.startsWith(baseCode)) {
                console.log(`부분 매핑: ${productCode} -> ${name}`);
                return name;
            }
        }
        
        // 매핑되지 않는 경우 코드 그대로 반환
        console.log(`매핑되지 않은 제품코드: ${productCode}`);
        return productCode;
    }

    // 라인명에서 제품코드 추출 (완전한 매핑 로직)
    extractProductCodeFromLine(lineName) {
        try {
            if (!lineName) return 'BJA-STD-10';  // 베아제정 기본값
            
            console.log('제품코드 추출 시작:', lineName);
            
            // 1. 완전한 제품코드 패턴 매칭
            const codePatterns = [
                // 표준 패턴들
                /(BJA-(?:DR|STD)-\d+)/i,           // BJA-DR-10, BJA-STD-30 등
                /(FST-(?:GOLD|PLUS)-\d+)/i,       // FST-GOLD-10, FST-PLUS-30 등  
                /(GB-(?:STD|V)-\d+)/i,            // GB-STD-10, GB-V-30 등
                /(GN-(?:Q|STD)-\d+)/i,            // GN-Q-10, GN-STD-30 등
                /(PCT-STD-\d+)/i,                 // PCT-STD-10 등
                /(TN-500-\d+)/i,                  // TN-500-10 등
                /(TN-8HR-\d+)/i,                  // TN-8HR-10 등  
                /(TN-WMN-\d+)/i,                  // TN-WMN-10 등
                // 일반적 패턴
                /([A-Z]{2,3}-[A-Z]{2,4}-\d+)/i    // 기타 패턴
            ];
            
            for (const pattern of codePatterns) {
                const match = lineName.match(pattern);
                if (match) {
                    console.log(`제품코드 패턴 매칭 성공: ${match[1]} (라인명: ${lineName})`);
                    return match[1].toUpperCase();
                }
            }
            
            // 2. 제품명 기반 완전 매핑 (전체 제품 목록 반영)
            const productNameMapping = {
                // BJA 계열
                '닥터베아제정': { base: 'BJA-DR', default: 'BJA-DR-10' },
                '베아제정': { base: 'BJA-STD', default: 'BJA-STD-10' },
                
                // FST 계열
                '헬스컵골드정': { base: 'FST-GOLD', default: 'FST-GOLD-10' },
                '헬스컵플러스정': { base: 'FST-PLUS', default: 'FST-PLUS-10' },
                
                // GB 계열
                '게보린정': { base: 'GB-STD', default: 'GB-STD-10' },
                '게보린브이정': { base: 'GB-V', default: 'GB-V-10' },
                
                // GN 계열
                '그날엔큐정': { base: 'GN-Q', default: 'GN-Q-10' },
                '그날엔정': { base: 'GN-STD', default: 'GN-STD-10' },
                
                // PCT 계열
                '판코레아정': { base: 'PCT-STD', default: 'PCT-STD-10' },
                
                // TN 계열
                '타이레놀정500mg': { base: 'TN-500', default: 'TN-500-10' },
                '타이레놀정8시간': { base: 'TN-8HR', default: 'TN-8HR-10' },
                '타이레놀우먼스정': { base: 'TN-WMN', default: 'TN-WMN-10' }
            };
            
            // 제품명으로 매핑 확인
            for (const [productName, config] of Object.entries(productNameMapping)) {
                if (lineName.includes(productName)) {
                    // 용량별 구분
                    if (lineName.includes('30') || lineName.includes('30정')) {
                        const code30 = `${config.base}-30`;
                        console.log(`제품명+용량 매핑: ${productName} 30정 -> ${code30}`);
                        return code30;
                    }
                    if (lineName.includes('60') || lineName.includes('60정')) {
                        const code60 = `${config.base}-60`;
                        console.log(`제품명+용량 매핑: ${productName} 60정 -> ${code60}`);
                        return code60;
                    }
                    
                    console.log(`제품명 매핑: ${productName} -> ${config.default}`);
                    return config.default;
                }
            }
            
            // 3. 제품코드 prefix 매핑
            const prefixMapping = {
                // BJA 계열
                'BJA-DR': 'BJA-DR-10',
                'BJA-STD': 'BJA-STD-10',
                
                // FST 계열
                'FST-GOLD': 'FST-GOLD-10', 
                'FST-PLUS': 'FST-PLUS-10',
                
                // GB 계열
                'GB-STD': 'GB-STD-10',
                'GB-V': 'GB-V-10',
                
                // GN 계열
                'GN-Q': 'GN-Q-10',
                'GN-STD': 'GN-STD-10',
                
                // PCT 계열
                'PCT-STD': 'PCT-STD-10',
                
                // TN 계열
                'TN-500': 'TN-500-10',
                'TN-8HR': 'TN-8HR-10', 
                'TN-WMN': 'TN-WMN-10'
            };
            
            for (const [prefix, defaultCode] of Object.entries(prefixMapping)) {
                if (lineName.includes(prefix)) {
                    // 용량 체크
                    if (lineName.includes('30')) {
                        const code30 = defaultCode.replace('-10', '-30');
                        console.log(`Prefix+용량 매핑: ${prefix} 30정 -> ${code30}`);
                        return code30;
                    }
                    if (lineName.includes('60')) {
                        const code60 = defaultCode.replace('-10', '-60');
                        console.log(`Prefix+용량 매핑: ${prefix} 60정 -> ${code60}`);
                        return code60;
                    }
                    
                    console.log(`Prefix 매핑: ${prefix} -> ${defaultCode}`);
                    return defaultCode;
                }
            }
            
            // 4. 라인명 기반 기본값 (베아제정 계열을 기본으로)
            if (lineName.includes('A라인')) {
                console.log('A라인 감지, 베아제정 기본값');
                return 'BJA-STD-10';
            }
            
            if (lineName.includes('B라인')) {
                console.log('B라인 감지, 베아제정 30정');
                return 'BJA-STD-30';
            }
            
            if (lineName.includes('C라인')) {
                console.log('C라인 감지, 베아제정 60정');
                return 'BJA-STD-60';
            }
            
            // 5. 용량별 기본 제품 (베아제정 계열)
            if (lineName.includes('30')) {
                console.log('30정 패턴 감지, 베아제정 30정');
                return 'BJA-STD-30';
            }
            if (lineName.includes('60')) {
                console.log('60정 패턴 감지, 베아제정 60정');
                return 'BJA-STD-60';
            }
            
            // 6. 최종 기본값
            console.log('제품코드 추출 실패, 기본값 BJA-STD-10 사용');
            return 'BJA-STD-10';
            
        } catch (error) {
            console.log('제품코드 추출 중 오류, 기본값 사용:', error.message);
            return 'BJA-STD-10';
        }
    }

    // 내포장 라인별 작업번호 조회 (실제 제품명 적용)
    async getInnerWorkByLine(lineId, lineName) {
        try {
            console.log(`\n=== 내포장 작업번호 조회 (실제 제품명 적용) ===`);
            console.log(`라인: ${lineId}, ${lineName}`);
            
            // 라인명에서 제품코드 추출
            const productCode = this.extractProductCodeFromLine(lineName) || 'BJA-STD-10';
            console.log(`추출된 제품코드: ${productCode}`);
            
            // employees 테이블 조인으로 내포장 작업 조회
            // -1) 해당 제품코드의 공정흐름도 정보 가져오기
            const getProcesxsInfo = await this.executeRawQuery(`
                SELECT process_group_code, process_seq, process_code
                FROM process
                HERE process_group_code = (SELECT process_group_code FROM tablets.process_group WHERE product_code = ?)
                AND process_int = (SELECT process_int FROM process_it WHERE process_name = '포장')
            `, [`%${productCode}%`]);

            // -2) 작업실적테이블에서 진행중인 실적 가져오기
            const getWorinMaster = await this.executeRawQuery(`
                SELECT rm.result_id
                FROM work_result rm 
                JOIN work_result_detail rd
                  ON rm.result_id = rd.result_id
                WHERE rm.process_group_code = ? -- 1) process_group_code
                AND rd.process_seq = ?-1 -- 2) process_seq
                AND rd.code_value = 'p5'`, 
                [getProcesxsInfo[0].process_group_code, getProcesxsInfo[0].process_seq]);

            // -3) 작업실적상세테이블에서 작업번호 가져오기
            const getWorkDetail = await this.executeRawQuery(`
                SELECT result_detail
                FROM work_result_detail
                WHERE result_id = ? -- 2) result_id
                AND process_seq = ?
                AND code_value = 'p1'`, 
                [getWorinMaster[0].result_id, getProcesxsInfo[0].process_seq]); 

            
            if (result.length > 0) {
                const work = result[0];
                
                // 실제 제품명 적용
                const realProductName = this.getProductNameFromCode(work.제품코드);
                
                console.log(`내포장 작업번호 조회 성공: ${work.작업번호}, 제품명: ${realProductName}`);
                return {
                    work_order_no: work.작업번호,
                    work_id: work.작업번호,
                    //result_detail_id: work.result_detail,
                    result_detail_id : getWorkDetail[0].result_detail,
                    result_id: work.result_id,
                    step_status: work.step_status,
                    input_qty: work.input_qty || 1000,
                    output_qty: work.output_qty || 0,
                    product_name: realProductName,              // 실제 제품명
                    final_product_name: realProductName,        // 실제 제품명
                    employee_name: work.employee_name,
                    employee_id: work.employee_id,
                    position: work.position,
                    department_code: work.department_code,
                    product_code: work.제품코드,
                    process_code: 'p3'
                };
            }
            
            // 작업이 없으면 새로 생성
            console.log('기존 내포장 작업이 없어서 새로 생성 (실제 제품명 적용)');
            return await this.createNewWorkOrder(productCode, lineId);
            
        } catch (error) {
            console.error(`내포장 작업번호 조회 실패 (실제 제품명 적용):`, error);
            throw error;
        }
    }

    // 외포장 라인별 작업번호 조회 (실제 제품명 적용)
    async getOuterWorkByLine(lineId, lineName) {
        try {
            console.log(`\n=== 외포장 작업번호 조회 (실제 제품명 적용) ===`);
            console.log(`라인: ${lineId}, ${lineName}`);
            
            // 라인명에서 제품코드 추출
            const productCode = this.extractProductCodeFromLine(lineName) || 'BJA-STD-10';
            console.log(`추출된 제품코드: ${productCode}`);
            
            // 3-1) 포장공정실적에서 내포장 완료된 건 가져오기
            console.log('\nStep 3-1: 포장공정실적에서 내포장 완료된 건 가져오기');
            const 완료된내포장 = await this.executeRawQuery(`
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
                    COALESCE(emp.employee_name, '작업자') as employee_name,
                    COALESCE(emp.employee_id, 2) as employee_id
                FROM tablets.work_order_master wom
                JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
                JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
                LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
                LEFT JOIN tablets.employees emp ON CAST(REPLACE(wrd.manager_id, 'd', '') AS UNSIGNED) = emp.employee_id
                WHERE wrd.code_value = 'completed'
                AND wrd.process_code = 'p3'
                AND wom.plan_id = ?
                ORDER BY wrd.work_end_time DESC
                LIMIT 1
            `, [productCode]);
            
            if (완료된내포장.length > 0) {
                console.log('완료된 내포장 발견:', 완료된내포장[0]);
                
                // 실제 제품명 적용
                const realProductName = this.getProductNameFromCode(완료된내포장[0].제품코드);
                
                // 해당 실적ID에서 외포장(p5) 작업 확인
                const 외포장작업 = await this.executeRawQuery(`
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
                        COALESCE(emp.employee_name, '작업자') as employee_name,
                        COALESCE(emp.employee_id, 2) as employee_id,
                        COALESCE(emp.position, '작업자') as position,
                        COALESCE(emp.department_code, '포장부') as department_code
                    FROM tablets.work_result_detail wrd
                    JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
                    JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
                    LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
                    LEFT JOIN tablets.employees emp ON CAST(REPLACE(wrd.manager_id, 'd', '') AS UNSIGNED) = emp.employee_id
                    WHERE wr.result_id = ?
                    AND wrd.process_code = 'p5'
                    AND wrd.code_value IN ('waiting', 'ready', '대기', '준비')
                    LIMIT 1
                `, [완료된내포장[0].실적ID]);
                
                if (외포장작업.length > 0) {
                    console.log('대기중인 외포장 작업 발견:', 외포장작업[0]);
                    return {
                        work_order_no: 외포장작업[0].작업번호,
                        work_id: 외포장작업[0].작업번호,
                        result_detail_id: 외포장작업[0].result_detail,
                        result_id: 외포장작업[0].실적ID,
                        step_status: 'READY',
                        input_qty: 외포장작업[0].input_qty || 1000,
                        output_qty: 0,
                        product_name: realProductName,              // 실제 제품명
                        final_product_name: realProductName,        // 실제 제품명
                        employee_name: 외포장작업[0].employee_name,
                        employee_id: 외포장작업[0].employee_id,
                        position: 외포장작업[0].position,
                        department_code: 외포장작업[0].department_code,
                        product_code: 외포장작업[0].제품코드,
                        process_code: 'p5'
                    };
                } else {
                    // 외포장 작업 생성 (기존 작업자 정보 유지)
                    console.log('외포장 작업이 없어서 새로 생성 (기존 작업자 유지)');
                    await this.executeRawQuery(`
                        INSERT INTO tablets.work_result_detail (
                            result_detail, result_id, process_code, code_value, 
                            work_start_time, pass_qty, process_defective_qty, 
                            manager_id, eq_type_code
                        ) VALUES (?, ?, 'p5', 'waiting', NOW(), ?, '0', ?, 'i8')
                    `, [
                        `${완료된내포장[0].실적ID}_p5`,
                        완료된내포장[0].실적ID,
                        완료된내포장[0].합격수량 || 1000,
                        완료된내포장[0].employee_id || 2
                    ]);
                    
                    return {
                        work_order_no: 완료된내포장[0].작업번호,
                        work_id: 완료된내포장[0].작업번호,
                        result_detail_id: `${완료된내포장[0].실적ID}_p5`,
                        result_id: 완료된내포장[0].실적ID,
                        step_status: 'READY',
                        input_qty: 완료된내포장[0].합격수량 || 1000,
                        output_qty: 0,
                        product_name: realProductName,              // 실제 제품명
                        final_product_name: realProductName,        // 실제 제품명
                        employee_name: 완료된내포장[0].employee_name,
                        employee_id: 완료된내포장[0].employee_id,
                        product_code: 완료된내포장[0].제품코드,
                        process_code: 'p5'
                    };
                }
            }
            
            // 완료된 내포장이 없으면 일반 외포장 작업 조회
            console.log('완료된 내포장이 없어서 일반 외포장 작업 조회');
            const result = await this.executeRawQuery(`
                SELECT 
                    wom.work_order_no as 작업번호,
                    wom.plan_id as 제품코드,
                    COALESCE(p.product_name, '제품명없음') as 제품명,
                    wrd.code_value as 진행상태,
                    wrd.pass_qty as input_qty,
                    0 as output_qty,
                    COALESCE(emp.employee_name, '작업자') as employee_name,
                    COALESCE(emp.employee_id, 2) as employee_id,
                    COALESCE(emp.position, '작업자') as position,
                    COALESCE(emp.department_code, '포장부') as department_code,
                    ? as line_id,
                    ? as line_name,
                    wrd.result_detail,
                    wr.result_id,
                    '외포장' as step_name,
                    'READY' as step_status
                FROM tablets.work_order_master wom
                JOIN tablets.work_result wr ON wom.work_order_no = wr.work_order_no
                JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
                LEFT JOIN tablets.product p ON wom.plan_id = p.product_code
                LEFT JOIN tablets.employees emp ON CAST(REPLACE(wrd.manager_id, 'd', '') AS UNSIGNED) = emp.employee_id
                WHERE wrd.process_code = 'p5'
                AND wrd.code_value IN ('waiting', 'ready', '대기', '준비')
                AND (wom.plan_id LIKE ? OR p.product_name LIKE ?)
                ORDER BY wom.order_start_dt ASC
                LIMIT 1
            `, [lineId, lineName, `%${productCode}%`, `%${productCode}%`]);
            
            if (result.length > 0) {
                const work = result[0];
                
                // 실제 제품명 적용
                const realProductName = this.getProductNameFromCode(work.제품코드);
                
                console.log(`외포장 작업번호 조회 성공: ${work.작업번호}, 제품명: ${realProductName}`);
                return {
                    work_order_no: work.작업번호,
                    work_id: work.작업번호,
                    result_detail_id: work.result_detail,
                    result_id: work.result_id,
                    step_status: work.step_status,
                    input_qty: work.input_qty || 1000,
                    output_qty: work.output_qty || 0,
                    product_name: realProductName,              // 실제 제품명
                    final_product_name: realProductName,        // 실제 제품명
                    employee_name: work.employee_name,
                    employee_id: work.employee_id,
                    position: work.position,
                    department_code: work.department_code,
                    product_code: work.제품코드,
                    process_code: 'p5'
                };
            }

            // 작업이 없으면 새로 생성
            console.log('기존 외포장 작업이 없어서 새로 생성 (실제 제품명 적용)');
            return await this.createNewWorkOrder(productCode, lineId);
            
        } catch (error) {
            console.error(`외포장 작업번호 조회 실패 (실제 제품명 적용):`, error);
            throw error;
        }
    }

    // 내포장 작업 시작 워크플로우
    async startInnerPackagingWorkflow(workOrderNo, productCode, processGroupCode) {
        try {
            console.log(`내포장 작업 시작 워크플로우: ${workOrderNo}, 제품: ${productCode}`);
            
            // 2-4) 작업시작 시 - 내포장시 추가로 코드 만들기
            const result = await this.executeRawQuery(`
                UPDATE tablets.work_result_detail wrd
                JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
                JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
                SET 
                    wrd.code_value = 'in_progress',
                    wrd.work_start_time = NOW()
                WHERE wom.work_order_no = ?
                AND wrd.process_code = 'p3'
            `, [workOrderNo]);
            
            console.log(`내포장 작업 시작 업데이트 완료: ${workOrderNo} (${result.affectedRows}건)`);
            
            return {
                success: true,
                message: '내포장 작업이 시작되었습니다.',
                data: {
                    work_order_no: workOrderNo,
                    product_code: productCode,
                    process_group_code: processGroupCode,
                    process_code: 'p3',
                    status: 'in_progress',
                    start_time: new Date()
                }
            };
            
        } catch (error) {
            console.error(`내포장 작업 시작 워크플로우 실패 (${workOrderNo}):`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // 내포장 작업 완료 워크플로우
    async completeInnerPackagingWorkflow(workOrderNo, passQty, defectiveQty) {
        try {
            console.log(`내포장 작업 완료 워크플로우: ${workOrderNo}`);
            
            // 내포장 완료시 실적 상세 테이블에 시작시간 업데이트 하고
            const result = await this.executeRawQuery(`
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
            `, [passQty, defectiveQty || '0', workOrderNo]);
            
            console.log(`내포장 완료 업데이트 완료: ${workOrderNo} (${result.affectedRows}건)`);
            
            return {
                success: true,
                message: '내포장 작업이 완료되었습니다.',
                data: {
                    work_order_no: workOrderNo,
                    process_code: 'p3',
                    status: 'completed',
                    pass_qty: passQty,
                    defective_qty: defectiveQty,
                    end_time: new Date()
                }
            };
            
        } catch (error) {
            console.error(`내포장 작업 완료 워크플로우 실패 (${workOrderNo}):`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // 외포장 작업 시작 워크플로우
    async startOuterPackagingWorkflow(workOrderNo, productCode, processGroupCode, innerOutputQty) {
        try {
            console.log(`외포장 작업 시작 워크플로우: ${workOrderNo}, 내포장 수량: ${innerOutputQty}`);
            
            const result = await this.executeRawQuery(`
                UPDATE tablets.work_result_detail wrd
                JOIN tablets.work_result wr ON wrd.result_id = wr.result_id
                JOIN tablets.work_order_master wom ON wr.work_order_no = wom.work_order_no
                SET 
                    wrd.code_value = 'in_progress',
                    wrd.work_start_time = NOW(),
                    wrd.pass_qty = ?
                WHERE wom.work_order_no = ?
                AND wrd.process_code = 'p5'
            `, [innerOutputQty || 1000, workOrderNo]);
            
            console.log(`외포장 작업 시작 업데이트 완료: ${workOrderNo} (${result.affectedRows}건)`);
            
            return {
                success: true,
                message: '외포장 작업이 시작되었습니다.',
                data: {
                    work_order_no: workOrderNo,
                    product_code: productCode,
                    process_group_code: processGroupCode,
                    process_code: 'p5',
                    status: 'in_progress',
                    inner_output_qty: innerOutputQty,
                    start_time: new Date()
                }
            };
            
        } catch (error) {
            console.error(`외포장 작업 시작 워크플로우 실패 (${workOrderNo}):`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // 외포장 작업 완료 워크플로우
    async completeOuterPackagingWorkflow(workOrderNo, passQty, defectiveQty) {
        try {
            console.log(`외포장 작업 완료 워크플로우: ${workOrderNo}`);
            
            // 3-2) 외포장공정 종료 시
            const result = await this.executeRawQuery(`
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
            `, [passQty, defectiveQty || '0', workOrderNo]);
            
            console.log(`외포장 완료 업데이트 완료 (검사중): ${workOrderNo} (${result.affectedRows}건)`);
            
            return {
                success: true,
                message: '외포장 작업이 완료되었습니다. 모든 포장 단계가 완료되었습니다.',
                data: {
                    work_order_no: workOrderNo,
                    process_code: 'p5',
                    status: 'inspection',
                    pass_qty: passQty,
                    defective_qty: defectiveQty,
                    end_time: new Date(),
                    all_packaging_completed: true
                }
            };
            
        } catch (error) {
            console.error(`외포장 작업 완료 워크플로우 실패 (${workOrderNo}):`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // BigInt를 Number로 변환
    convertBigIntToNumber(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.convertBigIntToNumber(item));
        } else if (data && typeof data === 'object') {
            const converted = {};
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'bigint') {
                    converted[key] = Number(value);
                } else if (value && typeof value === 'object') {
                    converted[key] = this.convertBigIntToNumber(value);
                } else {
                    converted[key] = value;
                }
            }
            return converted;
        }
        return data;
    }

    // 기존 package_work 테이블 관련 함수들 (실제 제품명 적용)
    async getWorkList(packageType = null, lineId = null, lineName = null) {
        try {
            console.log('package_work 테이블에서 작업 목록 조회 (실제 제품명 적용):', { packageType, lineId, lineName });
            
            let query = `
                SELECT 
                    pw.work_id,
                    pw.work_order_no,
                    pw.order_detail_id,
                    pw.line_id,
                    pw.work_line,
                    pw.work_step,
                    pw.step_name,
                    pw.step_status,
                    pw.input_qty,
                    pw.output_qty,
                    pw.eq_code,
                    pw.start_time,
                    pw.end_time,
                    pw.employee_id,
                    COALESCE(emp.employee_name, pw.employee_name, '작업자') as employee_name,
                    COALESCE(emp.position, '작업자') as position,
                    COALESCE(emp.department_code, '포장부') as department_code,
                    pw.product_name,
                    pw.reg_date,
                    pw.upd_date,
                    NULL as result_detail_id,
                    
                    COALESCE(pw.product_name, pw.step_name, '제품명없음') as final_product_name,
                    
                    CASE 
                        WHEN pw.step_name LIKE '%외포장%' OR pw.step_name LIKE '%2차%' THEN 'OUTER'
                        ELSE 'INNER'
                    END as package_type,
                    
                    COALESCE(pw.work_line, pw.line_id, '라인정보없음') as line_name,
                    
                    CASE 
                        WHEN pw.input_qty > 0 THEN ROUND((pw.output_qty / pw.input_qty * 100), 1)
                        ELSE 0
                    END AS progress_rate,
                    
                    COALESCE(pw.input_qty, 1000) as order_qty,
                    COALESCE(pw.input_qty, 1000) as target_qty,
                    COALESCE(emp.employee_name, pw.employee_name, '작업자') as emp_name,
                    0 as defect_qty,
                    
                    pw.work_id as work_no
                    
                FROM package_work pw
                LEFT JOIN tablets.employees emp ON pw.employee_id = emp.employee_id
                WHERE pw.work_id IS NOT NULL
            `;
            
            const params = [];
            
            // 포장타입 필터
            if (packageType) {
                if (packageType === 'INNER') {
                    query += ` AND (pw.step_name NOT LIKE '%외포장%' AND pw.step_name NOT LIKE '%2차%')`;
                } else if (packageType === 'OUTER') {
                    query += ` AND (pw.step_name LIKE '%외포장%' OR pw.step_name LIKE '%2차%')`;
                }
            }
            
            // 라인 필터
            if (lineId && lineId !== 'ALL') {
                query += ` AND (pw.line_id LIKE ? OR pw.work_line LIKE ?)`;
                params.push(`%${lineId}%`, `%${lineId}%`);
            }
            
            if (lineName && lineName !== 'ALL') {
                query += ` AND (pw.line_id LIKE ? OR pw.work_line LIKE ? OR pw.step_name LIKE ?)`;
                params.push(`%${lineName}%`, `%${lineName}%`, `%${lineName}%`);
            }
            
            query += ` ORDER BY pw.reg_date DESC LIMIT 50`;
            
            const result = await this.executeRawQuery(query, params);
            console.log(`package_work 작업 목록 조회 완료 (실제 제품명 적용): ${result.length}건`);
            
            return this.convertBigIntToNumber(result);
            
        } catch (error) {
            console.error('package_work 작업 목록 조회 실패 (실제 제품명 적용):', error);
            throw new Error(`package_work DB 연결 실패: ${error.message}`);
        }
    }

    // 기타 필요한 함수들 (실제 제품명 적용)
    async getWorkDetail(workId) {
        try {
            const result = await this.executeRawQuery(`
                SELECT 
                    pw.*,
                    COALESCE(emp.employee_name, pw.employee_name, '작업자') as employee_name,
                    COALESCE(emp.position, '작업자') as position,
                    COALESCE(emp.department_code, '포장부') as department_code,
                    emp.employment_status,
                    NULL as result_detail_id,
                    COALESCE(pw.product_name, pw.step_name, '제품명없음') as final_product_name,
                    COALESCE(emp.employee_name, pw.employee_name, '작업자') as emp_name,
                    COALESCE(pw.input_qty, 1000) as order_qty,
                    COALESCE(pw.work_line, pw.line_id, '라인정보없음') as line_name,
                    pw.work_id as work_no
                FROM package_work pw
                LEFT JOIN tablets.employees emp ON pw.employee_id = emp.employee_id
                WHERE pw.work_id = ?
            `, [workId]);
            
            return result.length > 0 ? this.convertBigIntToNumber(result[0]) : null;
        } catch (error) {
            console.error(`작업 상세 조회 실패 (실제 제품명 적용) (${workId}):`, error);
            return null;
        }
    }

    async getProductCodes() {
        try {
            const query = `
                SELECT DISTINCT 
                    pw.product_name,
                    pw.product_name as product_code,
                    COUNT(*) as work_count
                FROM package_work pw
                LEFT JOIN tablets.employees emp ON pw.employee_id = emp.employee_id
                WHERE pw.product_name IS NOT NULL 
                AND pw.product_name != ''
                GROUP BY pw.product_name
                ORDER BY work_count DESC
            `;
            
            const result = await this.executeRawQuery(query);
            console.log(`제품코드 조회 완료 (실제 제품명 적용): ${result.length}개`);
            return this.convertBigIntToNumber(result);
            
        } catch (error) {
            console.error('제품코드 조회 실패 (실제 제품명 적용):', error);
            throw error;
        }
    }

    async getWorksByLine(lineId) {
        try {
            const query = `
                SELECT 
                    pw.work_id,
                    pw.work_order_no,
                    pw.step_name,
                    pw.step_status,
                    pw.input_qty,
                    pw.output_qty,
                    COALESCE(emp.employee_name, pw.employee_name, '작업자') as employee_name,
                    COALESCE(emp.position, '작업자') as position,
                    COALESCE(emp.department_code, '포장부') as department_code,
                    pw.product_name,
                    pw.line_id,
                    pw.work_line,
                    NULL as result_detail_id,
                    
                    COALESCE(pw.product_name, pw.step_name, '제품명없음') as final_product_name,
                    COALESCE(pw.work_line, pw.line_id, '라인정보없음') as line_name,
                    
                    CASE 
                        WHEN pw.input_qty > 0 THEN ROUND((pw.output_qty / pw.input_qty * 100), 1)
                        ELSE 0
                    END AS progress_rate,
                    
                    pw.work_id as work_no
                    
                FROM package_work pw
                LEFT JOIN tablets.employees emp ON pw.employee_id = emp.employee_id
                WHERE (pw.line_id LIKE ? OR pw.work_line LIKE ?)
                ORDER BY pw.reg_date DESC
            `;
            
            const result = await this.executeRawQuery(query, [`%${lineId}%`, `%${lineId}%`]);
            return this.convertBigIntToNumber(result);
            
        } catch (error) {
            console.error('라인별 작업 조회 실패 (실제 제품명 적용):', error);
            throw error;
        }
    }

    // 테스트용 함수들
    async debugTableStructure() {
        try {
            console.log('=== 테이블 구조 확인 (실제 제품명 적용) ===');
            
            const tables = ['package_work', 'work_order_master', 'work_result', 'work_result_detail', 'process', 'process_group', 'employees'];
            const tableInfo = {};
            
            for (const tableName of tables) {
                try {
                    const countQuery = `SELECT COUNT(*) as total_rows FROM ${tableName}`;
                    const countResult = await this.executeRawQuery(countQuery);
                    
                    tableInfo[tableName] = {
                        exists: true,
                        total_rows: countResult[0].total_rows
                    };
                } catch (error) {
                    tableInfo[tableName] = {
                        exists: false,
                        error: error.message
                    };
                }
            }
            
            // employees 테이블 활성 사용자 수 확인
            try {
                const activeEmployees = await this.executeRawQuery(`
                    SELECT COUNT(*) as active_count 
                    FROM employees 
                    WHERE employment_status = 'Y'
                `);
                tableInfo.employees.active_employees = activeEmployees[0].active_count;
                
                // 전체 employees 수도 확인
                const allEmployees = await this.executeRawQuery(`
                    SELECT COUNT(*) as total_employees 
                    FROM employees
                `);
                tableInfo.employees.total_employees = allEmployees[0].total_employees;
            } catch (error) {
                tableInfo.employees.active_employees = 0;
                tableInfo.employees.total_employees = 0;
            }
            
            return {
                success: true,
                data: tableInfo
            };
            
        } catch (error) {
            console.error('테이블 구조 확인 실패 (실제 제품명 적용):', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    async simpleDataCheck() {
        try {
            const checks = {};
            
            const tables = ['package_work', 'work_order_master', 'work_result', 'work_result_detail', 'process', 'process_group', 'employees'];
            
            for (const table of tables) {
                try {
                    const result = await this.executeRawQuery(`SELECT COUNT(*) as total FROM ${table}`);
                    checks[`${table}_rows`] = result[0].total;
                } catch (error) {
                    checks[`${table}_rows`] = 0;
                }
            }
            
            // employees 테이블 활성 사용자 수
            try {
                const activeResult = await this.executeRawQuery(`
                    SELECT COUNT(*) as total FROM employees WHERE employment_status = 'Y'
                `);
                checks.active_employees = activeResult[0].total;
                
                // 전체 employees 수
                const allResult = await this.executeRawQuery(`
                    SELECT COUNT(*) as total FROM employees
                `);
                checks.total_employees = allResult[0].total;
            } catch (error) {
                checks.active_employees = 0;
                checks.total_employees = 0;
            }
            
            return {
                success: true,
                data: {
                    ...checks,
                    has_data: Object.values(checks).some(count => count > 0)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 싱글톤 인스턴스 생성
const packageService = new PackageService();

// 모듈 익스포트 (실제 제품명 매핑 함수 추가)
module.exports = {
    // 라인별 단일 작업번호 조회 (실제 제품명 적용)
    getInnerWorkByLine: function(...args) { return packageService.getInnerWorkByLine(...args); },
    getOuterWorkByLine: function(...args) { return packageService.getOuterWorkByLine(...args); },
    
    // 워크플로우 함수들
    startInnerPackagingWorkflow: function(...args) { return packageService.startInnerPackagingWorkflow(...args); },
    completeInnerPackagingWorkflow: function(...args) { return packageService.completeInnerPackagingWorkflow(...args); },
    startOuterPackagingWorkflow: function(...args) { return packageService.startOuterPackagingWorkflow(...args); },
    completeOuterPackagingWorkflow: function(...args) { return packageService.completeOuterPackagingWorkflow(...args); },
    
    // 기존 package_work 테이블 함수들 (실제 제품명 적용)
    getWorkList: function(...args) { return packageService.getWorkList(...args); },
    getWorkDetail: function(...args) { return packageService.getWorkDetail(...args); },
    getProductCodes: function(...args) { return packageService.getProductCodes(...args); },
    getWorksByLine: function(...args) { return packageService.getWorksByLine(...args); },
    
    // 제품명 매핑 함수 추가
    getProductNameFromCode: function(...args) { return packageService.getProductNameFromCode(...args); },
    extractProductCodeFromLine: function(...args) { return packageService.extractProductCodeFromLine(...args); },
    
    // 유틸리티 함수들
    debugTableStructure: function(...args) { return packageService.debugTableStructure(...args); },
    executeRawQuery: function(...args) { return packageService.executeRawQuery(...args); },
    testConnection: function(...args) { return packageService.testConnection(...args); },
    simpleDataCheck: function(...args) { return packageService.simpleDataCheck(...args); },
    convertBigIntToNumber: function(...args) { return packageService.convertBigIntToNumber(...args); }
};