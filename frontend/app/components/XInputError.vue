<template>
  <p v-if="message" class="text-[13px] font-medium text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1">
    {{ message }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
}>();
</script>
