<template>
  <div class="space-y-8 pb-10">
    <!-- Hero / Welcome Banner -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white shadow-xl"
    >
      <!-- Decorative background blur -->
      <div
        class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl"
      ></div>

      <div
        class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-2">
            Selamat datang,
            <span
              v-if="isLoading"
              class="animate-pulse bg-white/20 rounded-md w-32 h-8 inline-block align-middle ml-1"
            ></span>
            <span v-else class="text-indigo-100 font-extrabold"
              >{{
                user?.fullname?.split(" ")[0] || user?.username || "Mahasiswa"
              }}! 👋</span
            >
          </h1>
          <p class="text-indigo-100/80 text-lg max-w-xl">
            Mari analisis pola pengeluaran bulananmu dan temukan insight menarik
            dari riwayat transaksimu menggunakan algoritma Semantic Web.
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
      <!-- Card 1 (Budgeting & Warning) -->
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
        ></div>
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
            ></span>
            <span v-else
              >Rp
              {{ user?.monthlyAllowance?.toLocaleString("id-ID") || "0" }}</span
            >
          </div>

          <!-- Progress Bar & Peringatan Dini -->
          <div class="mt-4" v-if="user?.monthlyAllowance">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span :class="isOverBudget ? 'text-rose-600' : 'text-slate-500'">
                Terpakai: Rp {{ currentMonthExpenses.toLocaleString("id-ID") }}
              </span>
              <span :class="isOverBudget ? 'text-rose-600' : 'text-slate-500'">
                {{ budgetPercentage.toFixed(0) }}%
              </span>
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
              ></div>
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
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ring-1 ring-slate-900/5"
      >
        <div
          class="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-purple-50 transition-transform duration-500 group-hover:scale-150"
        ></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
            >
              Semester & Jurusan
            </h3>
            <div class="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
              <GraduationCap class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl font-extrabold text-slate-800 truncate">
            <span
              v-if="isLoading"
              class="animate-pulse bg-slate-100 rounded w-32 h-8 inline-block"
            ></span>
            <span v-else>Smst. {{ user?.semester || "-" }}</span>
          </div>
          <p class="mt-2 text-sm text-slate-500 truncate" :title="user?.major">
            {{ user?.major || "Jurusan belum diset" }}
          </p>
        </div>
      </div>

      <!-- Card 3 -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ring-1 ring-slate-900/5"
      >
        <div
          class="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-150"
        ></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
            >
              Tempat Tinggal
            </h3>
            <div class="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
              <Home class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl font-extrabold text-slate-800">
            <span
              v-if="isLoading"
              class="animate-pulse bg-slate-100 rounded w-24 h-8 inline-block"
            ></span>
            <span v-else>{{ user?.residenceType || "Belum Diset" }}</span>
          </div>
          <p class="mt-2 text-sm text-slate-500">Kategori Akomodasi</p>
        </div>
      </div>
    </div>

    <!-- AI Recommendations Panel -->
    <div
      v-if="aprioriResult && aprioriResult.length > 0"
      class="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl p-6 shadow-sm relative overflow-hidden"
    >
      <div
        class="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4"
      >
        <Wand2 class="w-40 h-40 text-orange-600" />
      </div>
      <div class="relative z-10">
        <h2
          class="text-lg font-bold text-orange-800 mb-1 flex items-center gap-2"
        >
          <Wand2 class="w-5 h-5 text-orange-600" />
          Insight Habit Pengeluaranmu
        </h2>
        <p class="text-sm text-orange-700/80 mb-5">
          Berdasarkan machine learning market basket bulan-bulan terakhir:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(rule, idx) in aprioriResult"
            :key="idx"
            class="bg-white/70 backdrop-blur-sm border border-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <p class="text-sm text-slate-600 mb-1">
              Setiap pengeluaran untuk
              <strong class="text-slate-800">{{
                rule.antecedent
                  .replace("Kategori: ", "")
                  .replace("Tempat: ", "")
              }}</strong
              >,
            </p>
            <p class="text-sm text-slate-600 mb-4">
              Kemungkinan sebesar
              <strong class="text-orange-600">{{ rule.confidence }}%</strong>
              akan dibarengi dengan membeli
              <strong class="text-slate-800">{{
                rule.consequent
                  .replace("Kategori: ", "")
                  .replace("Tempat: ", "")
              }}</strong
              >.
            </p>
            <div
              class="bg-orange-100/60 rounded-lg p-3 text-xs text-orange-800 font-medium border border-orange-100 flex gap-2 items-start"
            >
              <span class="text-lg leading-none">💡</span>
              <span>
                <b>Saran Hemat:</b> Saat menganggarkan uang untuk
                {{
                  rule.antecedent
                    .replace("Kategori: ", "")
                    .replace("Tempat: ", "")
                }}, pertimbangkan untuk menyisihkan/menekan budget
                {{
                  rule.consequent
                    .replace("Kategori: ", "")
                    .replace("Tempat: ", "")
                }}
                sedari awal untuk mencegah bocor halus.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Shortcuts Menu -->
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
                Lihat persebaran ontologi SFA
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
  GraduationCap,
  Home,
  Network,
  Plus,
  TrendingUp,
  Wallet,
  Wand2,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useApi } from "~/services/api";
import { useAuth } from "~/services/auth";

definePageMeta({
  middleware: "auth",
});

const { fetchUser, logout } = useAuth();
const api = useApi();

const user = ref<any>(null);
const isLoading = ref(true);
const aprioriResult = ref<any[]>([]);
const transactions = ref<any[]>([]);

const currentMonthExpenses = computed(() => {
  if (!transactions.value.length) return 0;
  const now = new Date();
  return transactions.value
    .filter((t: any) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum: number, t: any) => sum + t.amount, 0);
});

const budgetPercentage = computed(() => {
  if (!user.value?.monthlyAllowance) return 0;
  const percent =
    (currentMonthExpenses.value / user.value.monthlyAllowance) * 100;
  return Math.min(percent, 100);
});

const isOverBudget = computed(() => budgetPercentage.value >= 85); // Peringatan Dini saat terpakai 85%

onMounted(async () => {
  try {
    const res = await fetchUser();
    user.value = res.data;
  } catch (error) {
    // Error ditangani interceptor
  } finally {
    isLoading.value = false;
  }

  // Load Transactions for Budgeting
  if (user.value) {
    try {
      const resTrx = await api(`/transaction?userId=${user.value.id}`, {
        method: "GET",
      });
      transactions.value = resTrx?.data || [];
    } catch (err) {
      console.warn("Could not load transactions data for dashboard");
    }
  }

  // Load Insights for Dashboard

  try {
    const resAp = await api("/analysis/apriori", { method: "GET" });
    const actualResult = resAp?.data?.id
      ? resAp.data
      : resAp?.id
        ? resAp
        : null;

    if (actualResult && actualResult.data && actualResult.data.rules) {
      // Kita hanya tampilkan maksimal 2 rules tertinggi untuk tidak memenuhi dashboard
      aprioriResult.value = actualResult.data.rules.slice(0, 2);
    }
  } catch (error) {
    // Abaikan jika user belum pernah melakukan analisis Apriori
  }
});
</script>
