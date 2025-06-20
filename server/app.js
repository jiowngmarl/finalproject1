// env 파일을 읽어들이는 코드 => 가능한 가장 첫번쨰 줄에 작성
require("dotenv").config({ path: "./database/configs/dbConfig.env" });
const express = require("express");
const app = express();
const path = require('path');
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }
  next();

});


// 미들웨어 등록 영역
// 1. body parser
// 라우팅 등록 영역

 // content-type : application/x-www-form-urlencoded
app.use(express.urlencoded({ extended:false}));
 // content-type : application/json
app.use(express.json()); 
// Server 실행 
app.listen(3000, ()=>{
  console.log('Server Start');
  console.log('http://localhost:3000');
})


 // 라우팅 등록 영역   

const orderRouter = require('./routers/orderRouter.js');

const productRouter =require('./routers/productRouter.js');

const commonCodeRouter = require('./routers/commonCodeRouter');

const equipmentRouter = require('./routers/equipmentRouter');

const equipmentInspectionRouter = require('./routers/equipmentInspectionRouter');

const materialRouter =require('./routers/materialRouter.js');

const processRouter =require('./routers/processRouter.js');

const bomRouter = require('./routers/bomRouter');

const lineRouter = require('./routers/lineRouter.js')

const inspectionRouter = require('./routers/inspectionRouter.js');

const packageRouter = require('./routers/packageRouter.js');

const accountRouter = require('./routers/accountRouter.js');

const defectRouter = require('./routers/defectRouter.js');

const materialLotRouter = require('./routers/materialLotRouter.js');

const workOrderRouter = require('./routers/workOrderRouter.js');

const mrpRouter = require('./routers/mrpsRouter.js');

const purchaseRouter = require('./routers/purchaseRouter.js');


const prodPlanRouter = require('./routers/prodPlanRouter.js');

const deliveryRouter = require('./routers/deliveryRouter.js');

const materialInspectionRouter = require('./routers/materialInspectionRouter.js');

const prodResultRouter = require('./routers/prodResultRouter.js');

const employeeRouter = require('./routers/employeeRouter.js');

const authRouter =  require('./routers/authRouter.js');

const qualityRouter = require('./routers/qualityRouter.js');

const productInboundRouter = require('./routers/productInboundRouter.js');

const dashboardRouter = require('./routers/dashboardRouter.js');

const productOutboundRouter = require('./routers/productOutboundRouter.js');

const equipmentHistoryRouter = require('./routers/equipmentHistoryRouter.js');

 // 기본 라우팅
app.get('/', (req, res)=>{
  res.send('Welcome!!...');
 })




 // 라우터 모듈 등록

 //홍인
app.use('/', orderRouter);
app.use('/', accountRouter);
app.use('/', employeeRouter);

//다산
app.use('/bom', bomRouter);
app.use('/workOrder', workOrderRouter);
app.use('/prodPlan', prodPlanRouter);
app.use('/productInbound', productInboundRouter);
app.use('/productOutbound', productOutboundRouter);

 //승민
app.use('/', productRouter);
app.use('/', materialRouter);
app.use('/', processRouter);
app.use('/', materialLotRouter);
app.use('/', mrpRouter);
app.use('/', purchaseRouter);
app.use('/', deliveryRouter);
app.use('/', prodResultRouter);



//열림
app.use('/equipments', equipmentRouter);
app.use('/common-codes', commonCodeRouter);
app.use('/img', express.static('../client/public/img'));
app.use('/uploads', express.static('./uploads'));
app.use('/equipment-inspection', equipmentInspectionRouter);
app.use('/equipment-history', equipmentHistoryRouter);

//현석
app.use('/lines', lineRouter);
app.use('/packages', packageRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);

//현기
app.use('/inspections', inspectionRouter);
app.use('/materialInspections', materialInspectionRouter);
app.use('/defects', defectRouter);
app.use('/qualitys', qualityRouter);

app.get("/", function (req, res, next) {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});


app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./public", "index.html"));
});