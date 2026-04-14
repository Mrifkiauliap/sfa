<script setup lang="ts">
import {
  LayoutDashboard,
  LogOut,
  Network,
  Receipt,
  Store,
  Tags,
  Wallet,
  Wand2,
} from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import XFormModal from "~/components/XFormModal.vue";
import XInputError from "~/components/XInputError.vue";
import { useApi } from "~/services/api";
import { useAuth } from "~/services/auth";
import { useAuthStore } from "~/stores/auth";
import { useNotification } from "~/utils/notify";

const route = useRoute();
const authStore = useAuthStore();
const { logout } = useAuth();
const api = useApi();
const { showSuccess, showError } = useNotification();

onMounted(() => {
  if (!authStore.user) {
    authStore.fetchUser();
  }
});

const handleLogout = () => {
  logout();
};

// Struktur menu navigasi
const menus = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Data Transaksi", path: "/transactions", icon: Receipt },
  {
    name: "Analisis KG & Apriori",
    children: [
      { name: "Pola Apriori", path: "/analysis/apriori", icon: Wand2 },
      { name: "Knowledge Graph", path: "/analysis/graph", icon: Network },
    ],
  },
  {
    name: "Master Data",
    children: [
      { name: "Kategori", path: "/config/category", icon: Tags },
      { name: "Merchant", path: "/config/merchant", icon: Store },
      {
        name: "Metode Pembayaran",
        path: "/config/payment-method",
        icon: Wallet,
      },
    ],
  },
];

// Profile Modal State
const isProfileModalOpen = ref(false);
const isSubmittingProfile = ref(false);
const profileErrors = ref<Record<string, string>>({});

const profileForm = ref({
  username: "",
  fullname: "",
  semester: null as number | null,
  major: "",
  residenceType: "",
  password: "",
});

const openProfileModal = () => {
  if (authStore.user) {
    profileForm.value = {
      username: authStore.user.username || "",
      fullname: authStore.user.fullname || "",
      semester: authStore.user.semester || null,
      major: authStore.user.major || "",
      residenceType: authStore.user.residenceType || "",
      password: "", // Jangan isi password lama
    };
    profileErrors.value = {};
    isProfileModalOpen.value = true;
  }
};

const submitProfileUpdate = async () => {
  profileErrors.value = {};

  // Basic validation
  if (!profileForm.value.username)
    profileErrors.value["username"] = "Username wajib diisi";
  if (!profileForm.value.fullname)
    profileErrors.value["fullname"] = "Nama lengkap wajib diisi";
  if (profileForm.value.password && profileForm.value.password.length < 6) {
    profileErrors.value["password"] = "Password baru minimal 6 karakter";
  }

  if (Object.keys(profileErrors.value).length > 0) return;

  isSubmittingProfile.value = true;
  try {
    const payload: any = {
      username: profileForm.value.username,
      fullname: profileForm.value.fullname,
      major: profileForm.value.major,
      residenceType: profileForm.value.residenceType,
    };
    if (profileForm.value.semester)
      payload.semester = Number(profileForm.value.semester);
    if (profileForm.value.password)
      payload.password = profileForm.value.password;

    await api("/auth/update-profile", {
      method: "PATCH",
      body: payload,
    });

    showSuccess("Profil berhasil diperbarui!");
    isProfileModalOpen.value = false;
    authStore.fetchUser(); // Refetch global info
  } catch (err: any) {
    if (err.response?.status === 409) {
      profileErrors.value["username"] =
        "Username sudah dipakai oleh user lain.";
      showError("Gagal menyimpan profil.");
    } else if (err.response?.status === 400 && err.response?._data?.message) {
      const msg = err.response._data.message;
      if (Array.isArray(msg)) {
        profileErrors.value["general"] = msg[0];
      } else {
        profileErrors.value["general"] = msg;
      }
      showError("Validasi gagal, cek form kembali.");
    } else {
      showError("Terjadi kesalahan pada server saat mengupdate profil.");
    }
  } finally {
    isSubmittingProfile.value = false;
    window.location.reload();
  }
};
</script>

<template>
  <aside
    class="w-64 h-screen bg-slate-950 text-white flex flex-col border-r border-slate-800 shrink-0 select-none z-30"
  >
    <!-- Brand / Title -->
    <div
      class="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-lg tracking-wider"
    >
      <span class="text-indigo-400">SFA</span>
      <span class="font-light text-slate-300 ml-2">Analyzer</span>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto py-6 px-3 space-y-6">
      <div class="space-y-1">
        <template v-for="menu in menus" :key="menu.name">
          <!-- Memiliki Sub-Menu -->
          <div v-if="menu.children" class="mb-6 mt-6">
            <h3
              class="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest cursor-default"
            >
              {{ menu.name }}
            </h3>
            <div class="space-y-1">
              <NuxtLink
                v-for="child in menu.children"
                :key="child.path"
                :to="child.path"
                class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                :class="
                  route.path === child.path || route.path.startsWith(child.path)
                    ? 'bg-indigo-600/10 text-indigo-400 backdrop-blur-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                "
              >
                <component
                  :is="child.icon"
                  class="w-5 h-5 mr-3 flex-shrink-0"
                  :class="
                    route.path === child.path
                      ? 'text-indigo-400'
                      : 'text-slate-500'
                  "
                />
                {{ child.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- Menu Tunggal Berdiri Sendiri -->
          <NuxtLink
            v-else
            :to="menu.path"
            class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            :class="
              route.path === menu.path
                ? 'bg-indigo-600/10 text-indigo-400 backdrop-blur-sm'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            "
          >
            <component
              :is="menu.icon"
              class="w-5 h-5 mr-3 flex-shrink-0"
              :class="
                route.path === menu.path ? 'text-indigo-400' : 'text-slate-500'
              "
            />
            {{ menu.name }}
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Pilihan Bawah: Logout -->
    <div class="px-3 pb-3 mt-auto">
      <button
        @click="handleLogout"
        class="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
      >
        <LogOut class="w-5 h-5 mr-3 flex-shrink-0" />
        Keluar Akun
      </button>
    </div>

    <!-- User Footer Profile Segment -->
    <div
      class="p-4 border-t border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-800/80 transition-colors"
      @click="openProfileModal"
    >
      <div
        v-if="authStore.isFetching && !authStore.user"
        class="flex items-center animate-pulse"
      >
        <div class="w-9 h-9 rounded-full bg-slate-800"></div>
        <div class="ml-3 space-y-2 flex-1">
          <div class="h-3 bg-slate-800 rounded w-3/4"></div>
          <div class="h-2 bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="authStore.user" class="flex items-center">
        <div
          class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold shadow-lg shrink-0 text-sm"
        >
          {{ authStore.user.fullname?.charAt(0).toUpperCase() }}
        </div>
        <div class="ml-3 overflow-hidden flex-1">
          <p class="text-sm font-medium text-slate-200 truncate">
            {{ authStore.user.fullname }}
          </p>
          <p class="text-xs text-slate-500 truncate">
            {{ authStore.user.major || "Data profil belum lengkap" }}
          </p>
        </div>
      </div>
    </div>

    <!-- Profile Update Modal -->
    <XFormModal
      v-model="isProfileModalOpen"
      title="Edit Profil"
      description="Perbarui informasi personalmu di bawah ini."
      :loading="isSubmittingProfile"
      @submit="submitProfileUpdate"
    >
      <div class="space-y-4">
        <!-- Error General -->
        <XInputError
          v-if="profileErrors['general']"
          :message="profileErrors['general']"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Fullname -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Nama Lengkap <span class="text-rose-500">*</span></label
            >
            <input
              v-model="profileForm.fullname"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              :class="{
                'border-rose-300 focus:ring-rose-500/20':
                  profileErrors['fullname'],
              }"
            />
            <XInputError :message="profileErrors['fullname']" />
          </div>

          <!-- Username -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Username <span class="text-rose-500">*</span></label
            >
            <input
              v-model="profileForm.username"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              :class="{
                'border-rose-300 focus:ring-rose-500/20':
                  profileErrors['username'],
              }"
            />
            <XInputError :message="profileErrors['username']" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Major -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700">Jurusan</label>
            <input
              v-model="profileForm.major"
              type="text"
              placeholder="Cth: Teknik Komputer"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          <!-- Semester -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700">Semester</label>
            <input
              v-model="profileForm.semester"
              type="number"
              placeholder="Cth: 4"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        <!-- Residence Type -->
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Tempat Tinggal</label
          >
          <select
            v-model="profileForm.residenceType"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
          >
            <option value="">Pilih Tempat Tinggal</option>
            <option value="Kos">Kos</option>
            <option value="Asrama">Asrama</option>
            <option value="Rumah">Rumah (Bersama Orang Tua)</option>
            <option value="Apartemen">Apartemen</option>
          </select>
        </div>

        <!-- Password (Optional) -->
        <div class="space-y-1.5 pt-2 border-t border-slate-100 mt-2">
          <label class="text-sm font-semibold text-slate-700"
            >Ganti Password (Opsional)</label
          >
          <input
            v-model="profileForm.password"
            type="password"
            placeholder="Kosongkan jika tidak ingin mengubah sandi"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            :class="{
              'border-rose-300 focus:ring-rose-500/20':
                profileErrors['password'],
            }"
          />
          <p class="text-xs text-slate-400 mt-1">
            Isi hanya jika kamu ingin mengganti password lamamu.
          </p>
          <XInputError :message="profileErrors['password']" />
        </div>
      </div>
    </XFormModal>
  </aside>
</template>
