export interface INavigationRoute {
  name: string
  displayName: string
  meta: { icon: string }
  children?: INavigationRoute[]
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    {
      name: 'standardInformation',
      displayName: 'menu.기준정보',
      meta: {
        icon: 'settings',
      },
      children: [
        {
          name: 'product-management',
          displayName: 'menu.제품 관리',
        },
        {
          name: 'material-management',
          displayName: 'menu.자재 관리',
        },
        {
          name: 'process-flow-chart-management',
          displayName: 'menu.공정흐름도 관리',
        },
        {
          name: 'equipment-register',
          displayName: 'menu.설비 등록',
        },
        {
          name: 'account-management',
          displayName: 'menu.거래처 관리',
        },
        // {
        //   name: 'staff-management',
        //   displayName: 'menu.사원 관리',
        // },
        {
          name: 'bom-manager',
          displayName: 'menu.BOM 관리',
        },
        {
          name: 'InspectionManagement',
          displayName: 'menu.검사항목 관리',
        },
        {
          name: 'defectManagement',
          displayName: 'menu.불량유형 관리',
        },
      ],
    },
    {
      name: 'business',
      displayName: 'menu.영업',
      meta: {
        icon: 'group',
      },
      children: [
        {
          name: 'order-list',
          displayName: 'menu.주문 조회',
        },
        {
          name: 'order-management',
          displayName: 'menu.주문 관리',
        },
      ],
    },
       {
    name: 'facility',
    displayName: 'menu.설비',
    meta: {
      icon: 'settings',
    },
    children: [
      {
        name: 'equipment-inquiry',
        displayName: 'menu.설비 조회',
        meta: {
          icon: 'search',
        },
      },
      {
        name: 'equipment-management', 
        displayName: 'menu.설비 관리',
        meta: {
          icon: 'build',
          },
        },
        {
        name: 'equipment-inspection', 
        displayName: 'menu.설비 점검',
        meta: {
        icon: 'build',
        },
      },
      ],
    },
    {
      name: 'material',
      displayName: 'menu.자재',
      meta: {
        icon: 'credit_card'
      },
      children: [
        {
          name: 'receiving-management',
          displayName: 'menu.입고 관리'
        },
        {
          name: 'receiving-check',
          displayName: 'menu.입고 조회'
        },
        {
          name: 'mrp-calculate',
          displayName: 'menu.MRP 계산'
        },
        {
          name: 'purchase-order',
          displayName: 'menu.발주 관리'
        }
      ],
    },
    {
      name: 'production',
      displayName: 'menu.생산',
      meta: {
        icon: 'login',
      },
      children: [
        {
          name: 'work_order_manager',
          displayName: 'menu.작업지시 관리',
        },
        {
          name: 'work_order_check',
          displayName: 'menu.작업지시 조회',
        },
        {
          name: 'prod_plan_manager',
          displayName: 'menu.생산계획 관리',
        },
        {
          name: 'prod_plan_check',
          displayName: 'menu.생산계획 조회',
        },
      ],
    },
    {
      name: 'packaging',                  
      displayName: 'menu.포장',
      meta: {
        icon: 'inventory_2',
      },
      children: [
        {
          name: 'package_add_line',         
          displayName: 'menu.포장 라인 등록',
        },
        {
          name: 'package_line',     
          displayName: 'menu.포장 라인 선택',
        },
        {
          name: 'package_work',   
          displayName: 'menu.포장 작업 수행',
        },
      ],
    },
    {
      name: 'quality',
      displayName: 'menu.품질',
      meta: {
        icon: 'vuestic-iconset-files',
      },
      children: [
        {
          name: 'quality-management',
          displayName: 'menu.품질관리',
        },
        {
          name: 'faulty-management',
          displayName: 'menu.불량품검사 등록',
        },
        {
          name: 'faultyDisuse-management',
          displayName: 'menu.불량품폐기 등록',
        },
      ],
    },
    {
      name: 'distribution',
      displayName: 'menu.물류',
      meta: {
        icon: 'manage_accounts',
      },
      children: [
        {
          name: 'pricing-plans',
          displayName: 'menu.pricing-plans',
        },
        {
          name: 'billing',
          displayName: 'menu.billing',
        },
      ],
    },
    
  ] as INavigationRoute[],
}