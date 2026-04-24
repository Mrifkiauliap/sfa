<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
      @click="close"
    />

    <!-- Modal Content -->
    <div
      class="relative w-full max-w-md overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      @click.stop
    >
      <!-- Header / Image Area -->
      <div
        class="relative bg-primary/5 px-6 py-8 text-center border-b border-primary/10"
      >
        <!-- Close Button -->
        <button
          @click="close"
          class="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-primary"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground mb-1">
          Rp {{ trx?.amount?.toLocaleString("id-ID") || 0 }}
        </h2>
        <p class="text-sm font-medium text-muted-foreground">
          {{ trx?.merchant?.name || trx?.category?.name || "Transaksi" }}
        </p>
      </div>

      <!-- Details List -->
      <div class="p-6 space-y-4">
        <div
          class="flex justify-between items-center pb-3 border-b border-border/50"
        >
          <span class="text-sm text-muted-foreground">Tanggal</span>
          <span class="text-sm font-medium">{{ formatDate(trx?.date) }}</span>
        </div>

        <div
          class="flex justify-between items-center pb-3 border-b border-border/50"
        >
          <span class="text-sm text-muted-foreground">Kategori</span>
          <span class="text-sm font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            {{ trx?.category?.name || "-" }}
          </span>
        </div>

        <div
          class="flex justify-between items-center pb-3 border-b border-border/50"
        >
          <span class="text-sm text-muted-foreground">Metode Pembayaran</span>
          <span class="text-sm font-medium">{{
            trx?.paymentMethod?.name || "-"
          }}</span>
        </div>

        <div class="pt-2">
          <span class="text-xs text-muted-foreground block mb-1.5"
            >Deskripsi / Catatan</span
          >
          <p
            class="text-sm bg-muted/30 p-3 rounded-lg border border-border/50 leading-relaxed min-h-[60px]"
          >
            {{ trx?.description || "Tidak ada catatan untuk transaksi ini." }}
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="bg-muted/30 px-6 py-4 flex gap-3">
        <button
          class="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          @click="close"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const isOpen = ref(false);
const trx = ref<any>(null);

const open = (transactionData: any) => {
  trx.value = transactionData;
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  setTimeout(() => {
    trx.value = null;
  }, 200);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

defineExpose({ open, close });
</script>
