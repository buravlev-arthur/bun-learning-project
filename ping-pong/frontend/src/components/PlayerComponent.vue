<template>
    <div class="player" :style="style"></div>
</template>

<script setup lang="ts">
import { StyleValue, computed, ref, onMounted } from 'vue';

interface Props {
    racketY: number;
    side: 'left' | 'right';
}

const props = defineProps<Props>();

const racketX = ref<number>(0); 

const style = computed<StyleValue>(() => ({
    left: `${racketX.value}px`,
    bottom: `${props.racketY}px`,
}));

onMounted(() => {
    const leftPlayerPos = 40;
    const rightPlayerPos = 750;
    racketX.value = props.side === 'left'
        ? leftPlayerPos
        : rightPlayerPos;
});
</script>

<style lang="scss">
@import "../style/vars.scss";

.player {
  position: absolute;
  width: $size;
  height: $player-size;
  background: $color;
}
</style>