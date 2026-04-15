<script setup lang="ts">
import {
  History,
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
      { name: "Riwayat Analisis", path: "/analysis/history", icon: History },
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
  monthlyAllowance: null as number | null,
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
      monthlyAllowance: authStore.user.monthlyAllowance || null,
      password: "",
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
    if (profileForm.value.monthlyAllowance)
      payload.monthlyAllowance = Number(profileForm.value.monthlyAllowance);
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
    class="w-60 h-screen bg-slate-900 text-white flex flex-col shrink-0 select-none z-30 border-r border-slate-800/60"
  >
    <!-- Brand / Title -->
    <div class="px-5 pt-5 pb-4">
      <div class="flex items-center gap-2.5">
        <div
          class="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>
        <span class="font-bold text-white tracking-tight"
          >SFA
          <span class="text-slate-400 font-normal text-sm">Analyzer</span></span
        >
      </div>
    </div>
    <div class="mx-4 h-px bg-slate-800/80 mb-2"></div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
      <template v-for="menu in menus" :key="menu.name">
        <!-- Sub-Menu Group -->
        <div v-if="menu.children" class="pt-4">
          <p
            class="px-3 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest"
          >
            {{ menu.name }}
          </p>
          <div class="space-y-0.5">
            <NuxtLink
              v-for="child in menu.children"
              :key="child.path"
              :to="child.path"
              class="relative flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 group"
              :class="
                route.path === child.path ||
                route.path.startsWith(child.path + '/')
                  ? 'bg-indigo-500/10 text-indigo-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              "
            >
              <!-- Active indicator bar -->
              <span
                v-if="
                  route.path === child.path ||
                  route.path.startsWith(child.path + '/')
                "
                class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-400"
              />
              <component
                :is="child.icon"
                class="w-4 h-4 flex-shrink-0 transition-colors"
                :class="
                  route.path === child.path ||
                  route.path.startsWith(child.path + '/')
                    ? 'text-indigo-400'
                    : 'text-slate-500 group-hover:text-slate-300'
                "
              />
              <span class="font-medium">{{ child.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Single Menu Item -->
        <NuxtLink
          v-else
          :to="menu.path"
          class="relative flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 group mt-1"
          :class="
            route.path === menu.path
              ? 'bg-indigo-500/10 text-indigo-300'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          "
        >
          <span
            v-if="route.path === menu.path"
            class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-400"
          />
          <component
            :is="menu.icon"
            class="w-4 h-4 flex-shrink-0 transition-colors"
            :class="
              route.path === menu.path
                ? 'text-indigo-400'
                : 'text-slate-500 group-hover:text-slate-300'
            "
          />
          <span class="font-medium">{{ menu.name }}</span>
        </NuxtLink>
      </template>
    </div>

    <!-- Bottom: User + Logout -->
    <div class="border-t border-slate-800/60 pb-1">
      <!-- User Profile Button -->
      <div
        class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        @click="openProfileModal"
      >
        <div
          v-if="authStore.isFetching && !authStore.user"
          class="flex items-center gap-3 animate-pulse flex-1"
        >
          <div class="w-8 h-8 rounded-full bg-slate-700"></div>
          <div class="space-y-1.5 flex-1">
            <div class="h-2.5 bg-slate-700 rounded w-3/4"></div>
            <div class="h-2 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
        <template v-else-if="authStore.user">
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm shrink-0"
          >
            {{ authStore.user.fullname?.charAt(0).toUpperCase() }}
          </div>
          <div class="overflow-hidden flex-1">
            <p
              class="text-sm font-medium text-slate-200 truncate leading-tight"
            >
              {{ authStore.user.fullname }}
            </p>
            <p class="text-xs text-slate-500 truncate">
              {{ authStore.user.major || "Edit profil ↗" }}
            </p>
          </div>
        </template>
      </div>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-150 rounded-none"
      >
        <LogOut class="w-4 h-4 shrink-0" />
        <span class="font-medium">Keluar</span>
      </button>
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

        <!-- Monthly Allowance -->
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Uang Bulanan (Rp)</label
          >
          <input
            v-model.number="profileForm.monthlyAllowance"
            type="number"
            placeholder="Cth: 1500000"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
          />
          <p class="text-xs text-slate-400">
            Digunakan sebagai batas anggaran di Dashboard.
          </p>
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
