<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          Master Merchant
        </h2>
        <p class="text-slate-500">Tempat dimana riwayat transaksi terjadi.</p>
      </div>
      <Button
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
      >
        <Plus class="w-4 h-4" />
        Tambah Merchant
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
        v-else-if="merchants.length === 0"
        class="p-16 text-center flex flex-col items-center justify-center"
      >
        <div
          class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-slate-50/50"
        >
          <Store class="w-10 h-10 text-slate-300" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">Data Merchant Kosong</h3>
        <p class="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
          Tambahkan warteg, kantin, atau tempat print favoritmu.
        </p>
      </div>

      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr
            class="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm"
          >
            <th class="py-3 px-6 font-semibold">Nama Merchant</th>
            <th class="py-3 px-6 font-semibold">Keterangan</th>
            <th class="py-3 px-6 font-semibold">Lokasi</th>
            <th class="py-3 px-6 font-semibold w-32 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm text-slate-700 divide-y divide-slate-100">
          <tr
            v-for="merchant in merchants"
            :key="merchant.id"
            class="hover:bg-slate-50/70 transition-colors"
          >
            <td class="py-4 px-6 font-medium text-slate-900">
              {{ merchant.name }}
            </td>
            <td class="py-4 px-6 font-medium text-slate-900">
              {{ merchant.description }}
            </td>
            <td class="py-4 px-6 font-medium text-slate-900">
              {{ merchant.location }}
            </td>
            <td class="py-4 px-6 text-center">
              <div class="flex items-center justify-center gap-2">
                <button
                  @click="openEditModal(merchant)"
                  class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  @click="handleDelete(merchant.id)"
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
      :title="isEdit ? 'Edit Merchant' : 'Tambah Merchant'"
      :description="
        isEdit
          ? 'Ubah nama merchant langgananmu.'
          : 'Daftarkan tempat dimana kamu biasa menghabiskan uang.'
      "
      :loading="isSubmitting"
      @submit="handleSubmit"
    >
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700"
            >Nama Merchant <span class="text-rose-500">*</span></label
          >
          <input
            v-model="form.name"
            type="text"
            placeholder="Contoh: Warteg Bahari, Chatime, dll..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
            :class="{
              'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500':
                errors['name'],
            }"
          />
          <XInputError :message="errors['name']" />
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700"
              >Lokasi
              <span class="text-xs text-slate-400 font-normal"
                >(Opsional)</span
              ></label
            >
            <input
              v-model="form.location"
              type="text"
              placeholder="Contoh: Jl. Margonda Raya No.2"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
            />
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
              placeholder="Tambahkan detail merchant..."
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </div>
      </div>
    </XFormModal>
  </div>
</template>

<script setup lang="ts">
import { Edit2, Plus, Store, Trash2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import XFormModal from "~/components/XFormModal.vue";
import XInputError from "~/components/XInputError.vue";
import { useApi } from "~/services/api";

definePageMeta({ middleware: "auth" });

const api = useApi();
const { showSuccess, showError } = useNotification();

const merchants = ref<any[]>([]);
const isLoading = ref(true);

// Modal state
const isModalOpen = ref(false);
const isEdit = ref(false);
const isSubmitting = ref(false);
const form = ref({ id: "", name: "", description: "", location: "" });
const errors = ref<Record<string, string>>({});

const fetchMerchants = async () => {
  isLoading.value = true;
  try {
    const res = await api("/merchant", { method: "GET" });
    merchants.value = res.data || [];
  } catch (err: any) {
    if (err.response?.status !== 401) {
      showError("Gagal memuat data merchant.");
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchMerchants();
});

const openCreateModal = () => {
  isEdit.value = false;
  form.value = { id: "", name: "", description: "", location: "" };
  errors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (merchant: any) => {
  isEdit.value = true;
  form.value = {
    id: merchant.id,
    name: merchant.name,
    description: merchant.description || "",
    location: merchant.location || "",
  };
  errors.value = {};
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value["name"] = "Nama merchant wajib diisi.";
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: any = { name: form.value.name };
    if (form.value.description) payload.description = form.value.description;
    if (form.value.location) payload.location = form.value.location;

    if (isEdit.value) {
      await api(`/merchant/${form.value.id}`, {
        method: "PATCH",
        body: payload,
      });
      showSuccess("Merchant berhasil diperbarui", "Berhasil");
    } else {
      await api("/merchant", {
        method: "POST",
        body: payload,
      });
      showSuccess("Merchant baru berhasil ditambah", "Berhasil");
    }
    isModalOpen.value = false;
    fetchMerchants();
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?._data?.message) {
      const msg = err.response._data.message;
      errors.value["name"] = Array.isArray(msg) ? msg[0] : msg;
    } else {
      showError("Gagal menyimpan merchant");
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (confirm("Yakin ingin menghapus merchant ini?")) {
    try {
      await api(`/merchant/${id}`, {
        method: "DELETE",
        parseResponse: (txt) => txt,
      });
      showSuccess("Merchant telah dihapus");
      fetchMerchants();
    } catch (err: any) {
      const errMsg =
        err.response?._data?.message ||
        err.message ||
        "Gagal menghapus merchant.";
      showError(errMsg);
    }
  }
};
</script>
