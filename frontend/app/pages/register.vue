<template>
  <div
    class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 py-8"
  >
    <div class="w-full max-w-md">
      <div class="flex justify-center mb-6">
        <div
          class="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-primary-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
      </div>

      <Card
        class="border-zinc-200 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:shadow-none bg-white/80 backdrop-blur-xl"
      >
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl font-bold text-center tracking-tight"
            >Buat Akun Baru</CardTitle
          >
          <CardDescription class="text-center">
            Lengkapi data diri kamu di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-2">
              <Label for="fullname">Nama Lengkap</Label>
              <Input
                id="fullname"
                v-model="form.fullname"
                type="text"
                placeholder="Mis. John Doe"
                :class="{
                  'border-destructive focus-visible:ring-destructive':
                    errors.fullname,
                }"
                required
              />
              <XInputError :message="errors.fullname" />
            </div>

            <div class="space-y-2">
              <Label for="username">Username</Label>
              <Input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="Mis. johny123"
                :class="{
                  'border-destructive focus-visible:ring-destructive':
                    errors.username,
                }"
                required
              />
              <XInputError :message="errors.username" />
            </div>

            <div class="space-y-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                :class="{
                  'border-destructive focus-visible:ring-destructive':
                    errors.password,
                }"
                required
              />
              <XInputError :message="errors.password" />
            </div>

            <!-- Optional Fields Section -->
            <div class="pt-4 pb-2">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <span
                    class="w-full border-t border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                  <span
                    class="bg-background px-2 text-muted-foreground w-max flex items-center gap-1 cursor-pointer"
                    @click="showOptional = !showOptional"
                  >
                    Data Opsional (Klik)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      :class="{ 'rotate-180': showOptional }"
                      class="transition-transform"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            <div
              v-show="showOptional"
              class="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200"
            >
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="semester">Semester</Label>
                  <Input
                    id="semester"
                    v-model.number="form.semester"
                    type="number"
                    placeholder="Contoh: 1"
                    :class="{
                      'border-destructive focus-visible:ring-destructive':
                        errors.semester,
                    }"
                  />
                  <XInputError :message="errors.semester" />
                </div>
                <div class="space-y-2">
                  <Label for="major">Jurusan</Label>
                  <Input
                    id="major"
                    v-model="form.major"
                    type="text"
                    placeholder="Sistem Informasi"
                    :class="{
                      'border-destructive focus-visible:ring-destructive':
                        errors.major,
                    }"
                  />
                  <XInputError :message="errors.major" />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="monthlyAllowance">Uang Bulanan (Rp)</Label>
                <Input
                  id="monthlyAllowance"
                  v-model.number="form.monthlyAllowance"
                  type="number"
                  placeholder="Mis. 1500000"
                  :class="{
                    'border-destructive focus-visible:ring-destructive':
                      errors.monthlyAllowance,
                  }"
                />
                <XInputError :message="errors.monthlyAllowance" />
              </div>

              <div class="space-y-2">
                <Label for="residenceType">Tipe Tempat Tinggal</Label>
                <select
                  id="residenceType"
                  v-model="form.residenceType"
                  class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  :class="{
                    'border-destructive focus-visible:ring-destructive':
                      errors.residenceType,
                  }"
                >
                  <option value="" disabled selected>
                    Pilih salah satu...
                  </option>
                  <option value="Kos">Kos</option>
                  <option value="Rumah">Rumah Orang Tua</option>
                  <option value="Asrama">Asrama / Kontrakan</option>
                </select>
                <XInputError :message="errors.residenceType" />
              </div>
            </div>

            <XInputError :message="errors.general" class="text-center py-2" />

            <Button
              type="submit"
              class="w-full font-medium"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="flex items-center justify-center gap-2">
                <Spinner class="w-4 h-4 animate-spin" /> Mendaftar...
              </span>
              <span v-else>Daftar</span>
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex flex-col space-y-4">
          <div class="text-sm text-center text-muted-foreground">
            Sudah punya akun?
            <NuxtLink
              href="/login"
              class="text-primary font-medium hover:underline"
            >
              Masuk di sini
            </NuxtLink>
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "@/services/auth";

definePageMeta({
  middleware: "guest",
  layout: false,
});

const { register } = useAuth();

const showOptional = ref(false);

const form = ref({
  fullname: "",
  username: "",
  password: "",
  semester: undefined as number | undefined,
  major: "",
  monthlyAllowance: undefined as number | undefined,
  residenceType: "",
});

// Initialize errors based on keys inside form
const errors = ref<Record<string, string>>({
  fullname: "",
  username: "",
  password: "",
  semester: "",
  major: "",
  monthlyAllowance: "",
  residenceType: "",
  general: "",
});

const isLoading = ref(false);

const handleRegister = async () => {
  // Reset
  Object.keys(errors.value).forEach((key) => (errors.value[key] = ""));
  isLoading.value = true;

  // Membersihkan optional fields yg empty string saat tidak disubmit
  const submitData = { ...form.value };
  if (!submitData.residenceType) submitData.residenceType = undefined as any;
  if (!submitData.major) submitData.major = undefined as any;

  try {
    await register(submitData);
    // Redirect ke dashboard ketika berhasil register & otomatis login
    navigateTo("/");
  } catch (error: any) {
    // 409 Conflict - Username Used
    if (error.response?.status === 409) {
      errors.value.username =
        error.response._data.message || "Username sudah digunakan";
    }
    // Penanganan Error Validation NestJS (HTTP 400 Bad Request)
    else if (error.response?.status === 400 && error.response?._data?.message) {
      const messages = error.response._data.message;
      if (Array.isArray(messages)) {
        messages.forEach((msg: string) => {
          const lMsg = msg.toLowerCase();
          if (lMsg.includes("username")) errors.value.username = msg;
          else if (lMsg.includes("password")) errors.value.password = msg;
          else if (lMsg.includes("fullname")) errors.value.fullname = msg;
          else if (lMsg.includes("semester")) {
            errors.value.semester = msg;
            showOptional.value = true;
          } else if (lMsg.includes("major")) {
            errors.value.major = msg;
            showOptional.value = true;
          } else if (lMsg.includes("allowance")) {
            errors.value.monthlyAllowance = msg;
            showOptional.value = true;
          } else if (lMsg.includes("residence")) {
            errors.value.residenceType = msg;
            showOptional.value = true;
          } else errors.value.general = msg;
        });
      } else {
        errors.value.general = messages;
      }
    }
    // Fallback Error Umum
    else {
      errors.value.general = "Terjadi kesalahan sistem, silakan coba lagi.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
