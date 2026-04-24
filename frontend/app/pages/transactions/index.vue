<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          Data Transaksi
        </h2>
        <p class="text-slate-500">Pusat pencatatan seluruh pengeluaran.</p>
      </div>
      <Button
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
      >
        <Plus class="w-4 h-4" />
        Catat Transaksi
      </Button>
    </div>

    <!-- Search Bar (Semantic Web) -->
    <div class="relative">
      <div
        class="absolute inset-y-0 left-4 flex items-center pointer-events-none"
      >
        <Search class="w-4 h-4 text-slate-400" />
      </div>
      <input
        v-model="searchQuery"
        @input="onSearchInput"
        type="text"
        placeholder="Cari via Semantic Web... (nama merchant, kategori, keterangan)"
        class="w-full pl-11 pr-36 py-3 rounded-xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
      />
      <div class="absolute inset-y-0 right-3 flex items-center gap-2">
        <span
          v-if="searchQuery && meta.searchSource"
          class="text-[10px] font-bold px-2 py-1 rounded-full"
          :class="
            meta.searchSource?.includes('SPARQL')
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-orange-100 text-orange-700'
          "
        >
          {{
            meta.searchSource?.includes("SPARQL") ? "🔗 SPARQL" : "🔄 Fallback"
          }}
        </span>
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Insight Banner -->
    <div
      v-if="searchQuery && meta.suggestion"
      class="mt-4 mb-2 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 animate-in fade-in"
    >
      <div class="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0 mt-0.5">
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
        >
          <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
      <div>
        <h4 class="text-sm font-bold text-indigo-900">Insight AI</h4>
        <p class="text-sm text-indigo-800 mt-1 leading-relaxed">
          {{ meta.suggestion }}
        </p>
      </div>
    </div>

    <!-- Table Container -->
    <div
      class="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col mt-4"
    >
      <div v-if="isLoading" class="p-16 flex justify-center">
        <span
          class="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"
        ></span>
      </div>

      <div
        v-else-if="!transactions.length"
        class="p-16 text-center flex flex-col items-center justify-center"
      >
        <div
          class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-slate-50/50"
        >
          <Receipt class="w-10 h-10 text-slate-300" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">
          {{ searchQuery ? "Tidak ditemukan hasil" : "Belum ada Transaksi" }}
        </h3>
        <p class="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
          {{
            searchQuery
              ? `Tidak ada transaksi yang cocok dengan "${searchQuery}".`
              : "Mulai catat pengeluaranmu hari ini biar keuangan gampang dilacak."
          }}
        </p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr
              class="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm"
            >
              <th class="py-3 px-6 font-semibold">Waktu / Tanggal</th>
              <th class="py-3 px-6 font-semibold">Merchant / Tempat</th>
              <th class="py-3 px-6 font-semibold">Kategori</th>
              <th class="py-3 px-6 font-semibold">Metode Bayar</th>
              <th class="py-3 px-6 font-semibold">Keterangan</th>
              <th class="py-3 px-6 font-semibold">Nominal</th>
              <th class="py-3 px-6 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="text-sm text-slate-700 divide-y divide-slate-100">
            <tr
              v-for="trx in transactions"
              :key="trx.id"
              class="hover:bg-slate-50/70 transition-colors cursor-pointer"
              @click="openDetailModal(trx)"
            >
              <td class="py-4 px-6 whitespace-nowrap">
                {{ formatDate(trx.date) }}
              </td>
              <td class="py-4 px-6">
                <span class="font-semibold text-slate-800">{{
                  trx.merchant?.name || "-"
                }}</span>
              </td>
              <td class="py-4 px-6">
                <span
                  class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200"
                >
                  {{ trx.category?.name || "-" }}
                </span>
              </td>
              <td class="py-4 px-6">{{ trx.paymentMethod?.name || "-" }}</td>
              <td class="py-4 px-6">
                <span
                  v-if="trx.description"
                  class="text-xs text-slate-500 italic max-w-[150px] truncate block"
                  :title="trx.description"
                  >{{ trx.description }}</span
                >
                <span v-else>-</span>
              </td>
              <td class="py-4 px-6">
                <span class="font-bold text-rose-600">{{
                  formatRp(trx.amount)
                }}</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <button
                    @click.stop="openEditModal(trx)"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="handleDelete(trx.id)"
                    class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Hapus"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div
          class="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white"
        >
          <div class="text-sm text-slate-500">
            Menampilkan
            <span class="font-medium text-slate-800">{{
              transactions.length
            }}</span>
            dari
            <span class="font-medium text-slate-800">{{ meta.total }}</span>
            data · Halaman
            <span class="font-medium text-slate-800">{{ meta.page }}</span>
            /
            <span class="font-medium text-slate-800">{{
              meta.totalPages
            }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              @click="goToPage(meta.page - 1)"
              :disabled="meta.page <= 1"
            >
              ← Sebelumnya
            </button>
            <template v-for="p in visiblePages" :key="p">
              <button
                @click="goToPage(p)"
                class="w-9 h-9 text-sm font-medium rounded-md border transition-colors"
                :class="
                  p === meta.page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                "
              >
                {{ p }}
              </button>
            </template>
            <button
              class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              @click="goToPage(meta.page + 1)"
              :disabled="meta.page >= meta.totalPages"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reusable Form Modal -->
    <XFormModal
      v-model="isModalOpen"
      :title="isEdit ? 'Ubah Transaksi' : 'Catat Transaksi'"
      :description="
        isEdit
          ? 'Koreksi data pengeluaranmu disini.'
          : 'Tambahkan data historis pengeluaran baru.'
      "
      :loading="isSubmitting"
      @submit="handleSubmit"
    >
      <div class="space-y-4">
        <!-- Error General -->
        <XInputError v-if="errors['general']" :message="errors['general']" />

        <!-- Nominal Output (Lebar / Hero) -->
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Nominal Rp. <span class="text-rose-500">*</span></label
          >
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            placeholder="Cth: 25000"
            class="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg transition-shadow"
            :class="{
              'border-rose-300 focus:ring-rose-500/20': errors['amount'],
            }"
          />
          <XInputError :message="errors['amount']" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Kategori -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Kategori <span class="text-rose-500">*</span></label
            >
            <select
              v-model="form.categoryId"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white cursor-pointer"
              :class="{ 'border-rose-300': errors['categoryId'] }"
            >
              <option value="" disabled>-- Pilih Kategori --</option>
              <option
                v-for="cat in masterData.categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
            <XInputError :message="errors['categoryId']" />
          </div>

          <!-- Pihak Merchant -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Merchant <span class="text-rose-500">*</span></label
            >
            <select
              v-model="form.merchantId"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white cursor-pointer"
              :class="{ 'border-rose-300': errors['merchantId'] }"
            >
              <option value="" disabled>-- Pilih Tempat --</option>
              <option
                v-for="merch in masterData.merchants"
                :key="merch.id"
                :value="merch.id"
              >
                {{ merch.name }}
              </option>
            </select>
            <XInputError :message="errors['merchantId']" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Metode Pembayaran -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Metode Bayar <span class="text-rose-500">*</span></label
            >
            <select
              v-model="form.paymentMethodId"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white cursor-pointer"
              :class="{ 'border-rose-300': errors['paymentMethodId'] }"
            >
              <option value="" disabled>-- Pilih Metode --</option>
              <option
                v-for="pay in masterData.payments"
                :key="pay.id"
                :value="pay.id"
              >
                {{ pay.name }}
              </option>
            </select>
            <XInputError :message="errors['paymentMethodId']" />
          </div>

          <!-- Date -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Tanggal Transaksi</label
            >
            <input
              v-model="form.date"
              type="datetime-local"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Keterangan / Catatan</label
          >
          <input
            v-model="form.description"
            type="text"
            placeholder="Cth: Nongkrong sore bareng..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>
    </XFormModal>

    <!-- Detail Modal -->
    <TransactionDetailModal ref="detailModal" />
  </div>
</template>

<script setup lang="ts">
import { Edit2, Plus, Receipt, Search, Trash2, X } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import XFormModal from "~/components/XFormModal.vue";
import XInputError from "~/components/XInputError.vue";
import { useApi } from "~/services/api";
import { useAuthStore } from "~/stores/auth";
import { useNotification } from "~/utils/notify";

definePageMeta({ middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const { showSuccess, showError } = useNotification();

const transactions = ref<any[]>([]);
const isLoading = ref(true);
const searchQuery = ref("");
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const meta = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  searchSource: "" as string | undefined,
  suggestion: "" as string | undefined,
});

// Master Data List
const masterData = ref({
  categories: [] as any[],
  merchants: [] as any[],
  payments: [] as any[],
});

// Modal state
const isModalOpen = ref(false);
const isEdit = ref(false);
const isSubmitting = ref(false);

const form = ref({
  id: "",
  categoryId: "",
  merchantId: "",
  paymentMethodId: "",
  amount: "" as number | "",
  date: "",
  description: "",
});

const errors = ref<Record<string, string>>({});

const detailModal = ref<any>(null);

const openDetailModal = (trx: any) => {
  if (detailModal.value) {
    detailModal.value.open(trx);
  }
};

// Computed: visible page buttons (max 5)
const visiblePages = computed(() => {
  const total = meta.value.totalPages;
  const current = meta.value.page;
  const delta = 2;
  const pages: number[] = [];
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    pages.push(i);
  }
  return pages;
});

// Function Utils
const formatRp = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatDate = (isoString: string) => {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatToInputDate = (isoString: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

// Data Loaders
const fetchMasterData = async () => {
  try {
    const [cat, mer, pay] = await Promise.all([
      api("/category"),
      api("/merchant"),
      api("/payment-method"),
    ]);
    masterData.value.categories = cat.data || [];
    masterData.value.merchants = mer.data || [];
    masterData.value.payments = pay.data || [];
  } catch (err) {
    console.error("Gagal load master data:", err);
  }
};

const fetchTransactions = async (page = 1) => {
  if (!authStore.user) return;
  isLoading.value = true;
  try {
    const res = await api(
      `/transaction?userId=${authStore.user.id}&page=${page}&limit=${meta.value.limit}`,
      { method: "GET" },
    );
    transactions.value = res.data?.data || res.data || [];
    if (res.meta) {
      meta.value = { ...meta.value, ...res.meta, searchSource: "" };
    }
  } catch (err: any) {
    if (err.response?.status !== 401) {
      showError("Gagal memuat data transaksi.");
    }
  } finally {
    isLoading.value = false;
  }
};

const searchTransactions = async (page = 1) => {
  if (!authStore.user || !searchQuery.value.trim()) {
    return fetchTransactions(1);
  }
  isLoading.value = true;
  try {
    const q = encodeURIComponent(searchQuery.value.trim());
    const res = await api(
      `/transaction/search?userId=${authStore.user.id}&q=${q}&page=${page}&limit=${meta.value.limit}`,
      { method: "GET" },
    );
    transactions.value = res.data || [];
    if (res.meta) {
      meta.value = { ...meta.value, ...res.meta };
    }
  } catch (err: any) {
    showError("Gagal melakukan pencarian.");
  } finally {
    isLoading.value = false;
  }
};

// Debounced search input
const onSearchInput = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value);
  searchTimer.value = setTimeout(() => {
    meta.value.page = 1;
    searchTransactions(1);
  }, 400);
};

const clearSearch = () => {
  searchQuery.value = "";
  fetchTransactions(1);
};

const goToPage = (page: number) => {
  meta.value.page = page;
  if (searchQuery.value.trim()) {
    searchTransactions(page);
  } else {
    fetchTransactions(page);
  }
};

onMounted(async () => {
  await fetchMasterData();
  if (authStore.user) {
    fetchTransactions();
  } else {
    setTimeout(() => fetchTransactions(), 1000);
  }
});

// Modals Setup
const openCreateModal = () => {
  isEdit.value = false;
  form.value = {
    id: "",
    categoryId: "",
    merchantId: "",
    paymentMethodId: "",
    amount: "",
    date: formatToInputDate(new Date().toISOString()),
    description: "",
  };
  errors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (trx: any) => {
  isEdit.value = true;
  form.value = {
    id: trx.id,
    categoryId: trx.category?.id || "",
    merchantId: trx.merchant?.id || "",
    paymentMethodId: trx.paymentMethod?.id || "",
    amount: trx.amount,
    date: formatToInputDate(trx.date),
    description: trx.description || "",
  };
  errors.value = {};
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  errors.value = {};
  let hasError = false;

  if (!form.value.amount || parseInt(form.value.amount as string) <= 0) {
    errors.value["amount"] = "Nominal wajib diisi dengan positif";
    hasError = true;
  }
  if (!form.value.categoryId) {
    errors.value["categoryId"] = "Harap pilih Kategori";
    hasError = true;
  }
  if (!form.value.merchantId) {
    errors.value["merchantId"] = "Harap pilih Merchant";
    hasError = true;
  }
  if (!form.value.paymentMethodId) {
    errors.value["paymentMethodId"] = "Harap pilih Metode pembayaran";
    hasError = true;
  }

  if (hasError) return;

  isSubmitting.value = true;
  try {
    const payload: any = {
      userId: authStore.user.id,
      categoryId: form.value.categoryId,
      merchantId: form.value.merchantId,
      paymentMethodId: form.value.paymentMethodId,
      amount: Number(form.value.amount),
    };

    if (form.value.date) payload.date = new Date(form.value.date).toISOString();
    if (form.value.description) payload.description = form.value.description;

    if (isEdit.value) {
      await api(`/transaction/${form.value.id}`, {
        method: "PATCH",
        body: payload,
      });
      showSuccess("Transaksi berhasil diperbarui");
    } else {
      await api("/transaction", {
        method: "POST",
        body: payload,
      });
      showSuccess("Pengeluaran baru berhasil dicatat");
    }

    isModalOpen.value = false;
    fetchTransactions(meta.value.page);
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?._data?.message) {
      const msg = err.response._data.message;
      errors.value["general"] = Array.isArray(msg) ? msg.join(", ") : msg;
    } else {
      showError("Gagal menyimpan data transaksi");
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (
    confirm(
      "Apakah kamu yakin menghapus riwayat transaksi ini? Data tidak dapat dikembalikan.",
    )
  ) {
    try {
      await api(`/transaction/${id}`, {
        method: "DELETE",
        parseResponse: (txt) => txt,
      });
      showSuccess("Riwayat telah bersih dihapus");
      fetchTransactions(meta.value.page);
    } catch (err: any) {
      showError(
        err.response?._data?.message || err.message || "Gagal menghapus.",
      );
    }
  }
};
</script>
