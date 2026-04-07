export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("access_token");

  // Jika tidak ada token (belum login), redirect ke halaman login
  if (!token.value) {
    return navigateTo("/login");
  }
});
