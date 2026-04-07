import { useApi } from "./api";
// import type { LoginDto } from '~/types/auth' // akan kita anggap tipe any sementara atau dibuat

export const useAuth = () => {
  const api = useApi();
  const token = useCookie("access_token");
  const refreshTokenCookie = useCookie("refresh_token");

  const login = async (payload: any) => {
    const response = await api("/auth/login", {
      method: "POST",
      body: payload,
    });

    if (response?.data) {
      token.value = response.data.access_token;
      refreshTokenCookie.value = response.data.refresh_token;
    }

    return response;
  };

  const register = async (payload: any) => {
    const response = await api("/auth/register", {
      method: "POST",
      body: payload,
    });

    if (response?.data) {
      token.value = response.data.access_token;
      refreshTokenCookie.value = response.data.refresh_token;
    }

    return response;
  };

  const fetchUser = async () => {
    const response = await api("/auth/me", {
      method: "GET",
    });
    return response;
  };

  const logout = () => {
    token.value = null;
    refreshTokenCookie.value = null;
    navigateTo("/login");
  };

  return { login, register, fetchUser, logout };
};
