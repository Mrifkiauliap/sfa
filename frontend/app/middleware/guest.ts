export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("access_token");

  // Jika ada token (sudah login), jangan boleh akses halaman login/register
  if (token.value) {
    return navigateTo("/");
  }
});
