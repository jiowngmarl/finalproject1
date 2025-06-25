import "./scss/main.scss";

import { createApp } from "vue";
import { createPinia } from "pinia"; // 한 번만 import
import App from "./App.vue";
import i18n from "./i18n";
import { createVuestic } from "vuestic-ui";
import { createGtm } from "@gtm-support/vue-gtm";

import stores from "./stores";
import router from "./router";
import vuesticGlobalConfig from "./services/vuestic-ui/global-config";

import piniaPersist from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPersist);

const app = createApp(App);

app.use(pinia);
app.use(stores);
app.use(router);
app.use(i18n);

app.use(createVuestic({ config: vuesticGlobalConfig }));

if (import.meta.env.VITE_APP_GTM_ENABLED) {
  app.use(
    createGtm({
      id: import.meta.env.VITE_APP_GTM_KEY,
      debug: false,
      vueRouter: router,
    }),
  );
}

app.mount("#app");
