import { ofetch } from "ofetch";

export const useApi = () => {
  const config = useRuntimeConfig();
  const token = useCookie("access_token");
  const refreshTokenCookie = useCookie("refresh_token");
  const { showError } = useNotification();

  // Track retry process
  let isRefreshing = false;
  let refreshSubscribers: ((token: string) => void)[] = [];

  const onRefreshed = (newAccessToken: string) => {
    refreshSubscribers.forEach((callback) => callback(newAccessToken));
    refreshSubscribers = [];
  };

  const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
  };

  const api = ofetch.create({
    baseURL: config.public.apiBase as string,
    onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        };
      }
    },
    async onResponseError({ request, response, options }) {
      const originalRequest = options;

      if (response.status === 401) {
        // Jangan loop infinite jika gagal me-refresh
        if (request.toString().includes("/auth/refresh")) {
          showError(
            "Sesi kamu telah berakhir. Silakan login kembali.",
            "Sesi Berakhir",
          );
          token.value = null;
          refreshTokenCookie.value = null;
          navigateTo("/login");
          return Promise.reject(response);
        }

        if (!refreshTokenCookie.value) {
          token.value = null;
          navigateTo("/login");
          return Promise.reject(response);
        }

        if (isRefreshing) {
          // Antre request saat refresh berjalan
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              };
              resolve(ofetch(request, originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const res = await ofetch(`${config.public.apiBase}/auth/refresh`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refreshTokenCookie.value}`,
            },
          });

          const newAccessToken = res.data.access_token;
          const newRefreshToken = res.data.refresh_token;

          // Update cookies
          token.value = newAccessToken;
          refreshTokenCookie.value = newRefreshToken;

          isRefreshing = false;
          onRefreshed(newAccessToken);

          // Repeat original request
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          return ofetch(request, originalRequest);
        } catch (error) {
          isRefreshing = false;
          token.value = null;
          refreshTokenCookie.value = null;
          showError("Sesi tidak valid berulang. Silakan login kembali.");
          navigateTo("/login");
          return Promise.reject(error);
        }
      } else {
        // Menampilkan error secara global jika tipe respon adalah error server/fatal
        const msg =
          response._data?.message || "Terjadi kesalahan pada server pembantu.";

        // Memisahkan penanganan antara validasi input vs fatal error (berdasarkan aturan backend nestjs)
        if (response.status !== 400 && response.status !== 404) {
          showError(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
      }
    },
  });

  return api;
};
