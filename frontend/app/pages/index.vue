<template>
  <div class="p-8 max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard Utama</h1>
        <p class="text-muted-foreground mt-1 text-lg">
          Selamat datang kembali,
          <span
            v-if="isLoading"
            class="animate-pulse bg-muted rounded w-32 h-6 inline-block align-middle ml-1"
          ></span>
          <span v-else class="font-semibold text-foreground">{{
            user?.fullname || user?.username || "Mahasiswa"
          }}</span
          >!
        </p>
      </div>
      <Button variant="outline" class="gap-2" @click="handleLogout">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Keluar
      </Button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground"
            >Uang Bulanan</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            <span
              v-if="isLoading"
              class="animate-pulse bg-muted rounded w-24 h-8 inline-block"
            ></span>
            <span v-else
              >Rp
              {{ user?.monthlyAllowance?.toLocaleString("id-ID") || "0" }}</span
            >
          </div>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground"
            >Jurusan / Semester</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold break-words">
            <span
              v-if="isLoading"
              class="animate-pulse bg-muted rounded w-32 h-8 inline-block"
            ></span>
            <span v-else
              >{{ user?.major || "-" }} / {{ user?.semester || "-" }}</span
            >
          </div>
        </CardContent>
      </Card>

      <Card class="shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground"
            >Tipe Tempat Tinggal</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            <span
              v-if="isLoading"
              class="animate-pulse bg-muted rounded w-24 h-8 inline-block"
            ></span>
            <span v-else>{{ user?.residenceType || "-" }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/services/auth";

definePageMeta({
  middleware: "auth",
});

const { fetchUser, logout } = useAuth();
const user = ref<any>(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const res = await fetchUser();
    user.value = res.data;
  } catch (error) {
    // Error ditangani interceptor
  } finally {
    isLoading.value = false;
  }
});

const handleLogout = () => {
  logout();
};
</script>
