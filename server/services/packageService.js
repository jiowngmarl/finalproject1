// services/packageService.js - Process7 포장공정 전체 구조 반영 (오류 수정)
// 작업 흐름:
// Process7 = 포장공정 전체 (내포장 + 외포장)
// code_value로 단계 구분:
// - p1: 포장 대기
// - p3: 내포장 진행중  
// - p5: 내포장 완료 (외포장 준비)
// - p7: 외포장 진행중
// - p9: 외포장 완료
//
// UPDATE 쿼리 흐름:
// - 내포장 시작: p1 → p3
// - 내포장 완료: p3 → p5  
// - 외포장 시작: p5 → p7
// - 외포장 완료: p7 → p9

const mariadb = require('mariadb');
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

        console.log('데이터베이스 연결 설정:');
        console.log('- HOST:', dbConfig.host);
        console.log('- USER:', dbConfig.user);
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
            console.log('데이터베이스 연결 성공');
            
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

    // 쿼리 실행
    async executeQuery(query, params = []) {
        let conn;
        try {
            console.log('쿼리 실행:', query.substring(0, 100) + '...');
            
            conn = await this.pool.getConnection();
            const rows = await conn.query(query, params);
            
            console.log('쿼리 실행 성공:', Array.isArray(rows) ? rows.length : 1, '건');
            return rows;
            
        } catch (error) {
            console.error('쿼리 실행 실패:', error.message);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    // 제품코드 추출 (라인명에서)
    extractProductCodeFromLine(lineName) {
        if (!lineName) return 'BJA-STD-10';
        
        console.log('제품코드 추출:', lineName);
        
        // 라인별 제품코드 매핑 (우선순위)
        const lineMapping = {
            'A라인': 'BJA-STD-10',    // A라인 = 베아제정
            'B라인': 'BJA-DR-10',   // B라인 = 닥터베아제정
            'C라인': 'FST-GOLD-10',  // C라인 = 헬스컵골드정
            'D라인': 'FST-PLUS-10',  // D라인 = 헬스컵플러스정
            'E라인': 'GB-V-10'       // E라인 = 게보린브이정
        };
        
        // 라인명으로 먼저 매핑
        for (const [line, productCode] of Object.entries(lineMapping)) {
            if (lineName.includes(line)) {
                console.log(`라인 매칭: ${line} -> ${productCode}`);
                if (lineName.includes('30')) return productCode.replace('-10', '-30');
                if (lineName.includes('60')) return productCode.replace('-10', '-60');
                return productCode;
            }
        }
        
        // 제품명 매핑 - 긴 이름부터 먼저 체크
        const productMapping = {
            '닥터베아제정': 'BJA-DR-10',
            '베아제정': 'BJA-STD-10',
            '헬스컵골드정': 'FST-GOLD-10',
            '헬스컵플러스정': 'FST-PLUS-10',
            '게보린브이정': 'GB-V-10',
            '게보린정': 'GB-STD-10',
            '그날엔큐정': 'GN-Q-10',
            '그날엔정': 'GN-STD-10',
            '판코레아정': 'PCT-STD-10',
            '타이레놀정500mg': 'TN-500-10',
            '타이레놀정8시간': 'TN-8HR-10',
            '타이레놀우먼스정': 'TN-WMN-10'
        };
        
        for (const [productName, productCode] of Object.entries(productMapping)) {
            if (lineName.includes(productName)) {
                console.log(`제품명 매칭: ${productName} -> ${productCode}`);
                if (lineName.includes('30')) return productCode.replace('-10', '-30');
                if (lineName.includes('60')) return productCode.replace('-10', '-60');
                return productCode;
            }
        }
        
        console.log('제품코드 매핑 실패, 기본값 사용');
        return 'BJA-STD-10';
    }

    // 제품명 변환
    getProductNameFromCode(productCode) {
        const productNameMap = {
            'BJA-STD-10': '베아제정', 'BJA-STD-30': '베아제정', 'BJA-STD-60': '베아제정',
            'BJA-DR-10': '닥터베아제정', 'BJA-DR-30': '닥터베아제정', 'BJA-DR-60': '닥터베아제정',
            'FST-GOLD-10': '헬스컵골드정', 'FST-GOLD-30': '헬스컵골드정', 'FST-GOLD-60': '헬스컵골드정',
            'FST-PLUS-10': '헬스컵플러스정', 'FST-PLUS-30': '헬스컵플러스정', 'FST-PLUS-60': '헬스컵플러스정',
            'GB-STD-10': '게보린정', 'GB-STD-30': '게보린정', 'GB-STD-60': '게보린정',
            'GB-V-10': '게보린브이정', 'GB-V-30': '게보린브이정', 'GB-V-60': '게보린브이정',
            'GN-Q-10': '그날엔큐정', 'GN-Q-30': '그날엔큐정', 'GN-Q-60': '그날엔큐정',
            'GN-STD-10': '그날엔정', 'GN-STD-30': '그날엔정', 'GN-STD-60': '그날엔정',
            'PCT-STD-10': '판코레아정', 'PCT-STD-30': '판코레아정', 'PCT-STD-60': '판코레아정',
            'TN-500-10': '타이레놀정500mg', 'TN-500-30': '타이레놀정500mg', 'TN-500-60': '타이레놀정500mg',
            'TN-8HR-10': '타이레놀정8시간 ER', 'TN-8HR-30': '타이레놀정8시간 ER', 'TN-8HR-60': '타이레놀정8시간 ER',
            'TN-WMN-10': '타이레놀우먼스정', 'TN-WMN-30': '타이레놀우먼스정', 'TN-WMN-60': '타이레놀우먼스정'
        };
        
        const productName = productNameMap[productCode] || productCode;
        console.log(`제품코드 -> 제품명 변환: ${productCode} -> ${productName}`);
        return productName;
    }

    // 데이터베이스 구조 확인 메서드
    async checkDatabaseStructure() {
        try {
            console.log('=== 데이터베이스 구조 확인 ===');
            
            // 1. work_result_detail 테이블의 실제 데이터 샘플 조회
            console.log('1. work_result_detail 샘플 데이터 조회');
            const sampleData = await this.executeQuery(`
                SELECT * FROM tablets.work_result_detail 
                ORDER BY work_start_time DESC 
                LIMIT 5
            `);
            console.log('샘플 데이터:', sampleData);
            
            // 2. process_code별 데이터 분포 확인
            console.log('2. process_code별 데이터 분포');
            const processDistribution = await this.executeQuery(`
                SELECT process_code, code_value, COUNT(*) as count
                FROM tablets.work_result_detail 
                GROUP BY process_code, code_value
                ORDER BY process_code, code_value
            `);
            console.log('process_code 분포:', processDistribution);
            
            // 3. 최근 작업 데이터 확인
            console.log('3. 최근 작업 데이터');
            const recentWork = await this.executeQuery(`
                SELECT result_detail, process_code, code_value, work_start_time, work_end_time
                FROM tablets.work_result_detail 
                WHERE work_start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY work_start_time DESC
                LIMIT 10
            `);
            console.log('최근 작업:', recentWork);
            
            return { sampleData, processDistribution, recentWork };
        } catch (error) {
            console.error('데이터베이스 구조 확인 실패:', error);
            return null;
        }
    }

    // 단순한 내포장 작업번호 조회 (Process7 = 포장공정 전체)
    async getSimpleInnerWorkNumbers(productCode) {
        try {
            console.log('=== 단순한 내포장 작업번호 조회 (Process7 = 포장공정) ===');
            
            // Process7이 포장공정 전체 - 내포장은 p1, p3, p5 상태
            const allWork = await this.executeQuery(`
                SELECT 
                    wrd.result_detail,
                    wrd.result_id,
                    wrd.process_code,
                    wrd.code_value,
                    wrd.pass_qty,
                    wrd.work_start_time,
                    wrd.work_end_time,
                    wrd.process_seq,
                    CASE 
                        WHEN wrd.manager_id REGEXP '^[0-9]+$' THEN e.employee_name
                        ELSE COALESCE(wrd.manager_id, '담당자미정')
                    END as employee_name
                FROM tablets.work_result_detail wrd
                LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
                WHERE wrd.result_detail IS NOT NULL
                AND (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
                AND wrd.code_value IN ('p1', 'p3', 'p5')
                ORDER BY wrd.work_start_time DESC
                LIMIT 10
            `);
            
            console.log(`포장공정(Process7) 데이터: ${allWork.length}건`);
            
            if (allWork.length > 0) {
                // 제품코드가 일치하는 것 우선, 내포장 상태 우선 (p1, p3)
                const matchingProduct = allWork.filter(work => 
                    (work.process_code.includes(productCode) || work.process_code.includes('BJA-STD-10'))
                );
                
                if (matchingProduct.length > 0) {
                    console.log('제품코드 매칭 데이터 발견:', matchingProduct[0]);
                    return matchingProduct;
                }
            }
            
            return allWork;
            
        } catch (error) {
            console.error('단순한 내포장 작업번호 조회 실패:', error);
            return [];
        }
    }

    // 내포장 작업번호 조회 (Process7 기반)
    async getInnerWorkByLine(lineId, lineName) {
        try {
            console.log(`=== 내포장 작업번호 조회 시작: ${lineId}, ${lineName} ===`);
            
            let productCode = this.extractProductCodeFromLine(lineName);
            if (productCode === 'BJA-STD-10' && lineName.includes('A라인')) {
                productCode = 'BJA-DR-10';
            }
            console.log(`추출된 제품코드: ${productCode}`);
            
            // 1. 먼저 데이터베이스 구조 확인
            await this.checkDatabaseStructure();
            
            // 2. 단순한 작업번호 조회 (제품코드 전달)
            const simpleWork = await this.getSimpleInnerWorkNumbers(productCode);
            
            if (simpleWork.length > 0) {
                console.log('단순 조회로 작업 발견:', simpleWork[0]);
                const work = simpleWork[0];
                
                let stepStatus = 'READY';
                switch(work.code_value) {
                    case 'p1': stepStatus = 'READY'; break;
                    case 'p3': stepStatus = 'IN_PROGRESS'; break;
                    case 'p5': stepStatus = 'COMPLETED'; break;
                    default: stepStatus = 'READY';
                }
                
                return {
                    result_detail: work.result_detail,
                    work_order_no: work.result_detail,
                    result_id: work.result_id,
                    product_code: productCode,
                    product_name: this.getProductNameFromCode(productCode),
                    process_code: work.process_code,
                    step_status: stepStatus,
                    input_qty: work.pass_qty || 1000,
                    employee_name: work.employee_name,
                    db_code_value: work.code_value,
                    work_start_time: work.work_start_time,
                    work_end_time: work.work_end_time,
                    process_seq: work.process_seq
                };
            }
            
            // 3. 프로젝트 지식에 따른 조회 시도
            console.log('단순 조회 실패, 프로젝트 지식 적용');
            return await this.getInnerWorkByProjectKnowledge(productCode);
            
        } catch (error) {
            console.error('내포장 작업번호 조회 실패:', error);
            
            // 최종 대안 - 기본 응답
            let productCode = this.extractProductCodeFromLine(lineName);
            if (productCode === 'BJA-STD-10' && lineName.includes('A라인')) {
                productCode = 'BJA-DR-10';
            }
            
            return {
                result_detail: null,
                work_order_no: null,
                result_id: null,
                product_code: productCode,
                product_name: this.getProductNameFromCode(productCode),
                process_code: 'p3',
                step_status: 'ERROR',
                input_qty: 0,
                employee_name: '담당자미정',
                error: error.message
            };
        }
    }

    // 프로젝트 지식에 따른 내포장 조회
    async getInnerWorkByProjectKnowledge(productCode) {
        try {
            // 2-1) 해당 제품코드의 공정흐름도 정보 가져오기
            console.log('2-1) 공정흐름도 정보 조회');
            let processInfo;
            
            try {
                processInfo = await this.executeQuery(`
                    SELECT process_group_code, process_seq, process_code
                    FROM tablets.process
                    WHERE process_group_code = (
                        SELECT process_group_code 
                        FROM tablets.process_group 
                        WHERE product_code = ?
                    )
                    AND process_int = (
                        SELECT process_int 
                        FROM tablets.process_it 
                        WHERE process_name = '포장'
                    )
                    ORDER BY process_seq
                    LIMIT 1
                `, [productCode]);
            } catch (error) {
                console.log('프로젝트 지식 쿼리 실패:', error.message);
                return null; // 단순 조회로 넘어감
            }
            
            if (processInfo.length === 0) {
                console.log('공정흐름도 정보 없음');
                return null;
            }
            
            const { process_group_code, process_seq } = processInfo[0];
            console.log(`공정그룹코드: ${process_group_code}, 포장공정 순서: ${process_seq}`);
            
            // 2-2) 작업실적테이블에서 진행중인 실적 가져오기 (이전 공정 완료된 것)
            console.log('2-2) 이전 공정 완료된 실적 조회');
            const workResult = await this.executeQuery(`
                SELECT wr.result_id
                FROM tablets.work_result wr 
                JOIN tablets.work_result_detail wrd ON wr.result_id = wrd.result_id
                WHERE wr.process_group_code = ?
                AND wrd.process_seq = ?
                AND wrd.code_value = 'p5'
                ORDER BY wrd.work_end_time DESC
                LIMIT 1
            `, [process_group_code, process_seq - 1]);
            
            if (workResult.length === 0) {
                console.log('이전 공정 완료 실적 없음');
                return null;
            }
            
            const targetResultId = workResult[0].result_id;
            console.log(`이전 공정 완료된 실적ID: ${targetResultId}`);
            
            // 2-3) 작업실적상세테이블에서 작업번호 가져오기
            console.log('2-3) 포장공정 작업번호 조회');
            const workDetail = await this.executeQuery(`
                SELECT 
                    wrd.result_detail,
                    wrd.result_id,
                    wrd.pass_qty,
                    wrd.code_value,
                    CASE 
                        WHEN wrd.manager_id REGEXP '^[0-9]+$' THEN e.employee_name
                        ELSE COALESCE(wrd.manager_id, '담당자미정')
                    END as employee_name
                FROM tablets.work_result_detail wrd
                LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
                WHERE wrd.result_id = ?
                AND wrd.process_seq = ?
                AND (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
                AND wrd.code_value IN ('p1', 'p3', 'p5')
                ORDER BY 
                    CASE WHEN wrd.code_value = 'p1' THEN 1
                         WHEN wrd.code_value = 'p3' THEN 2
                         WHEN wrd.code_value = 'p5' THEN 3
                         ELSE 4 END
                LIMIT 1
            `, [targetResultId, process_seq]);
            
            if (workDetail.length > 0) {
                console.log('프로젝트 지식에 따른 내포장 작업 발견:', workDetail[0]);
                const work = workDetail[0];
                
                let stepStatus = 'READY';
                switch(work.code_value) {
                    case 'p1': stepStatus = 'READY'; break;
                    case 'p3': stepStatus = 'IN_PROGRESS'; break;
                    case 'p5': stepStatus = 'COMPLETED'; break;
                    default: stepStatus = 'READY';
                }
                
                return {
                    result_detail: work.result_detail,
                    work_order_no: work.result_detail,
                    result_id: work.result_id,
                    product_code: productCode,
                    product_name: this.getProductNameFromCode(productCode),
                    process_code: 'Process7',
                    step_status: stepStatus,
                    input_qty: work.pass_qty || 1000,
                    employee_name: work.employee_name,
                    db_code_value: work.code_value,
                    process_group_code: process_group_code,
                    process_seq: process_seq
                };
            }
            
            return null; // 작업을 찾지 못함
            
        } catch (error) {
            console.error('프로젝트 지식에 따른 내포장 조회 실패:', error);
            return null;
        }
    }

    // 외포장 작업번호 조회 (Process7 = 포장공정 전체)
    async getOuterWorkByLine(lineId, lineName) {
        try {
            console.log(`=== 외포장 작업번호 조회 시작: ${lineId}, ${lineName} ===`);
            
            let productCode = this.extractProductCodeFromLine(lineName);
            if (productCode === 'BJA-STD-10' && lineName.includes('A라인')) {
                productCode = 'BJA-DR-10';
            }
            console.log(`제품코드: ${productCode}`);
            
            // Process7에서 외포장 관련 상태 조회 (p7=외포장진행, p9=외포장완료)
            const outerWork = await this.executeQuery(`
                SELECT 
                    wrd.result_detail,
                    wrd.result_id,
                    wrd.process_code,
                    wrd.code_value,
                    wrd.pass_qty,
                    wrd.work_start_time,
                    wrd.work_end_time,
                    wrd.process_seq,
                    CASE 
                        WHEN wrd.manager_id REGEXP '^[0-9]+$' THEN e.employee_name
                        ELSE COALESCE(wrd.manager_id, '담당자미정')
                    END as employee_name
                FROM tablets.work_result_detail wrd
                LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
                WHERE (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
                AND wrd.result_detail IS NOT NULL
                AND (wrd.process_code LIKE ? OR wrd.process_code LIKE 'BJA-STD-10%')
                AND wrd.code_value IN ('p5', 'p7', 'p9')  -- p5=내포장완료, p7=외포장진행, p9=외포장완료
                ORDER BY 
                    CASE WHEN wrd.code_value = 'p7' THEN 1  -- 외포장 진행중 우선
                         WHEN wrd.code_value = 'p5' THEN 2  -- 내포장 완료 (외포장 준비)
                         WHEN wrd.code_value = 'p9' THEN 3  -- 외포장 완료
                         ELSE 4 END,
                    wrd.work_start_time DESC
                LIMIT 5
            `, [`%${productCode}%`]);
            
            if (outerWork.length > 0) {
                console.log('포장공정(Process7) 외포장 관련 작업 발견:', outerWork[0]);
                const work = outerWork[0];
                
                let stepStatus = 'READY';
                let processType = '외포장';
                
                switch(work.code_value) {
                    case 'p5': 
                        stepStatus = 'READY_FOR_OUTER';
                        processType = '내포장완료-외포장준비';
                        break;
                    case 'p7': 
                        stepStatus = 'IN_PROGRESS';
                        processType = '외포장';
                        break;
                    case 'p9': 
                        stepStatus = 'COMPLETED';
                        processType = '외포장';
                        break;
                    default: 
                        stepStatus = 'READY';
                        processType = '외포장';
                }
                
                return {
                    result_detail: work.result_detail,
                    work_order_no: work.result_detail,
                    result_id: work.result_id,
                    product_code: productCode,
                    product_name: this.getProductNameFromCode(productCode),
                    process_code: work.process_code,
                    step_status: stepStatus,
                    input_qty: work.pass_qty || 1000,
                    employee_name: work.employee_name,
                    db_code_value: work.code_value,
                    work_start_time: work.work_start_time,
                    work_end_time: work.work_end_time,
                    process_seq: work.process_seq,
                    process_type: processType,
                    message: work.code_value === 'p5' ? '내포장 완료됨. 외포장 시작 가능.' : undefined
                };
            }
            
            // 외포장 관련 데이터가 없으면 내포장 완료 상태 확인
            console.log('외포장 관련 데이터 없음, 내포장 완료 상태 확인');
            const completedInner = await this.executeQuery(`
                SELECT 
                    wrd.result_detail,
                    wrd.result_id,
                    wrd.pass_qty,
                    wrd.process_code,
                    CASE 
                        WHEN wrd.manager_id REGEXP '^[0-9]+$' THEN e.employee_name
                        ELSE COALESCE(wrd.manager_id, '담당자미정')
                    END as employee_name
                FROM tablets.work_result_detail wrd
                LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
                WHERE (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
                AND wrd.code_value = 'p5'  -- 내포장 완료
                AND (wrd.process_code LIKE ? OR wrd.process_code LIKE 'BJA-STD-10%')
                ORDER BY wrd.work_end_time DESC
                LIMIT 1
            `, [`%${productCode}%`]);
            
            if (completedInner.length > 0) {
                console.log('내포장 완료 건 발견, 외포장 시작 가능:', completedInner[0]);
                const innerWork = completedInner[0];
                
                return {
                    result_detail: innerWork.result_detail,
                    work_order_no: innerWork.result_detail,
                    result_id: innerWork.result_id,
                    product_code: productCode,
                    product_name: this.getProductNameFromCode(productCode),
                    process_code: innerWork.process_code,
                    step_status: 'READY_FOR_OUTER',
                    input_qty: innerWork.pass_qty || 1000,
                    employee_name: innerWork.employee_name,
                    message: '내포장 완료됨. 외포장 시작 가능.',
                    db_code_value: 'p5',
                    process_type: '내포장완료-외포장준비'
                };
            }
            
            // 조회된 데이터가 없음
            console.log('내포장 완료 건도 없음');
            return {
                result_detail: null,
                work_order_no: null,
                result_id: null,
                product_code: productCode,
                product_name: this.getProductNameFromCode(productCode),
                process_code: `${productCode}Process7`,
                step_status: 'NO_DATA',
                input_qty: 0,
                employee_name: '담당자미정',
                message: '내포장을 먼저 완료해주세요.',
                process_type: '외포장'
            };
            
        } catch (error) {
            console.error('외포장 작업번호 조회 실패:', error);
            return {
                result_detail: null,
                work_order_no: null,
                result_id: null,
                product_code: this.extractProductCodeFromLine(lineName),
                product_name: this.getProductNameFromCode(this.extractProductCodeFromLine(lineName)),
                process_code: 'Process7',
                step_status: 'ERROR',
                input_qty: 0,
                employee_name: '담당자미정',
                error: error.message,
                process_type: '외포장'
            };
        }
    }

    // 내포장 작업 시작 - Process7에서 p1→p3
    async startInnerPackaging(resultDetail, startTime, managerId, passQty) {
        try {
            console.log(`=== 내포장 작업 시작: ${resultDetail}, 담당자: ${managerId} ===`);
            
            // 담당자 유효성 검사 - 문자열도 허용
            let validManagerId = managerId;
            if (managerId) {
                if (managerId.toString().match(/^\d+$/)) {
                    const employeeCheck = await this.executeQuery(`
                        SELECT employee_id, employee_name 
                        FROM tablets.employees 
                        WHERE employee_id = ? AND employment_status = 'ACTIVE'
                    `, [managerId]);
                    
                    if (employeeCheck.length === 0) {
                        console.warn(`담당자 ID ${managerId}를 찾을 수 없거나 비활성 상태입니다.`);
                        validManagerId = managerId; // 그래도 저장
                    } else {
                        console.log(`담당자 확인됨: ${employeeCheck[0].employee_name}`);
                    }
                } else {
                    console.log(`담당자 이름으로 저장: ${managerId}`);
                }
            }
            
            // Process7에서 내포장 시작: p1 → p3
            const result = await this.executeQuery(`
                UPDATE tablets.work_result_detail
                SET 
                    code_value = 'p3',
                    work_start_time = ?,        
                    pass_qty = ?,             
                    manager_id = ?           
                WHERE result_detail = ?
                AND (process_code LIKE '%Process7%' OR process_seq = 7)
                AND code_value = 'p1'
            `, [startTime || new Date(), passQty, validManagerId, resultDetail]);
            
            console.log(`내포장 작업 시작 완료: ${result.affectedRows}건 업데이트`);
            
            if (result.affectedRows === 0) {
                const currentStatus = await this.executeQuery(`
                    SELECT code_value FROM tablets.work_result_detail
                    WHERE result_detail = ? 
                    AND (process_code LIKE '%Process7%' OR process_seq = 7)
                `, [resultDetail]);
                
                if (currentStatus.length > 0) {
                    const status = currentStatus[0].code_value;
                    return {
                        success: false,
                        message: `작업이 이미 ${status} 상태입니다. p1(대기중) 상태에서만 시작할 수 있습니다.`,
                        current_status: status
                    };
                } else {
                    return {
                        success: false,
                        message: '해당 내포장 작업번호를 찾을 수 없습니다.',
                        result_detail: resultDetail
                    };
                }
            }
            
            return {
                success: true,
                message: '내포장 작업이 시작되었습니다',
                data: { 
                    result_detail: resultDetail, 
                    status: 'p3',
                    start_time: startTime || new Date(),
                    manager_id: validManagerId
                }
            };
            
        } catch (error) {
            console.error('내포장 작업 시작 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 내포장 작업 완료 - Process7에서 p3→p5
    async completeInnerPackaging(resultDetail, endTime, passQty, managerId) {
        try {
            console.log(`=== 내포장 작업 완료: ${resultDetail}, 담당자: ${managerId} ===`);
            
            // 담당자 유효성 검사 - 문자열도 허용
            let validManagerId = managerId;
            if (managerId) {
                if (managerId.toString().match(/^\d+$/)) {
                    const employeeCheck = await this.executeQuery(`
                        SELECT employee_id, employee_name 
                        FROM tablets.employees 
                        WHERE employee_id = ? AND employment_status = 'ACTIVE'
                    `, [managerId]);
                    
                    if (employeeCheck.length === 0) {
                        console.warn(`담당자 ID ${managerId}를 찾을 수 없거나 비활성 상태입니다.`);
                        validManagerId = managerId; // 그래도 저장
                    } else {
                        console.log(`담당자 확인됨: ${employeeCheck[0].employee_name}`);
                    }
                } else {
                    console.log(`담당자 이름으로 저장: ${managerId}`);
                }
            }
            
            // Process7에서 내포장 완료: p3 → p5
            const result = await this.executeQuery(`
                UPDATE tablets.work_result_detail
                SET 
                    code_value = 'p5',
                    work_start_time = ?,
                    pass_qty = ?,
                    manager_id = ?
                WHERE result_detail = ?
                AND (process_code LIKE '%Process7%' OR process_seq = 7)
                AND code_value = 'p3'
            `, [endTime || new Date(), passQty || 1000, validManagerId, resultDetail]);
            
            console.log(`내포장 작업 완료: ${result.affectedRows}건 업데이트`);
            
            if (result.affectedRows === 0) {
                const currentStatus = await this.executeQuery(`
                    SELECT code_value FROM tablets.work_result_detail
                    WHERE result_detail = ? 
                    AND (process_code LIKE '%Process7%' OR process_seq = 7)
                `, [resultDetail]);
                
                if (currentStatus.length > 0) {
                    const status = currentStatus[0].code_value;
                    return {
                        success: false,
                        message: `작업이 ${status} 상태입니다. p3(진행중) 상태에서만 완료할 수 있습니다.`,
                        current_status: status
                    };
                } else {
                    return {
                        success: false,
                        message: '해당 내포장 작업번호를 찾을 수 없습니다.',
                        result_detail: resultDetail
                    };
                }
            }
            
            return {
                success: true,
                message: '내포장 작업이 완료되었습니다. 외포장을 시작할 수 있습니다.',
                data: { 
                    result_detail: resultDetail,
                    status: 'p5',
                    start_time: endTime || new Date(),
                    pass_qty: passQty || 1000,
                    manager_id: validManagerId
                }
            };
            
        } catch (error) {
            console.error('내포장 작업 완료 실패:', error);
            return { 
                success: false, 
                error: error.message,
                details: '내포장 작업 완료 중 오류가 발생했습니다.'
            };
        }
    }

    // 외포장 작업 시작 - Process7에서 p5→p7
    async startOuterPackaging(resultDetail, startTime, managerId, passQty) {
        try {
            console.log(`=== 외포장 작업 시작: ${resultDetail}, 담당자: ${managerId} ===`);
            
            // 담당자 유효성 검사 - 문자열도 허용
            let validManagerId = managerId;
            if (managerId) {
                if (managerId.toString().match(/^\d+$/)) {
                    const employeeCheck = await this.executeQuery(`
                        SELECT employee_id, employee_name 
                        FROM tablets.employees 
                        WHERE employee_id = ? AND employment_status = 'ACTIVE'
                    `, [managerId]);
                    
                    if (employeeCheck.length === 0) {
                        console.warn(`담당자 ID ${managerId}를 찾을 수 없거나 비활성 상태입니다.`);
                        validManagerId = managerId; // 그래도 저장
                    } else {
                        console.log(`담당자 확인됨: ${employeeCheck[0].employee_name}`);
                    }
                } else {
                    console.log(`담당자 이름으로 저장: ${managerId}`);
                }
            }
            
            // Process7에서 외포장 시작: p5 → p7
            const result = await this.executeQuery(`
                UPDATE tablets.work_result_detail
                SET 
                    code_value = 'p7',
                    pass_qty = ?,
                    manager_id = ?
                WHERE result_detail = ?
                AND (process_code LIKE '%Process7%' OR process_seq = 7)
                AND code_value = 'p5'
            `, [passQty || 1000, validManagerId, resultDetail]);
            
            console.log(`외포장 작업 시작 완료: ${result.affectedRows}건 업데이트`);
            
            if (result.affectedRows === 0) {
                const currentStatus = await this.executeQuery(`
                    SELECT code_value FROM tablets.work_result_detail
                    WHERE result_detail = ? 
                    AND (process_code LIKE '%Process7%' OR process_seq = 7)
                `, [resultDetail]);
                
                if (currentStatus.length > 0) {
                    const status = currentStatus[0].code_value;
                    return {
                        success: false,
                        message: `포장 작업이 ${status} 상태입니다. p5(내포장완료) 상태에서만 외포장을 시작할 수 있습니다.`,
                        current_status: status
                    };
                } else {
                    return {
                        success: false,
                        message: '해당 작업번호를 찾을 수 없습니다. 내포장을 먼저 완료해주세요.',
                        result_detail: resultDetail
                    };
                }
            }
            
            return {
                success: true,
                message: '외포장 작업이 시작되었습니다',
                data: { 
                    result_detail: resultDetail, 
                    status: 'p7',
                    pass_qty: passQty || 1000,
                    manager_id: validManagerId
                }
            };
            
        } catch (error) {
            console.error('외포장 작업 시작 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 외포장 작업 완료 - Process7에서 p7→p9
    async completeOuterPackaging(resultDetail, endTime, passQty, managerId) {
        try {
            console.log(`=== 외포장 작업 완료: ${resultDetail}, 담당자: ${managerId} ===`);
            
            // 담당자 유효성 검사 - 문자열도 허용
            let validManagerId = managerId;
            if (managerId) {
                if (managerId.toString().match(/^\d+$/)) {
                    const employeeCheck = await this.executeQuery(`
                        SELECT employee_id, employee_name 
                        FROM tablets.employees 
                        WHERE employee_id = ? AND employment_status = 'ACTIVE'
                    `, [managerId]);
                    
                    if (employeeCheck.length === 0) {
                        console.warn(`담당자 ID ${managerId}를 찾을 수 없거나 비활성 상태입니다.`);
                        validManagerId = managerId; // 그래도 저장
                    } else {
                        console.log(`담당자 확인됨: ${employeeCheck[0].employee_name}`);
                    }
                } else {
                    console.log(`담당자 이름으로 저장: ${managerId}`);
                }
            }
            
            // Process7에서 외포장 완료: p7 → p9
            const result = await this.executeQuery(`
                UPDATE tablets.work_result_detail
                SET 
                    code_value = 'p9',
                    work_end_time = ?,
                    pass_qty = ?,
                    manager_id = ?
                WHERE result_detail = ?
                AND (process_code LIKE '%Process7%' OR process_seq = 7)
                AND code_value = 'p7'
            `, [endTime || new Date(), passQty || 1000, validManagerId, resultDetail]);
            
            console.log(`외포장 작업 완료: ${result.affectedRows}건 업데이트`);
            
            if (result.affectedRows === 0) {
                const currentStatus = await this.executeQuery(`
                    SELECT code_value FROM tablets.work_result_detail
                    WHERE result_detail = ? 
                    AND (process_code LIKE '%Process7%' OR process_seq = 7)
                `, [resultDetail]);
                
                if (currentStatus.length > 0) {
                    const status = currentStatus[0].code_value;
                    return {
                        success: false,
                        message: `포장 작업이 ${status} 상태입니다. p7(외포장진행중) 상태에서만 완료할 수 있습니다.`,
                        current_status: status
                    };
                } else {
                    return {
                        success: false,
                        message: '해당 외포장 작업번호를 찾을 수 없습니다.',
                        result_detail: resultDetail
                    };
                }
            }
            
            return {
                success: true,
                message: '외포장 작업이 완료되었습니다. 포장공정이 모두 완료되었습니다.',
                data: { 
                    result_detail: resultDetail, 
                    status: 'p9',
                    end_time: endTime || new Date(),
                    pass_qty: passQty || 1000,
                    manager_id: validManagerId
                }
            };
            
        } catch (error) {
            console.error('외포장 작업 완료 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // Process7 기반 작업 설정
    async setupInnerPackagingWork(resultDetail, passQty, managerId) {
        try {
            console.log(`=== Process7 포장 작업 설정: ${resultDetail} ===`);
            
            const result = await this.executeQuery(`
                UPDATE tablets.work_result_detail
                SET 
                    code_value = 'p1',
                    work_start_time = NOW(),
                    pass_qty = ?,
                    manager_id = ?
                WHERE result_detail = ?
                AND (process_code LIKE '%Process7%' OR process_seq = 7)
            `, [passQty || 1000, managerId, resultDetail]);
            
            console.log(`Process7 포장 작업 설정 완료: ${result.affectedRows}건 업데이트`);
            
            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0 ? 'Process7 포장 작업이 설정되었습니다 (p1=대기중)' : '작업번호를 찾을 수 없습니다',
                data: {
                    result_detail: resultDetail,
                    status: 'p1',
                    pass_qty: passQty || 1000,
                    manager_id: managerId,
                    work_start_time: new Date()
                }
            };
            
        } catch (error) {
            console.error('Process7 포장 작업 설정 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 작업 상태 조회 (Process7 기반)
    async getWorkStatus(resultDetail) {
        try {
            const result = await this.executeQuery(`
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
                    CASE wrd.code_value 
                        WHEN 'p1' THEN '포장대기'
                        WHEN 'p3' THEN '내포장진행중'
                        WHEN 'p5' THEN '내포장완료'
                        WHEN 'p7' THEN '외포장진행중'
                        WHEN 'p9' THEN '외포장완료'
                        ELSE wrd.code_value
                    END as status_name,
                    CASE wrd.code_value
                        WHEN 'p1' THEN '포장대기'
                        WHEN 'p3' THEN '내포장'
                        WHEN 'p5' THEN '내포장완료-외포장준비'
                        WHEN 'p7' THEN '외포장'
                        WHEN 'p9' THEN '포장완료'
                        ELSE '포장공정'
                    END as process_type
                FROM tablets.work_result_detail wrd
                LEFT JOIN tablets.employees e ON wrd.manager_id = CAST(e.employee_id AS CHAR)
                WHERE wrd.result_detail = ?
                AND (wrd.process_code LIKE '%Process7%' OR wrd.process_seq = 7)
                ORDER BY wrd.process_seq
            `, [resultDetail]);
            
            return result.length > 0 ? result : null;
        } catch (error) {
            console.error('작업 상태 조회 실패:', error);
            return null;
        }
    }

    // 외포장 단계 생성 제거 (Process7에서 code_value로 관리)
    async autoCreateOuterStep(innerResultDetail, passQty) {
        console.log(`Process7에서는 별도 외포장 단계 생성 불필요: ${innerResultDetail}`);
        console.log('내포장 완료 (p5) 후 외포장 시작 (p7)으로 직접 전환');
        return; // Process7에서는 별도 생성 불필요
    }

    async autoCreateOuterStepForOuter(innerResultDetail, resultId, passQty) {
        console.log(`Process7에서는 별도 외포장 단계 생성 불필요: ${innerResultDetail}`);
        console.log('내포장 완료 (p5) 후 외포장 시작 (p7)으로 직접 전환');
        return; // Process7에서는 별도 생성 불필요
    }

    // BigInt 변환
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
}

// 싱글톤 인스턴스
const packageService = new PackageService();

// 모듈 익스포트
module.exports = {
    // 작업번호 조회 (Process7 포장공정 전체 구조)
    getInnerWorkByLine: function(...args) { return packageService.getInnerWorkByLine(...args); },
    getOuterWorkByLine: function(...args) { return packageService.getOuterWorkByLine(...args); },
    
    // 작업 시작/완료 (Process7에서 code_value 기반 상태 변경)
    startInnerPackaging: function(...args) { return packageService.startInnerPackaging(...args); },
    completeInnerPackaging: function(...args) { return packageService.completeInnerPackaging(...args); },
    startOuterPackaging: function(...args) { return packageService.startOuterPackaging(...args); },
    completeOuterPackaging: function(...args) { return packageService.completeOuterPackaging(...args); },
    
    // Process7 포장 작업 설정
    setupInnerPackagingWork: function(...args) { return packageService.setupInnerPackagingWork(...args); },
    
    // 디버깅 및 구조 확인
    checkDatabaseStructure: function(...args) { return packageService.checkDatabaseStructure(...args); },
    getSimpleInnerWorkNumbers: function(...args) { return packageService.getSimpleInnerWorkNumbers(...args); },
    
    // 유틸리티
    getWorkStatus: function(...args) { return packageService.getWorkStatus(...args); },
    testConnection: function(...args) { return packageService.testConnection(...args); },
    executeQuery: function(...args) { return packageService.executeQuery(...args); },
    convertBigIntToNumber: function(...args) { return packageService.convertBigIntToNumber(...args); },
    
    // 제품명/코드 변환
    getProductNameFromCode: function(...args) { return packageService.getProductNameFromCode(...args); },
    extractProductCodeFromLine: function(...args) { return packageService.extractProductCodeFromLine(...args); }
};