<template>
  <div class="space-y-8 pb-10">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">
          Riwayat Analisis Apriori
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Rekam jejak setiap kali kamu menjalankan analisis pola belanja.
        </p>
      </div>
      <NuxtLink to="/analysis/apriori">
        <Button class="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Wand2 class="w-4 h-4" />
          Analisis Baru
        </Button>
      </NuxtLink>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="h-28 rounded-2xl bg-slate-100 animate-pulse"
      ></div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="history.length === 0"
      class="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-5"
      >
        <History class="w-8 h-8 text-orange-400" />
      </div>
      <h3 class="font-bold text-slate-700 text-xl mb-2">Belum Ada Riwayat</h3>
      <p class="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
        Kamu belum pernah menjalankan analisis Apriori. Mulai analisis sekarang
        untuk menemukan pola belanjamu!
      </p>
      <NuxtLink to="/analysis/apriori">
        <Button class="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Wand2 class="w-4 h-4" /> Jalankan Analisis Pertama
        </Button>
      </NuxtLink>
    </div>

    <!-- History List -->
    <div v-else class="space-y-4">
      <div
        v-for="(item, idx) in history"
        :key="item.id"
        class="group relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 cursor-pointer"
        @click="toggleExpand(item.id)"
      >
        <!-- Top Row -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <!-- Run Number -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
              :class="
                idx === 0
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-500'
              "
            >
              {{ history.length - idx }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-slate-800">
                  Analisis #{{ history.length - idx }}
                </span>
                <span
                  v-if="idx === 0"
                  class="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide"
                  >Terbaru</span
                >
                <!-- Period Badge -->
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  :class="
                    getItemData(item).period === 'weekly'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  "
                >
                  {{
                    getItemData(item).period === "weekly"
                      ? "📅 Mingguan"
                      : "🗓️ Bulanan"
                  }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ formatDate(item.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Stats on right -->
          <div class="flex items-center gap-6 shrink-0 text-right">
            <div>
              <p class="text-xl font-extrabold text-slate-800">
                {{ getItemData(item).rules?.length ?? 0 }}
              </p>
              <p class="text-xs text-slate-500">Aturan</p>
            </div>
            <div>
              <p class="text-xl font-extrabold text-emerald-600">
                {{ getItemData(item).totalBaskets ?? 0 }}
              </p>
              <p class="text-xs text-slate-500">Basket</p>
            </div>
            <div>
              <p class="text-lg font-bold text-slate-700">
                {{ getItemData(item).minSupport ?? "-" }}%
              </p>
              <p class="text-xs text-slate-500">Support Min</p>
            </div>
            <ChevronDown
              class="w-5 h-5 text-slate-400 transition-transform duration-300"
              :class="{ 'rotate-180': expandedId === item.id }"
            />
          </div>
        </div>

        <!-- Expanded Rules List -->
        <Transition name="slide-fade">
          <div
            v-if="expandedId === item.id && getItemData(item).rules?.length"
            class="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div
              v-for="(rule, rIdx) in getItemData(item).rules"
              :key="rIdx"
              class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="font-semibold text-slate-800">{{
                    rule.antecedent
                      .replace("Kategori: ", "")
                      .replace("Tempat: ", "")
                  }}</span>
                  <span class="mx-1.5 text-slate-400">→</span>
                  <span class="font-semibold text-indigo-700">{{
                    rule.consequent
                      .replace("Kategori: ", "")
                      .replace("Tempat: ", "")
                  }}</span>
                </div>
              </div>
              <div class="flex gap-3 text-xs">
                <span
                  class="bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full"
                  >Confidence: {{ rule.confidence }}%</span
                >
                <span
                  class="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full"
                  >Support: {{ rule.support }}%</span
                >
              </div>
            </div>
          </div>
        </Transition>

        <!-- No rules message -->
        <Transition name="slide-fade">
          <div
            v-if="expandedId === item.id && !getItemData(item).rules?.length"
            class="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-400 italic"
          >
            Analisis ini tidak menghasilkan aturan yang memenuhi threshold.
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, History, Wand2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useApi } from "~/services/api";

definePageMeta({ middleware: "auth" });

const api = useApi();

const history = ref<any[]>([]);
const isLoading = ref(true);
const expandedId = ref<string | null>(null);

const getItemData = (item: any) => {
  return (item.data as any) ?? {};
};

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

onMounted(async () => {
  try {
    const res = await api("/analysis/history", { method: "GET" });
    history.value = res?.data ?? [];
  } catch (err) {
    history.value = [];
  } finally {
    isLoading.value = false;
    // Auto-expand item terbaru
    if (history.value.length > 0) {
      expandedId.value = history.value[0].id;
    }
  }
});
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
