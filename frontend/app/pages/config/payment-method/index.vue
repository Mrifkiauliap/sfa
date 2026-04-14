<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          Metode Pembayaran
        </h2>
        <p class="text-slate-500">Pilihan metode bayar untuk transaksi.</p>
      </div>
      <Button
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
      >
        <Plus class="w-4 h-4" />
        Tambah Metode
      </Button>
    </div>

    <!-- Table Layout -->
    <div
      class="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden"
    >
      <div v-if="isLoading" class="p-16 flex justify-center">
        <span
          class="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"
        ></span>
      </div>

      <div
        v-else-if="payments.length === 0"
        class="p-16 text-center flex flex-col items-center justify-center"
      >
        <div
          class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-slate-50/50"
        >
          <Wallet class="w-10 h-10 text-slate-300" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">
          Set-up Payment Method Kosong
        </h3>
        <p class="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
          Tambahkan opsi pengeluaranmu (misal: Tunai, Gopay, QRIS, dll).
        </p>
      </div>

      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr
            class="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm"
          >
            <th class="py-3 px-6 font-semibold">Nama Metode</th>
            <th class="py-3 px-6 font-semibold">Keterangan</th>
            <th class="py-3 px-6 font-semibold w-32 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700 divide-y divide-slate-100">
          <tr
            v-for="payment in payments"
            :key="payment.id"
            class="hover:bg-slate-50/70 transition-colors"
          >
            <td class="py-4 px-6 font-medium text-slate-900">
              {{ payment.name }}
            </td>
            <td class="py-4 px-6 font-medium text-slate-900">
              {{ payment.description }}
            </td>
            <td class="py-4 px-6 text-center">
              <div class="flex items-center justify-center gap-2">
                <button
                  @click="openEditModal(payment)"
                  class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  @click="handleDelete(payment.id)"
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
    </div>

    <!-- Reusable Form Modal -->
    <XFormModal
      v-model="isModalOpen"
      :title="isEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode'"
      :description="
        isEdit
          ? 'Ubah nama metode pembayaran.'
          : 'Daftarkan opsi pembayaran untuk transaksimu.'
      "
      :loading="isSubmitting"
      @submit="handleSubmit"
    >
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700"
            >Metode Pembayaran <span class="text-rose-500">*</span></label
          >
          <input
            v-model="form.name"
            type="text"
            placeholder="Contoh: Tunai, QRIS, Paylater..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
            :class="{
              'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500':
                errors['name'],
            }"
          />
          <XInputError :message="errors['name']" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700"
            >Keterangan
            <span class="text-xs text-slate-400 font-normal"
              >(Opsional)</span
            ></label
          >
          <input
            v-model="form.description"
            type="text"
            placeholder="Aplikasi OVO rekening sekian..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
          />
        </div>
      </div>
    </XFormModal>
  </div>
</template>

<script setup lang="ts">
import { Edit2, Plus, Trash2, Wallet } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import XFormModal from "~/components/XFormModal.vue";
import XInputError from "~/components/XInputError.vue";
import { useApi } from "~/services/api";

definePageMeta({ middleware: "auth" });

const api = useApi();
const { showSuccess, showError } = useNotification();

const payments = ref<any[]>([]);
const isLoading = ref(true);

// Modal state
const isModalOpen = ref(false);
const isEdit = ref(false);
const isSubmitting = ref(false);
const form = ref({ id: "", name: "", description: "" });
const errors = ref<Record<string, string>>({});

const fetchPayments = async () => {
  isLoading.value = true;
  try {
    const res = await api("/payment-method", { method: "GET" });
    payments.value = res.data || [];
  } catch (err: any) {
    if (err.response?.status !== 401) {
      showError("Gagal memuat data payment method.");
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPayments();
});

const openCreateModal = () => {
  isEdit.value = false;
  form.value = { id: "", name: "", description: "" };
  errors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (payment: any) => {
  isEdit.value = true;
  form.value = {
    id: payment.id,
    name: payment.name,
    description: payment.description || "",
  };
  errors.value = {};
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value["name"] = "Metode pembayaran wajib diisi.";
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: any = { name: form.value.name };
    if (form.value.description) {
      payload.description = form.value.description;
    }

    if (isEdit.value) {
      await api(`/payment-method/${form.value.id}`, {
        method: "PATCH",
        body: payload,
      });
      showSuccess("Metode berhasil diperbarui", "Berhasil");
    } else {
      await api("/payment-method", {
        method: "POST",
        body: payload,
      });
      showSuccess("Metode baru berhasil ditambah", "Berhasil");
    }
    isModalOpen.value = false;
    fetchPayments();
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?._data?.message) {
      const msg = err.response._data.message;
      errors.value["name"] = Array.isArray(msg) ? msg[0] : msg;
    } else {
      showError("Gagal menyimpan metode pembayaran");
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (confirm("Yakin ingin menghapus metode ini?")) {
    try {
      await api(`/payment-method/${id}`, {
        method: "DELETE",
        parseResponse: (txt) => txt,
      });
      showSuccess("Metode telah dihapus");
      fetchPayments();
    } catch (err: any) {
      const errMsg =
        err.response?._data?.message ||
        err.message ||
        "Gagal menghapus metode.";
      showError(errMsg);
    }
  }
};
</script>
