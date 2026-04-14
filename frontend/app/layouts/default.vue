<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppSidebar from "~/components/layout/AppSidebar.vue";

const route = useRoute();

// Simple title formatter for headers (optional)
const pageTitle = computed(() => {
  if (route.path === "/") return "Dashboard";
  const parts = route.path.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];
  if (!lastPart) return "Dashboard";
  return lastPart.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
});
</script>

<template>
  <div
    class="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900"
  >
    <!-- Komponen Sidebar yang di-import -->
    <AppSidebar />

    <!-- Area Konten Utama -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Navbar Sederhana (Opsional, tapi bagus untuk UX) -->
      <header
        class="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0 shadow-sm z-10"
      >
        <div>
          <h1 class="text-xl font-bold tracking-tight text-slate-800">
            {{ pageTitle }}
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Student Finance & Knowledge Graph Analyzer
          </p>
        </div>
      </header>

      <!-- Wadah dinamis untuk semua halaman-halaman (NuxtPage) -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-8">
        <div class="mx-auto max-w-7xl">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
