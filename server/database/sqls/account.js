// 거래처 전체 조회
const getAccountList =
    `SELECT   account_id,
              account_name,
              account_type,
              business_no,
              phone,
              address,
              charger_name,
              trade_status_yn,
              reg_date,
              upd_date
    FROM      account
    ORDER BY  account_id`
    ;

// 등록
const accountInsert =
    `INSERT INTO account (account_name,
                          account_type,
                          business_no,
                          phone,
                          address,
                          charger_name,
                          trade_status_yn,
                          reg_date,
                          upd_date )
    VALUES(?,?,?,?,?,?,?,?,?)`
    ;

// 거래처id로 단일 조회
const getAccountById = `
    SELECT account_id,
           account_name,
           account_type,
           business_no,
           phone,
           address,
           charger_name,
           trade_status_yn,
           reg_date,
           upd_date
      FROM account
     WHERE account_id = ?
`;

// 거래처 수정
const accountUpdate = `
    UPDATE account SET
      account_name = ?,
      account_type = ?,
      business_no = ?,
      phone = ?,
      address = ?,
      charger_name = ?,
      trade_status_yn = ?,
      upd_date = ?
    WHERE account_id = ?
`;

// 거래처 삭제
const accountDelete = `
    DELETE FROM account WHERE account_id = ?
`;

// 내보내기
module.exports = {
  getAccountList,
  getAccountById,
  accountInsert,
  accountUpdate,
  accountDelete,
  // getAccountListWithUsage,
};