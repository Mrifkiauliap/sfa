<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5 relative group p-4 flex gap-4"
        >
          <!-- Indikator warna di tepi kiri -->
          <div
            class="absolute top-0 bottom-0 left-0 w-1.5"
            :class="{
              'bg-emerald-500': toast.type === 'success',
              'bg-rose-500': toast.type === 'error',
              'bg-amber-500': toast.type === 'warning',
              'bg-blue-500': toast.type === 'info',
            }"
          ></div>

          <!-- Icon Tipe (Diletakkan manual karena Icon komponen bukan bawaan global di sini) -->
          <div class="flex-shrink-0 flex items-start pl-2">
            <!-- SUCCESS -->
            <svg
              v-if="toast.type === 'success'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>

            <!-- ERROR ❌ -->
            <svg
              v-if="toast.type === 'error'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>

            <!-- WARNING -->
            <svg
              v-if="toast.type === 'warning'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
              ></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>

            <!-- INFO ℹ️ -->
            <svg
              v-if="toast.type === 'info'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>

          <!-- Konten Text -->
          <div class="flex-1 w-0">
            <h3 class="text-sm font-bold text-slate-800">{{ toast.title }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ toast.message }}</p>
          </div>

          <!-- Tombol Close (X) -->
          <button
            @click="removeToast(toast.id)"
            class="flex-shrink-0 ml-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotification } from "~/utils/notify";

// Notifikasi terhubung terpusat secara langsung! (Reaktif, tidak butuh watcher kaku lagi)
const { toasts, removeToast } = useNotification();
</script>

<style scoped>
/* Memodifikasi pergerakan Group Element Toast Vue */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.9);
}
/* Memastikan list tetap lancar pas ada komponen dicopot */
.toast-leave-active {
  position: absolute;
}
</style>
