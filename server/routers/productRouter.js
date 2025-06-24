const express =require('express');
const multer = require('multer');
const path = require('path');
 // Express의 Router 모듈을 사용해서 라우팅 등록, 라우팅을 별도 파일로 관리
const router =express.Router();
 // 해당 라우터를 통해 제공할 서비스를 가져옴
const productService =require('../services/productService.js');
 // 라우팅  = 사용자의 요청(URL+METHOD) + Service + 응답형태(View or Data)

 router.get('/product', async(req, res)=>{
  let productList = await productService.findAll()
                                        .catch(err => console.log(err));
  res.send(productList);
 });

// 이미지 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../server/public/img/product');
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// 🔄 이미지 + 제품정보 등록 (멀티 파트 요청)
router.post('/product', upload.single('image'), async (req, res) => {
  try {
    const ProductInfo = req.body;

    // 이미지 파일이 존재하면 파일명 저장
    if (req.file) {
      ProductInfo.product_img = req.file.filename;
    }

    const result = await productService.addProduct(ProductInfo);
    res.send(result);
  } catch (err) {
    console.error('❌ 제품 등록 실패:', err);
    res.status(500).send({ isSuccessed: false, message: '서버 오류' });
  }
});

router.put('/product/:product_code', upload.single('image'), async (req, res) => {
  try {
    const productCode = req.params.product_code;
    const ProductInfo = req.body;

    // 새 이미지가 업로드됐다면 반영
    if (req.file) {
      ProductInfo.product_img = req.file.filename;
    }

    const result = await productService.updateProductInfo(productCode, ProductInfo);
    res.send(result);
  } catch (err) {
    console.error('❌ 수정 중 오류:', err);
    res.status(500).send({ isUpdated: false, message: '서버 오류' });
  }
});

// 삭제    : 자원(데이터) -> product / 삭제 -> DELETE
 router.delete('/product/:product_code', async(req, res)=>{
    let productCode =req.params.product_code;
    let resInfo =await productService.removeProductInfo(productCode)
                                     .catch(err =>console.log(err));
    res.send(resInfo);
 })

  
// 실제 라우팅 등록 영역
// 해당 javascript 파일의 마지막 코드, 모듈화
// 위에 선언한 기능(변수, 함수 등)들 중 외부로 노출할 대상을 설정 
// => 다른 파일에서 require()을 통해 가져옴
module.exports =router
