<template>
<div id="field">
  <Ball
    v-if="isPlay"
    :coords="ball"
  />

  <Player
    v-if="isPlay"
    side="left"
    :racket-y="leftPlayerRacketY"
  />
  <div
    id="score-left-player"
    class="score"
  >
    {{ leftPlayerScore }}
  </div>

  <div id="sideline"></div>

  <Player
    v-if="isPlay"
    side="right"
    :racket-y="rightPlayerRacketY"
  />
  <div
    id="score-right-player"
    class="score"
  >
    {{ rightPlayerScore }}
  </div>

  <Message :message="message" />
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameData } from './composables/useGameData';
import Ball from './components/BallComponent.vue';
import Player from './components/PlayerComponent.vue';
import Message from './components/MessageComponent.vue';

const {
  ball,
  players,
  isPlay,
  message,
} = useGameData();

const leftPlayerRacketY = computed<number>(() => {
  return players.value[0]?.racketY ?? 0;
});

const rightPlayerRacketY = computed<number>(() => {
  return players.value[1]?.racketY ?? 0;
});

const leftPlayerScore = computed<number>(() => {
  return players.value[0]?.score ?? 0;
});

const rightPlayerScore = computed<number>(() => {
  return players.value[1]?.score ?? 0;
});
</script>

<style lang="scss">
@import './style/vars.scss';

#field {
  width: $field-width;
  height: $field-height;
  border: $size solid $color;
  position: relative;

  #sideline {
    position: absolute;
    top: 0px;
    left: ($field-width / 2) - ($size / 2);
    width: 0px;
    height: $field-height;
    border-left: $size / 2 dashed $color;

  }

  .score {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    font-size: $font-size * 3;
    color: $color;
    width: 40px;
    height: 40px;
    top: $size * 2;
  }

  #score-left-player {
    left: $size * 2;
  }

  #score-right-player {
    right: $size *2;
  }
}
</style>
