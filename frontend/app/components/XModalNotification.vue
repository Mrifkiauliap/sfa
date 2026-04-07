<template>
  <!-- Kita tidak perlu merender apa-apa jika tidak ada error -->
  <AlertDialog :open="isOpen" @update:open="closeModal">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="text-destructive flex items-center gap-2">
          <svg xmlns="http://www.w3.org/-2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="text-foreground/80 mt-2">
          {{ message }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="closeModal">Mengerti</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ref } from 'vue'

const isOpen = ref(false)
const title = ref('Pemberitahuan')
const message = ref('')

// Function untuk memicu modal dari komponen lain via global event eventbus atau kita gunakan useState (Nuxt composable)
// Karena global event bus sudah deprecated di Vue 3, kita buat Composable kecil di dalam sini untuk diekspor

const closeModal = () => {
  isOpen.value = false
}

// Subscribe ke state global
const notificationState = useState<{ show: boolean, title: string, message: string }>('globalNotification', () => ({ show: false, title: '', message: '' }))

watch(notificationState, (newVal) => {
  if (newVal.show) {
    title.value = newVal.title || 'Error'
    message.value = newVal.message
    isOpen.value = true
    
    // Reset state agar bisa dipicu lagi nantinya
    notificationState.value.show = false
  }
}, { deep: true })
</script>
