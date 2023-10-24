<template>
<div id="field">
  <Ball :coords="ball" />
  <Player :coords="{ x: 10, y: 0 }" />
  <Player :coords="{ x: 780, y: 0 }" />
</div>
</template>

<script setup lang="ts">
// import { watch } from 'vue';
import { useGameData } from './composables/useGameData';
import Ball from './components/BallComponent.vue';
import Player from './components/PlayerComponent.vue';

const { ball } = useGameData();
</script>

<style lang="scss">
@import './style/vars.scss';

#field {
  width: 800px;
  height: 500px;
  border: $size solid $color;
  position: relative;
}
</style>
