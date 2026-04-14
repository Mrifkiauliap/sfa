import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "~/services/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<any>(null);
  const isFetching = ref(false);
  const api = useApi();

  const fetchUser = async () => {
    isFetching.value = true;
    try {
      const response = await api("/auth/me", { method: "GET" });
      user.value = response.data; // Disesuaikan dengan respon API (biasanya mengembalikan req.user langsung)
    } catch (error) {
      console.error("Failed to fetch user:", error);
      user.value = null;
    } finally {
      isFetching.value = false;
    }
  };

  const logout = () => {
    const token = useCookie("access_token");
    const refreshToken = useCookie("refresh_token");
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    navigateTo("/login");
  };

  return { user, isFetching, fetchUser, logout };
});
