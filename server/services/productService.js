const mariadb = require("../database/mapper.js");
const { convertObjToAry } = require('../utils/converts.js') 

const findAll = async() => {
  let list = await mariadb.query("selectProductList")
                          .catch(err => console.log(err));
  return list;
}

const addProduct = async(ProductInfo) => {
  let insertColums = ['product_code', 'product_name', 'product_pay', 'product_atc', 'product_gred', 'product_unit', 'product_stand', 'product_perdt', 'product_safty','product_img', 'product_packge'];
  let data = convertObjToAry(ProductInfo, insertColums);

  let resInfo = await mariadb.query("productInsert", data)
  .catch(err => {
    console.error(err);
    return null; // 또는 throw err;
  });

  if (!resInfo) {
    return {
      isSuccessed: false,
      message: 'DB insert 실패',
    };
}
  let result = null;
  if(resInfo.affectedRows > 0){
    result = {
      isSuccessed:true,
      productCode:resInfo.affectedRows,
    }
  }else{
    result = {
      isSuccessed:false,
    }
  }
  return result;
}

const updateProductInfo = async(productCode, ProductInfo) => {
  const updateColumns = [
    'product_name', 'product_pay', 'product_atc', 'product_gred',
    'product_unit', 'product_stand', 'product_perdt', 'product_safty', 'product_img', 'product_packge'
  ];

  const values = convertObjToAry(ProductInfo, updateColumns);
  const data = [...values, productCode]; // WHERE 조건 맨 뒤에

  let resInfo = await mariadb.query("productUpdate", data)
  .catch(err => {
    console.error(err);
    return null; // 또는 throw err;
  });

  let result = null;
  if (resInfo?.affectedRows > 0) {
    ProductInfo.product_code = productCode;
    result = {
      isUpdated: true,
      ProductInfo,
    };
  } else {
    result = {
      isUpdated: false,
    };
  }
  return result;
}

const removeProductInfo = async(productCode) => {
  let result = await mariadb.query("productDelete", productCode)
                            .catch(err => console.log(err));
  return {
    isDeleted: Number(result?.affectedRows) > 0 // BigInt → Number
  };
}



module.exports = {
  findAll,
  addProduct,
  updateProductInfo,
  removeProductInfo
};
