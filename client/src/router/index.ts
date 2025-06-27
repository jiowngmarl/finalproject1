import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

import AuthLayout from "../layouts/AuthLayout.vue";
import AppLayout from "../layouts/AppLayout.vue";

import RouteViewComponent from "../layouts/RouterBypass.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "dashboard" },
  },
  {
  path: '/auth',
  component: AuthLayout,
  children: [
    {
      path: 'login',
      name: 'login',
      component: () => import('../pages/auth/Login.vue'),
    },
  ],
},

  {
    name: "admin",
    path: "/",
    component: AppLayout,
    redirect: { name: "dashboard" },
    children: [
      {
        name: "dashboard",
        path: "dashboard",
        component: () => import("../pages/admin/dashboard/Dashboard.vue"),
      },
      {
        name: "business",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          {
            name: "order-list",
            path: "order-list",
            component: () => import("../pages/admin/order/OrderListPage.vue"),
          },
          {
            name: "order-management",
            path: "order-management",
            component: () => import("../pages/admin/order/OrderManagePage.vue"),
          },
        ],
      },
      {
        name: "facility",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          {
            name: "equipment-inquiry",
            path: "equipment-inquiry",
            component: () => import("../pages/equipment/EquipmentInquiry.vue"),
          },
          {
            name: "equipment-register",
            path: "/faq",
            component: () => import("../pages/equipment/EquipmentForm.vue"),
          },
          {
            name: "equipment-management",
            path: "equipment-management",
            component: () =>
              import("../pages/equipment/EquipmentManagement.vue"),
          },
          {
            name: "equipment-inspection",
            path: "equipment-inspection",
            component: () =>
              import("../pages/equipment/EquipmentInspection.vue"),
          },
          {
            name: "equipment-cleaning",
            path: "equipment-cleaning",
            component: () => import("../pages/equipment/EquipmentCleaning.vue"),
          },
          {
            name: "equipment-stop",
            path: "equipment-stop",
            component: () => import("../pages/equipment/EquipmentStop.vue"),
          },
          {
            name: "equipment-history",
            path: "equipment-history",
            component: () => import("../pages/equipment/EquipmentHistory.vue"),
          },
          {
            path: "/equipments/:id",
            name: "equipment-detail",
            component: () => import("../pages/equipment/EquipmentDetail.vue"),
          },
        ],
      },
      {
        name: "material",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          {
            name: "material-check",
            path: "material-check",
            component: () => import("../pages/material/materialCheckPage.vue"),
          },
          {
            name: "receiving-management",
            path: "receiving-management",
            component: () =>
              import("../pages/material/receivingManagementPage.vue"),
          },
          {
            name: "receiving-check",
            path: "receiving-check",
            component: () => import("../pages/material/LotCheckPage.vue"),
          },
          {
            name: "mrp-calculate",
            path: "mrp-calculate",
            component: () => import("../pages/material/mrpCalculatePage.vue"),
          },
          {
            name: "purchase-order",
            path: "purchase-order",
            component: () => import("../pages/material/purchaseOrderPage.vue"),
          },
          {
            name: "purchase-check",
            path: "purchase-check",
            component: () => import("../pages/material/purchaseCheckPage.vue"),
          },
          {
            name: "delivery-management",
            path: "delivery-management",
            component: () =>
              import("../pages/material/deliveryManagementPage.vue"),
          },
          {
            name: "delivery-check",
            path: "delivery-check",
            component: () => import("../pages/material/deliveryCheckPage.vue"),
          },
        ],
      },
      {
        name: "production",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          {
            name: "work_order_manager",
            path: "work_order_manager",
            component: () => import("../pages/workorder/WorkOrderManager.vue"),
          },
          {
            name: "work_order_check",
            path: "work_order_check",
            component: () => import("../pages/workorder/WorkOrderCheck.vue"),
          },
          {
            name: "prod_plan_manager",
            path: "prod_plan_manager",
            component: () => import("../pages/prodPlan/ProdPlanManager.vue"),
          },
          {
            name: "prod_plan_check",
            path: "prod_plan_check",
            component: () => import("../pages/prodPlan/ProdPlanCheck.vue"),
          },
          {
            name: "work_result_manager",
            path: "work_result_manager",
            component: () =>
              import("../pages/prodResult/resultManagerPage.vue"),
          },
          {
            name: "work_result_check",
            path: "work_result_check",
            component: () => import("../pages/prodResult/resultCheckPage.vue"),
          },
        ],
      },
      {
        name: "packaging",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          {
            name: "package_add_line",
            path: "package_add_line",
            component: () => import("../pages/package/PackageAddLine.vue"),
          },
          {
            name: "package_line",
            path: "package_line",
            component: () => import("../pages/package/PackageLine.vue"),
          },
          {
            name: "package_work",
            path: "package_work",
            component: () => import("../pages/package/PackageWork.vue"),
          },
        ],
      },
      {
        name: "quality",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          { 
            name: 'quality-management',
            path: 'quality-management',
            component: () => import('../pages/quality/QualityListPage.vue'),
          },
          {
            name: "faulty-management",
            path: "faulty-management",
            component: () => import("../pages/quality/faultyInsertPage.vue"),
          },
          {
            name: "faultyDisuse-management",
            path: "faultyDisuse-management",
            component: () =>
              import("../pages/quality/faultyDisuseInsertPage.vue"),
          },
        ],
      },
      {
        name: "logistics",
        path: "logistics",
        component: RouteViewComponent,
        children: [
          {
            name: "product_inbound",
            path: "product_inbound",
            component: () => import("../pages/logistics/ProductInbound.vue"),
          },
          {
            name: "product_outbound",
            path: "product_outbound",
            component: () => import("../pages/logistics/ProductOutbound.vue"),
          },
        ],
      },
      {
        name: "standardInformation",
        path: "/faq",
        component: RouteViewComponent,
        children: [
          {
            name: "employee-management",
            path: "employee-management",
            component: () =>
              import("../pages/admin/employee/EmployeeManagePage.vue"),
          },
          {
            name: "product-management",
            path: "product-management",
            component: () => import("../pages/product/ProductPage.vue"),
          },
          {
            name: "material-management",
            path: "material-management",
            component: () => import("../pages/material/MaterialPage.vue"),
          },
          {
            name: "process-flow-chart-management",
            path: "process-flow-chart-management",
            component: () => import("../pages/process/processPage.vue"),
          },
          {
            name: "equipment-register",
            path: "equipment-register",
            component: () => import("../pages/equipment/EquipmentForm.vue"),
          },
          {
            name: "account-management",
            path: "account-management",
            component: () =>
              import("../pages/admin/account/AccountManagePage.vue"),
          },
          //이 자리에 사원 관리 넣으세요!! 홍인씨!!
          {
            name: "bom-manager",
            path: "bom-manager",
            component: () => import("../pages/bom/BomManager.vue"),
          },
          {
            name: "InspectionManagement",
            path: "InspectionManagement",
            component: () => import("../pages/quality/InspectionManager.vue"),
          },
          {
            name: "MaterialInspectionManagement",
            path: "MaterialInspectionManagement",
            component: () =>
              import("../pages/quality/MaterialInspectionManager.vue"),
          },
          {
            name: "defectManagement",
            path: "defectManagement",
            component: () => import("../pages/quality/defectManager.vue"),
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    // For some reason using documentation example doesn't scroll on page navigation.
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    } else {
      window.scrollTo(0, 0);
    }
  },
  routes,
});

export default router;

export default router