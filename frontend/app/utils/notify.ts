export const useNotification = () => {
  const state = useState('globalNotification', () => ({ show: false, title: '', message: '' }))

  const showError = (message: string, title = 'Terjadi Kesalahan') => {
    state.value = { show: true, title, message }
  }

  const showSuccess = (message: string, title = 'Berhasil') => {
    state.value = { show: true, title, message }
  }

  return { showError, showSuccess }
}
