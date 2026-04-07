<template>
  <div
    class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4"
  >
    <div class="w-full max-w-sm">
      <div class="flex justify-center mb-8">
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
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>
      </div>

      <Card
        class="border-zinc-200 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:shadow-none bg-white/80 backdrop-blur-xl"
      >
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl font-bold text-center tracking-tight"
            >Selamat Datang</CardTitle
          >
          <CardDescription class="text-center">
            Masuk ke akun SFA kamu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <Label for="username">Username</Label>
              <Input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="Masukkan username"
                :class="{
                  'border-destructive focus-visible:ring-destructive':
                    errors.username,
                }"
                required
              />
              <XInputError :message="errors.username" />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="password">Password</Label>
              </div>
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

            <!-- Pesan error khusus form non-validation -->
            <XInputError :message="errors.general" class="text-center py-2" />

            <Button
              type="submit"
              class="w-full font-medium"
              :disabled="isLoading"
            >
              <span v-if="isLoading"> <Spinner /> Memproses...</span>
              <span v-else>Masuk</span>
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex flex-col space-y-4">
          <div class="text-sm text-center text-muted-foreground">
            Belum punya akun?
            <NuxtLink
              href="/register"
              class="text-primary font-medium hover:underline"
            >
              Daftar Sekarang
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
});

const { login } = useAuth();

const form = ref({
  username: "",
  password: "",
});

const errors = ref({
  username: "",
  password: "",
  general: "",
});

const isLoading = ref(false);

const handleLogin = async () => {
  // Reset
  errors.value = { username: "", password: "", general: "" };
  isLoading.value = true;

  try {
    await login(form.value);

    // Redirect ke dashboard ketika berhasil
    navigateTo("/");
  } catch (error: any) {
    // Penanganan Error Validation NestJS (HTTP 400 Bad Request)
    if (error.response?.status === 400 && error.response?._data?.message) {
      const messages = error.response._data.message;
      if (Array.isArray(messages)) {
        messages.forEach((msg: string) => {
          if (msg.toLowerCase().includes("username"))
            errors.value.username = msg;
          else if (msg.toLowerCase().includes("password"))
            errors.value.password = msg;
          else errors.value.general = msg;
        });
      } else {
        errors.value.general = messages;
      }
    }
    // HTTP 401 Unauthorized
    else if (error.response?.status === 401) {
      errors.value.general =
        error.response._data?.message || "Username atau password salah";
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
