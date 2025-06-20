<template>
  <svg
    :height="height"
    viewBox="0 0 555 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="250"
      y="95"
      :fill="colorsComputed.start"
      font-size="100"
      font-weight="bold"
      font-family="Arial, sans-serif"
    >
      PILLS
    </text>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useColors } from "vuestic-ui";

const { getColor } = useColors();

const props = withDefaults(
  defineProps<{
    height?: number;
    start?: string;
    end?: string;
  }>(),
  {
    height: 18,
    start: "primary",
    end: undefined,
  },
);

const colorsComputed = computed(() => {
  return {
    start: getColor(props.start),
    end: getColor(props.end || props.start),
  };
});
</script>
