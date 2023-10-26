<template>
    <div
        v-if="message"
        id="message"
    >
        {{ message }}
    </div>
</template>

<script setup lang="ts">
interface Props {
    message: string | null; 
}

defineProps<Props>();
</script>

<style lang="scss">
@use 'sass:math';
@import "../style/vars.scss";

#message {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: math.div($field-height, 2) - $size * 2;
  left: math.div($field-width, 2) - $size * 15;
  width: $size * 30;
  height: $size * 4;
  background: $color;
  color: $bg;
}
</style>