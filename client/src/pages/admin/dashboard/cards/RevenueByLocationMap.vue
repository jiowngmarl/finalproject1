<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { VaCard } from "vuestic-ui";
import type countriesGeoJSON from "../../../../data/geo.json";
import Map from "../../../../components/va-charts/chart-types/Map.vue";
import type { ChartData } from "chart.js";

const getRevenue = (countryName: string) => {
  if (
    [
      "United States of America",
      "Canada",
      "United Kingdom",
      "China",
      "Japan",
    ].includes(countryName)
  ) {
    return 10;
  }

  if (["Antarctica", "Greenland"].includes(countryName)) {
    return 0;
  }

  return Math.random() * 10;
};

const geoJson = ref<typeof countriesGeoJSON | null>(null);

onMounted(async () => {
  geoJson.value = (await import("../../../../data/geo.json")).default;
});

const data = computed<
  ChartData<"choropleth", { feature: any; value: number }[], string>
>(() => {
  if (!geoJson.value) {
    return {
      labels: [],
      datasets: [],
    };
  }

  return {
    labels: geoJson.value.features.map((d) => d.properties.name),
    datasets: [
      {
        label: "Countries",
        data: geoJson.value.features.map((d) => ({
          feature: d,
          value: getRevenue(d.properties.name),
        })),
      },
    ],
  };
});
</script>

<style lang="scss" scoped>
.va-card--flex {
  display: flex;
  flex-direction: column;
}
</style>
