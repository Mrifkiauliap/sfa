<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          Pola Apriori (Association Rules)
        </h2>
        <p class="text-slate-500">
          Temukan pola kebiasaan transaksimu secara dinamis berdasarkan Market
          Basket Analysis.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          @click="generateRules"
          :disabled="isGenerating"
          class="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-md w-full md:w-auto"
        >
          <Wand2 class="w-4 h-4" :class="{ 'animate-pulse': isGenerating }" />
          {{ isGenerating ? "Menganalisis..." : "Mulai Analisis" }}
        </Button>
      </div>
    </div>

    <!-- Parameter Config Panel -->
    <div
      class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden"
    >
      <div
        v-if="isGenerating"
        class="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex cursor-wait"
      />

      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-slate-700"
          >Periode Keranjang (Basket)</label
        >
        <select
          v-model="params.basketPeriod"
          class="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm bg-white cursor-pointer"
        >
          <option value="weekly">Mingguan (Weekly)</option>
          <option value="monthly">Bulanan (Monthly)</option>
        </select>
        <p class="text-xs text-slate-400">
          Cara transaksi dikelompokkan bersama
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-slate-700"
          >Minimum Support (%)</label
        >
        <input
          v-model.number="params.minSupport"
          type="number"
          min="1"
          max="100"
          class="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm bg-white"
        />
        <p class="text-xs text-slate-400">
          Minimal seberapa sering kombinasi muncul
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-slate-700"
          >Minimum Confidence (%)</label
        >
        <input
          v-model.number="params.minConfidence"
          type="number"
          min="1"
          max="100"
          class="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm bg-white"
        />
        <p class="text-xs text-slate-400">
          Seberapa kuat probabilitas pola ini terjadi
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!result || !result.data"
      class="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden"
    >
      <div v-if="isLoading" class="p-16 flex justify-center">
        <span
          class="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin"
        ></span>
      </div>
      <div
        v-else
        class="p-16 text-center flex flex-col items-center justify-center"
      >
        <div
          class="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-orange-50/50"
        >
          <Wand2 class="w-10 h-10 text-orange-300" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">
          Ruangan Riset Masih Kosong
        </h3>
        <p class="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
          Pilih config di atas dan klik <b>Mulai Analisis</b> untuk melihat
          kebiasaan finansialmu.
        </p>
      </div>
    </div>

    <!-- Results State -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between text-sm">
        <p class="text-slate-500">
          Ditemukan <b>{{ result.data.rules?.length || 0 }}</b> pola kebiasaan
          unik dari total <b>{{ result.data.totalBaskets }}</b> keranjang.
        </p>
        <p class="text-slate-400">
          Terakhir dihasilkan:
          {{ new Date(result.createdAt).toLocaleString("id-ID") }}
        </p>
      </div>

      <div
        v-if="result.data.rules?.length === 0"
        class="p-10 border border-dashed border-slate-300 text-center rounded-2xl bg-slate-50"
      >
        <p class="text-slate-600 font-medium">
          Tidak ada pola yang memenuhi kriteria Support dan Confidence.
        </p>
        <p class="text-slate-400 text-sm mt-1">
          Coba turunkan angka persentase Minimum Support / Confidence di atas.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(rule, idx) in result.data.rules"
          :key="idx"
          class="border border-slate-200 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div class="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>

          <div class="mb-4">
            <p
              class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
            >
              Jika kamu menghabiskan uang untuk
            </p>
            <div
              class="inline-block px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-sm font-medium border border-slate-200 shadow-inner"
            >
              {{ rule.antecedent }}
            </div>
          </div>

          <div class="mb-5 relative">
            <div class="absolute left-6 -top-2 w-0.5 h-4 bg-slate-200"></div>
            <p
              class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
            >
              Maka sangat mungkin disertai dengan
            </p>
            <div
              class="inline-block px-3 py-1.5 bg-orange-50 text-orange-800 rounded-lg text-sm font-medium border border-orange-200 shadow-inner"
            >
              {{ rule.consequent }}
            </div>
          </div>

          <div
            class="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 mt-auto"
          >
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-semibold">
                Tingkat Kepastian
              </p>
              <p class="text-lg font-black text-slate-700">
                {{ rule.confidence }}%
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-semibold">
                Frekuensi Keseluruhan
              </p>
              <p class="text-lg font-black text-slate-700">
                {{ rule.support }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Wand2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useApi } from "~/services/api";
import { useNotification } from "~/utils/notify";

definePageMeta({
  middleware: "auth",
});

const api = useApi();
const { showSuccess, showError } = useNotification();

const isLoading = ref(true);
const isGenerating = ref(false);
const result = ref<any>(null);

const params = ref({
  basketPeriod: "weekly",
  minSupport: 30,
  minConfidence: 60,
});

const loadLatestResult = async () => {
  isLoading.value = true;
  try {
    const response = await api("/analysis/apriori", { method: "GET" });
    const actualResult = response?.data?.id
      ? response.data
      : response?.id
        ? response
        : null;

    if (actualResult && actualResult.data) {
      result.value = actualResult;
      params.value.basketPeriod = actualResult.data.period || "weekly";
      params.value.minSupport = actualResult.data.minSupport || 30;
      params.value.minConfidence = actualResult.data.minConfidence || 60;
    }
  } catch (error: any) {
    console.error("No previous analysis found or error:", error);
  } finally {
    isLoading.value = false;
  }
};

const generateRules = async () => {
  isGenerating.value = true;
  try {
    const response = await api("/analysis/apriori", {
      method: "POST",
      body: {
        basketPeriod: params.value.basketPeriod,
        minSupport: params.value.minSupport,
        minConfidence: params.value.minConfidence,
      },
    });

    const actualResult = response?.data?.id
      ? response.data
      : response?.id
        ? response
        : null;

    if (actualResult && actualResult.data) {
      result.value = actualResult;
      showSuccess(
        `Berhasil menganalisis data! Ditemukan ${actualResult.data.rules?.length || 0} pola.`,
      );
    } else {
      showError(
        "Sistem berhasil merespon, tetapi format hasil analisis terputus.",
      );
    }
  } catch (error: any) {
    if (error.response?._data?.message) {
      showError(error.response.message || error.response._data.message);
    } else {
      showError("Gagal menjalankan algoritma Apriori.");
    }
  } finally {
    isGenerating.value = false;
  }
};

onMounted(() => {
  loadLatestResult();
});
</script>
