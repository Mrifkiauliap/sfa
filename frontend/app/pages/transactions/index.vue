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

    <!-- Table Container -->
    <div
      class="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col"
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
        <h3 class="text-lg font-bold text-slate-800">Belum ada Transaksi</h3>
        <p class="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
          Mulai catat pengeluaranmu hari ini biar keuangan gampang dilacak.
        </p>
      </div>

      <!-- Tanstack UI Data Grid -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="py-3 px-6 font-semibold whitespace-nowrap"
              >
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </th>
            </tr>
          </thead>
          <tbody class="text-sm text-slate-700 divide-y divide-slate-100">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="py-4 px-6"
              >
                <!-- Render normal cells -->
                <FlexRender
                  v-if="cell.column.id !== 'actions'"
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />

                <!-- Custom Render for Actions -->
                <div v-else class="flex items-center gap-2">
                  <button
                    @click="openEditModal(row.original)"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleDelete(row.original.id)"
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
            Halaman
            <span class="font-medium text-slate-800">{{
              table.getState().pagination.pageIndex + 1
            }}</span>
            dari
            <span class="font-medium text-slate-800">{{
              table.getPageCount()
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700"
              @click="table.previousPage()"
              :disabled="!table.getCanPreviousPage()"
            >
              Sebelumnya
            </button>
            <button
              class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700"
              @click="table.nextPage()"
              :disabled="!table.getCanNextPage()"
            >
              Selanjutnya
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
  </div>
</template>

<script setup lang="ts">
import { Edit2, Plus, Receipt, Trash2 } from "lucide-vue-next";
import { h, onMounted, ref } from "vue";
import XFormModal from "~/components/XFormModal.vue";
import XInputError from "~/components/XInputError.vue";
import { useApi } from "~/services/api";
import { useAuthStore } from "~/stores/auth";
import { useNotification } from "~/utils/notify";

// Tanstack Vue Table
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

definePageMeta({ middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const { showSuccess, showError } = useNotification();

const transactions = ref<any[]>([]);
const isLoading = ref(true);

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
  date: "", // ISO String YYYY-MM-DDTHH:mm
  description: "",
});

const errors = ref<Record<string, string>>({});

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
  // YYYY-MM-DDTHH:mm
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

const fetchTransactions = async () => {
  if (!authStore.user) return;
  isLoading.value = true;
  try {
    const res = await api(`/transaction?userId=${authStore.user.id}`, {
      method: "GET",
    });
    transactions.value = res.data || [];
  } catch (err: any) {
    if (err.response?.status !== 401) {
      showError("Gagal memuat data transaksi.");
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await fetchMasterData(); // Background load Options
  if (authStore.user) {
    fetchTransactions();
  } else {
    // wait for auth ready
    setTimeout(() => fetchTransactions(), 1000);
  }
});

// Tanstack Columns setup
const columnHelper = createColumnHelper<any>();
const columns = [
  columnHelper.accessor("date", {
    header: "Waktu / Tanggal",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("merchant.name", {
    header: "Merchant / Tempat",
    cell: (info) =>
      h(
        "span",
        { class: "font-semibold text-slate-800" },
        info.getValue() || "-",
      ),
  }),
  columnHelper.accessor("category.name", {
    header: "Kategori",
    cell: (info) =>
      h(
        "span",
        {
          class:
            "px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200",
        },
        info.getValue() || "-",
      ),
  }),
  columnHelper.accessor("paymentMethod.name", {
    header: "Metode Bayar",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("description", {
    header: "Keterangan",
    cell: (info) =>
      info.getValue()
        ? h(
            "span",
            {
              class:
                "text-xs text-slate-500 italic max-w-[150px] truncate block",
              title: info.getValue(),
            },
            info.getValue(),
          )
        : "-",
  }),
  columnHelper.accessor("amount", {
    header: "Nominal",
    cell: (info) =>
      h(
        "span",
        { class: "font-bold text-rose-600" },
        formatRp(info.getValue()),
      ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Aksi",
  }),
];

const table = useVueTable({
  get data() {
    return transactions.value;
  },
  columns: columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    pagination: {
      pageSize: 8, // Set 8 baris per halaman supaya tabel tidak meler kebawah
    },
  },
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
    fetchTransactions();
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
        parseResponse: (txt) => txt, // Sama kasus seperti 204 master data
      });
      showSuccess("Riwayat telah bersih dihapus");
      fetchTransactions();
    } catch (err: any) {
      showError(
        err.response?._data?.message || err.message || "Gagal menghapus.",
      );
    }
  }
};
</script>
