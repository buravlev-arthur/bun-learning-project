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
@import "../style/vars.scss";

#message {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: $field-height / 2 - $size * 2;
  left: $field-width / 2 - $size * 15;
  width: $size * 30;
  height: $size * 4;
  background: $color;
  color: $bg;
}
</style>