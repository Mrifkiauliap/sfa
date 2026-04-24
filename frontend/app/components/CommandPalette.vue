<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] sm:pt-[20vh]"
  >
    <!-- Backdrop Blur -->
    <div
      class="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
      @click="close"
    />

    <!-- Command Palette Modal -->
    <div
      class="relative w-full max-w-2xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      @click.stop
    >
      <div class="flex items-center border-b px-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mr-2 opacity-50 shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref="searchInput"
          v-model="searchQuery"
          class="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
          placeholder="Cari transaksi... (Cth: mie ayam gopay hari ini)"
          @keydown.esc="close"
        />
        <div
          v-if="isLoading"
          class="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>

      <div class="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
        <!-- Empty State -->
        <div
          v-if="!isLoading && searchQuery.length > 0 && results.length === 0"
          class="py-14 text-center text-sm sm:px-14"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-auto mb-4 text-muted-foreground/50"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <p class="font-semibold text-foreground">
            Tidak ada transaksi ditemukan.
          </p>
          <p class="text-muted-foreground mt-1">
            Kami tidak dapat menemukan apa pun untuk "{{ searchQuery }}".
          </p>
        </div>

        <!-- Result Insights (Always show if exists) -->
        <div
          v-if="meta.suggestion"
          class="m-2 p-3 rounded-lg bg-primary/10 text-primary-foreground border border-primary/20 animate-in slide-in-from-bottom-2 fade-in"
        >
          <div class="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 text-primary mt-0.5"
            >
              <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div class="text-left">
              <p class="text-xs font-medium text-primary">Insight AI</p>
              <p class="text-xs text-primary/80 mt-0.5">
                {{ meta.suggestion }}
              </p>
            </div>
          </div>
        </div>

        <!-- Start Typing Prompt -->
        <div
          v-if="searchQuery.length === 0"
          class="py-10 text-center text-sm text-muted-foreground"
        >
          Ketik untuk memulai Semantic Search dengan Apache Fuseki...
        </div>

        <!-- Results -->
        <div v-else-if="results.length > 0">
          <div
            class="px-2 py-1.5 text-xs font-medium text-muted-foreground flex justify-between"
          >
            <span>Transaksi</span>
            <span
              v-if="meta.searchSource"
              class="flex items-center gap-1 text-primary/70"
            >
              <svg
                v-if="meta.searchSource.includes('SPARQL')"
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"
                />
                <path
                  d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              Powered by {{ meta.searchSource }}
            </span>
          </div>

          <div
            v-for="trx in results"
            :key="trx.id"
            class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 border-b border-border/50 last:border-0"
            @click="selectResult(trx)"
          >
            <div
              class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-primary"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <div class="flex-1 space-y-1">
              <p class="font-medium leading-none">
                {{ trx.merchant?.name || trx.category?.name || "Transaksi" }}
              </p>
              <p class="text-xs text-muted-foreground line-clamp-1">
                {{ trx.description || "-" }} •
                {{ new Date(trx.date).toLocaleDateString("id-ID") }}
              </p>
            </div>
            <div class="text-right ml-4">
              <p
                class="font-semibold"
                :class="trx.amount > 0 ? 'text-destructive' : 'text-primary'"
              >
                Rp {{ trx.amount.toLocaleString("id-ID") }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ trx.paymentMethod?.name || "-" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal Component -->
    <TransactionDetailModal ref="detailModal" />
  </div>
</template>

<script setup lang="ts">
import { useApi } from "~/services/api";
import { useAuthStore } from "~/stores/auth";

const isOpen = ref(false);
const searchQuery = ref("");
const isLoading = ref(false);
const results = ref<any[]>([]);
const meta = ref<any>({});
const searchInput = ref<HTMLInputElement | null>(null);
const detailModal = ref<any>(null);
let debounceTimer: any = null;

const api = useApi();
const authStore = useAuthStore();

// Buka/Tutup Palette dengan shortcut (CTRL+K / CMD+K)
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    if (!isOpen.value) {
      open();
    } else {
      close();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

const open = () => {
  // Hanya buka jika user sudah login
  if (!authStore.user?.id) return;

  isOpen.value = true;
  searchQuery.value = "";
  results.value = [];
  meta.value = {};
  setTimeout(() => searchInput.value?.focus(), 50);
};

const close = () => {
  isOpen.value = false;
};

// Watcher untuk live search dengan debounce
watch(searchQuery, (newVal) => {
  if (!newVal.trim()) {
    results.value = [];
    meta.value = {};
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await performSearch(newVal);
  }, 400); // Delay 400ms biar nggak spam API
});

const performSearch = async (keyword: string) => {
  if (!authStore.user?.id) return;
  isLoading.value = true;
  try {
    const res = await api("/transaction/search", {
      method: "GET",
      query: {
        q: keyword,
        userId: authStore.user.id,
        limit: 10,
      },
    });
    // Di ofetch, respons JSON langsung menjadi objek utuh
    results.value = res.data || [];
    meta.value = res.meta || {};
  } catch (error) {
    console.error("Failed to search transactions:", error);
  } finally {
    isLoading.value = false;
  }
};

const selectResult = (trx: any) => {
  // Buka detail modal, bukan navigate!
  if (detailModal.value) {
    detailModal.value.open(trx);
  }
};

// Supaya komponen induk bisa memanggil open/close secara manual
defineExpose({ open, close });
</script>
