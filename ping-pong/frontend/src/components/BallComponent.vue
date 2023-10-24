<template>
    <div id="ball" :style="style"></div>
</template>

<script setup lang="ts">
import { StyleValue, computed } from 'vue';

interface Coords {
    x: number;
    y: number;
}

interface Props {
    coords: Coords; 
}

const props = defineProps<Props>();

const style = computed<StyleValue>(() => ({
    left: `${props.coords.x}px`,
    bottom: `${props.coords.y}px`,
}));
</script>

<style lang="scss">
@import "../style/vars.scss";

#ball {
  position: absolute;
  width: $size;
  height: $size;
  background: $color;
}
</style>