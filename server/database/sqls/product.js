 // Table : t_book_01
 // 각 변수별로 SQL문을 등록할 떄 백틱(``)을 사용하는 이유는 줄바꿈 허용을 허용하기 떄문.
 // ( 따옴표는 줄을 바꿀 경우 값이 깨지면서 에러발생 )
 // 조건없이 전체조회
const selectProductList =
 `SELECT   product_code,
           product_name,
           product_pay,
           product_atc,
           product_gred,
           product_stand,
           product_perdt,
           product_unit,
           product_safty,
           product_packge
  FROM     product
  ORDER BY product_code`
  ;
 // 등록
const productInsert = 
`INSERT INTO product (product_code,
                      product_name,
                      product_pay,
                      product_atc,
                      product_gred,
                      product_unit,
                      product_stand,
                      product_perdt,
                      product_safty,
                      product_img,
                      product_packge)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
;
const productUpdate = `
  UPDATE product 
  SET 
    product_name = ?,product_pay = ?,product_atc = ?,
    product_gred = ?,product_unit = ?, product_stand = ?,
    product_perdt = ?,product_safty = ?,product_img = ?,
    product_packge = ? 
  WHERE product_code = ?
`;
 const productDelete = 
 `DELETE FROM product
  WHERE product_code = ?`
 ;
 //bom 제품선택 all
 const selectAllProducts = `
  SELECT product_code, product_name, product_unit, product_stand
    FROM product
   ORDER BY product_name
`;
//bom 제품선택
const selectProductByCode = `
  SELECT * FROM product WHERE product_code = ?
`;

 module.exports ={
    selectProductList,
    productInsert,
    productUpdate,
    productDelete,
    selectAllProducts,
    selectProductByCode
 }