<template>
  <div class="space-y-8 pb-10">
    <!-- Hero / Welcome Banner -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white shadow-xl"
    >
      <div
        class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        class="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl"
      />

      <div
        class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-2">
            Selamat datang,
            <span
              v-if="isLoading"
              class="animate-pulse bg-white/20 rounded-md w-32 h-8 inline-block align-middle ml-1"
            />
            <span v-else class="text-indigo-100 font-extrabold">
              {{
                user?.fullname?.split(" ")[0] || user?.username || "Mahasiswa"
              }}! 👋
            </span>
          </h1>
          <p class="text-indigo-100/80 text-lg max-w-xl">
            Mari analisis pola pengeluaranmu &amp; temukan insight menarik dari
            Knowledge Graph &amp; Algoritma Apriori.
          </p>
        </div>
        <div class="flex gap-3">
          <NuxtLink to="/transactions">
            <Button
              class="bg-white text-indigo-600 hover:bg-slate-50 gap-2 shadow-lg"
            >
              <Plus class="w-4 h-4" />
              Catat Pengeluaran
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card 1: Budget -->
      <div
        class="group relative overflow-hidden rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ring-1 ring-slate-900/5"
        :class="
          isOverBudget
            ? 'bg-rose-50/30 border-rose-200'
            : 'bg-white border-slate-100'
        "
      >
        <div
          class="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full transition-transform duration-500 group-hover:scale-150"
          :class="isOverBudget ? 'bg-rose-100/50' : 'bg-indigo-50'"
        />
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
              :class="{ 'text-rose-600': isOverBudget }"
            >
              Uang Bulanan
            </h3>
            <div
              class="p-2.5 rounded-lg"
              :class="
                isOverBudget
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-indigo-100 text-indigo-600'
              "
            >
              <Wallet class="w-5 h-5" />
            </div>
          </div>
          <div class="text-3xl font-extrabold text-slate-800">
            <span
              v-if="isLoading"
              class="animate-pulse bg-slate-100 rounded w-24 h-8 inline-block"
            />
            <span v-else
              >Rp
              {{ user?.monthlyAllowance?.toLocaleString("id-ID") || "0" }}</span
            >
          </div>

          <div class="mt-4" v-if="user?.monthlyAllowance">
            <div
              v-if="
                dashboardSummary?.recentTransactions.length === 0 && !isLoading
              "
              class="mt-2 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center"
            >
              <p class="text-xs text-slate-500">
                Belum ada transaksi bulan ini.
              </p>
              <NuxtLink
                to="/transactions"
                class="text-xs text-indigo-600 font-semibold hover:underline mt-0.5 inline-block"
                >+ Catat sekarang</NuxtLink
              >
            </div>
            <template v-else>
              <div class="flex justify-between text-xs font-semibold mb-1">
                <span
                  :class="isOverBudget ? 'text-rose-600' : 'text-slate-500'"
                >
                  Terpakai: Rp
                  {{ currentMonthExpenses.toLocaleString("id-ID") }}
                </span>
                <span :class="isOverBudget ? 'text-rose-600' : 'text-slate-500'"
                  >{{ budgetPercentage.toFixed(0) }}%</span
                >
              </div>
              <div
                class="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner"
              >
                <div
                  class="h-2 rounded-full transition-all duration-1000 ease-out"
                  :class="
                    isOverBudget
                      ? 'bg-rose-500'
                      : budgetPercentage > 70
                        ? 'bg-orange-400'
                        : 'bg-emerald-400'
                  "
                  :style="{ width: `${budgetPercentage}%` }"
                />
              </div>
              <p
                v-if="isOverBudget"
                class="mt-3 text-xs font-bold text-rose-600 animate-pulse flex items-center gap-1.5 p-1.5 bg-rose-100/50 rounded-md"
              >
                ⚠️ Peringatan Dini: Sisa budget menipis!
              </p>
              <p
                v-else
                class="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"
              >
                <TrendingUp class="w-4 h-4" /> Masih aman terkendali
              </p>
            </template>
          </div>
          <div
            v-else-if="!isLoading"
            class="mt-3 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center"
          >
            <p class="text-xs text-slate-400">
              Belum ada uang bulanan yang diset.
            </p>
          </div>
        </div>
      </div>

      <!-- Card 2: Pengeluaran Bulan Ini vs Bulan Lalu -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ring-1 ring-slate-900/5"
      >
        <div
          class="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-purple-50 transition-transform duration-500 group-hover:scale-150"
        />
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
            >
              Bulan Ini vs Lalu
            </h3>
            <div class="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
              <BarChart2 class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl font-extrabold text-slate-800">
            <span
              v-if="isLoading"
              class="animate-pulse bg-slate-100 rounded w-32 h-8 inline-block"
            />
            <span v-else
              >Rp {{ currentMonthExpenses.toLocaleString("id-ID") }}</span
            >
          </div>
          <div v-if="!isLoading && dashboardSummary" class="mt-3 space-y-1">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-slate-500">Bulan lalu:</span>
              <span class="font-semibold text-slate-700"
                >Rp
                {{
                  (dashboardSummary.totalLastMonth ?? 0).toLocaleString("id-ID")
                }}</span
              >
            </div>
            <div class="flex items-center gap-1.5">
              <span
                class="text-xs font-bold px-2 py-0.5 rounded-full"
                :class="
                  monthDiffPositive
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                "
              >
                {{ monthDiffPositive ? "▲" : "▼" }}
                {{ Math.abs(monthDiffPercent).toFixed(0) }}%
              </span>
              <span class="text-xs text-slate-400"
                >{{ monthDiffPositive ? "lebih boros" : "lebih hemat" }} dari
                bulan lalu</span
              >
            </div>
          </div>
          <p v-else-if="!isLoading" class="mt-2 text-sm text-slate-400">
            Belum ada data.
          </p>
        </div>
      </div>

      <!-- Card 3: Rata-rata per minggu -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ring-1 ring-slate-900/5"
      >
        <div
          class="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-150"
        />
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
            >
              Rata-rata / Minggu
            </h3>
            <div class="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
              <CalendarDays class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl font-extrabold text-slate-800">
            <span
              v-if="isLoading"
              class="animate-pulse bg-slate-100 rounded w-24 h-8 inline-block"
            />
            <span v-else>Rp {{ weeklyAvg.toLocaleString("id-ID") }}</span>
          </div>
          <p class="mt-2 text-sm text-slate-500">Per minggu bulan ini</p>
          <div
            v-if="!isLoading && user?.residenceType"
            class="mt-2 flex items-center gap-1.5"
          >
            <Home class="w-3.5 h-3.5 text-slate-400" />
            <span class="text-xs text-slate-400">{{ user.residenceType }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Spending DNA Section -->
    <div
      v-if="!isLoading && dashboardSummary?.categoryBreakdown?.length > 0"
      class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
    >
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"
          >
            <Dna class="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-800">
              Spending DNA Bulan Ini
            </h2>
            <p class="text-xs text-slate-500">
              Distribusi pengeluaran per kategori
            </p>
          </div>
        </div>
        <span class="text-xs text-slate-400 font-medium"
          >Total: Rp {{ currentMonthExpenses.toLocaleString("id-ID") }}</span
        >
      </div>

      <div class="space-y-3">
        <div
          v-for="(cat, idx) in dashboardSummary.categoryBreakdown.slice(0, 6)"
          :key="idx"
          class="group"
        >
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: dnaColors[idx % dnaColors.length] }"
              />
              <span class="text-sm font-semibold text-slate-700">{{
                cat.name
              }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400"
                >Rp {{ cat.total.toLocaleString("id-ID") }}</span
              >
              <span
                class="text-xs font-bold px-2 py-0.5 rounded-full min-w-[3rem] text-center"
                :style="{
                  backgroundColor: dnaColors[idx % dnaColors.length] + '22',
                  color: dnaColors[idx % dnaColors.length],
                }"
                >{{ cat.percentage }}%</span
              >
            </div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              class="h-2.5 rounded-full transition-all duration-700 ease-out"
              :style="{
                width: `${cat.percentage}%`,
                backgroundColor: dnaColors[idx % dnaColors.length],
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Apriori Recommendation Panel: Empty State -->
    <div
      v-if="!isLoading && aprioriResult.length === 0"
      class="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4"
      >
        <Wand2 class="w-7 h-7 text-orange-400" />
      </div>
      <h3 class="font-bold text-slate-700 text-lg mb-1">
        Insight Apriori Belum Tersedia
      </h3>
      <p class="text-slate-500 text-sm mb-4 max-w-sm mx-auto">
        Perbanyak transaksimu, lalu jalankan Analisis Apriori untuk menemukan
        pola kebiasaan belanjamu secara otomatis.
      </p>
      <NuxtLink to="/analysis/apriori">
        <Button class="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Wand2 class="w-4 h-4" /> Jalankan Analisis
        </Button>
      </NuxtLink>
    </div>

    <!-- Apriori Recommendation Panel: Has Data -->
    <div
      v-else-if="aprioriResult.length > 0"
      class="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-6 shadow-sm relative overflow-hidden"
    >
      <div
        class="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4"
      >
        <Wand2 class="w-48 h-48 text-orange-600" />
      </div>
      <div class="relative z-10">
        <!-- Header -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-orange-200 flex items-center justify-center"
            >
              <Wand2 class="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-orange-800">
                  Insight Habit Pengeluaranmu
                </h2>
                <span
                  class="text-[10px] font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full uppercase tracking-wide"
                >
                  AI · Apriori
                </span>
              </div>
              <p class="text-xs text-orange-700/70">
                Berdasarkan market basket analysis transaksi terakhirmu.
              </p>
            </div>
          </div>
          <NuxtLink to="/analysis/apriori">
            <Button
              variant="outline"
              class="text-orange-700 border-orange-300 hover:bg-orange-100 text-xs gap-1.5"
            >
              Lihat semua pola
              <ArrowRight class="w-3.5 h-3.5" />
            </Button>
          </NuxtLink>
        </div>

        <!-- Rules Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="(rule, idx) in aprioriResult"
            :key="idx"
            class="bg-white/80 backdrop-blur-sm border border-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <!-- Antecedent -->
            <div class="mb-3">
              <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5"
              >
                Jika membeli
              </p>
              <div
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
              >
                <ShoppingBag class="w-3 h-3 text-slate-500" />
                {{
                  rule.antecedent
                    .replace("Kategori: ", "")
                    .replace("Tempat: ", "")
                }}
              </div>
            </div>

            <!-- Arrow -->
            <div class="flex items-center gap-1.5 mb-3">
              <div class="h-px flex-1 bg-orange-200" />
              <ArrowRight class="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <div class="h-px flex-1 bg-orange-200" />
            </div>

            <!-- Consequent -->
            <div class="mb-4">
              <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5"
              >
                Cenderung juga beli
              </p>
              <div
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200"
              >
                <Sparkles class="w-3 h-3 text-orange-500" />
                {{
                  rule.consequent
                    .replace("Kategori: ", "")
                    .replace("Tempat: ", "")
                }}
              </div>
            </div>

            <!-- Metrics -->
            <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
              <div
                class="flex-1 text-center py-1.5 rounded-lg text-xs font-bold"
                :class="
                  rule.confidence >= 80
                    ? 'bg-emerald-100 text-emerald-700'
                    : rule.confidence >= 60
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-orange-100 text-orange-700'
                "
              >
                {{ rule.confidence }}%
                <p class="text-[9px] font-normal opacity-70">confidence</p>
              </div>
              <div
                class="flex-1 text-center py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600"
              >
                {{ rule.support }}%
                <p class="text-[9px] font-normal opacity-70">support</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Saran Hemat (first rule only) -->
        <div
          v-if="aprioriResult[0]"
          class="mt-4 bg-orange-100/60 rounded-xl p-3.5 text-sm text-orange-800 border border-orange-200 flex gap-3 items-start"
        >
          <span class="text-xl leading-none shrink-0">💡</span>
          <span>
            <b>Saran Hemat:</b> Saat menganggarkan untuk
            <b>{{
              aprioriResult[0].antecedent
                .replace("Kategori: ", "")
                .replace("Tempat: ", "")
            }}</b
            >, sisihkan juga budget untuk
            <b>{{
              aprioriResult[0].consequent
                .replace("Kategori: ", "")
                .replace("Tempat: ", "")
            }}</b>
            sedari awal agar tidak bocor halus.
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Shortcuts -->
    <div>
      <h2 class="text-lg font-bold text-slate-800 mb-4">
        Jalan Pintas Analisis
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NuxtLink to="/analysis/apriori">
          <div
            class="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-colors flex items-center gap-4 cursor-pointer group"
          >
            <div
              class="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm group-hover:bg-orange-200 transition-colors"
            >
              <Wand2 class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-bold text-slate-800">Pola Apriori Pengeluaran</h4>
              <p class="text-sm text-slate-500">
                Temukan relasi kebiasaan belanjamu
              </p>
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/analysis/graph">
          <div
            class="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-colors flex items-center gap-4 cursor-pointer group"
          >
            <div
              class="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-200 transition-colors"
            >
              <Network class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-bold text-slate-800">Knowledge Graph Visual</h4>
              <p class="text-sm text-slate-500">
                Lihat persebaran ontologi &amp; pola asosiasi
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  Dna,
  Home,
  Network,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
  Wand2,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useApi } from "~/services/api";
import { useAuth } from "~/services/auth";

definePageMeta({ middleware: "auth" });

const { fetchUser } = useAuth();
const api = useApi();

const user = ref<any>(null);
const isLoading = ref(true);
const aprioriResult = ref<any[]>([]);

const dashboardSummary = ref<{
  totalThisMonth: number;
  totalLastMonth: number;
  categoryBreakdown: { name: string; total: number; percentage: number }[];
  recentTransactions: any[];
} | null>(null);

// Palette warna untuk Spending DNA bars
const dnaColors = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#3b82f6", // blue
];

const currentMonthExpenses = computed(
  () => dashboardSummary.value?.totalThisMonth ?? 0,
);

const budgetPercentage = computed(() => {
  if (!user.value?.monthlyAllowance) return 0;
  return Math.min(
    (currentMonthExpenses.value / user.value.monthlyAllowance) * 100,
    100,
  );
});

const isOverBudget = computed(() => budgetPercentage.value >= 85);

// Perbandingan bulan ini vs bulan lalu
const monthDiffPercent = computed(() => {
  const last = dashboardSummary.value?.totalLastMonth ?? 0;
  const current = currentMonthExpenses.value;
  if (last === 0) return 0;
  return ((current - last) / last) * 100;
});
const monthDiffPositive = computed(() => monthDiffPercent.value > 0);

// Rata-rata pengeluaran per minggu (bulan ini sudah berjalan berapa hari)
const weeklyAvg = computed(() => {
  const dayOfMonth = new Date().getDate();
  const weeksElapsed = Math.max(1, dayOfMonth / 7);
  return Math.round(currentMonthExpenses.value / weeksElapsed);
});

onMounted(async () => {
  try {
    const res = await fetchUser();
    user.value = res.data;
  } catch (error) {
  } finally {
    isLoading.value = false;
  }

  if (user.value) {
    try {
      const resDash = await api(
        `/transaction/dashboard?userId=${user.value.id}`,
        { method: "GET" },
      );
      dashboardSummary.value = resDash?.data ?? null;
    } catch (err) {
      console.warn("Could not load dashboard summary");
    }

    try {
      const resAp = await api("/analysis/apriori", { method: "GET" });
      const actualResult = resAp?.data?.id
        ? resAp.data
        : resAp?.id
          ? resAp
          : null;

      if (actualResult?.data?.rules) {
        // Tampilkan 3 rules teratas
        aprioriResult.value = actualResult.data.rules.slice(0, 3);
      }
    } catch (error) {}
  }
});
</script>
