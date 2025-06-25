const product =require('./sqls/product.js');
const material =require('./sqls/material.js');
const equipment = require('./sqls/equipment.js')
const equipmentInspection = require('./sqls/equipmentInspection.js')
const commonCode = require('./sqls/commonCode.js');
const order = require('./sqls/order.js');
const inspection = require('./sqls/inspection.js');
const processFlowChart = require('./sqls/processFlowChart.js');
const line = require('./sqls/line.js');
const bom = require('./sqls/bom.js');
const package =  require('./sqls/package.js');
const account = require('./sqls/account.js');
const defect = require('./sqls/defect.js');
const materialLot = require('./sqls/materialLot.js');
const workOrder = require('./sqls/workOrder.js');
const mrp = require('./sqls/mrps.js');
const purchaseOrder = require('./sqls/purchase.js');
const prodPlan = require('./sqls/prodPlan.js');
const delivery = require('./sqls/delivery.js');
const prodResult = require('./sqls/prod_result.js');
const auth = require('./sqls/auth.js');
const materialInspection = require('./sqls/materialInspection.js');
const quality = require('./sqls/Quality.js');
const productInbound = require('./sqls/productInbound.js');
const dashboard = require('./sqls/dashboard.js');
const productOutbound = require('./sqls/productOutbound.js');
const employee = require('./sqls/employee.js');
const equipmentHistory = require('./sqls/equipmentHistory.js');
const faulty = require('./sqls/faultyInsert.js');
const faultyDisuse = require('./sqls/faultyDisuse.js');
const qualityInsertList = require('./sqls/qualityInsertList.js');



 module.exports ={
    // 펼침연산자(spread operator, ...)을 활용해 객체의 필드를 다른 객체로 쉽게 복사
     ...product, 
     ...material,
     ...equipment,
     ...equipmentInspection,
     ...commonCode,
     ...order,
     ...bom,
     ...processFlowChart,
     ...line,
     ...inspection,
     ...package,
     ...account,
     ...defect,
     ...materialLot,
     ...workOrder,
     ...mrp,
     ...purchaseOrder,
     ...prodPlan,
     ...delivery,
     ...prodResult,
     ...auth,
     ...materialInspection,
     ...quality,
     ...productInbound,
     ...dashboard,
     ...productOutbound,
     ...employee,
     ...equipmentHistory,
     ...faulty,
     ...faultyDisuse,
     ...qualityInsertList
 }

