<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-show="modelValue"
        class="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-0"
      >
        <!-- Backdrop Blur -->
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          @click="closeModal"
        ></div>

        <!-- Dialog Box -->
        <div
          class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all"
        >
          <!-- Header -->
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-start justify-between"
          >
            <div>
              <h3 class="text-lg font-bold tracking-tight text-slate-800">
                {{ title }}
              </h3>
              <p v-if="description" class="text-sm text-slate-500 mt-1">
                {{ description }}
              </p>
            </div>
            <button
              @click="closeModal"
              class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body (Slot for Fields & XInputError) -->
          <div class="p-6 overflow-y-auto max-h-[65vh]">
            <slot />
          </div>

          <!-- Footer Actions -->
          <div
            class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3"
          >
            <Button
              variant="outline"
              type="button"
              @click="closeModal"
              :disabled="loading"
            >
              {{ cancelLabel }}
            </Button>
            <Button
              type="button"
              class="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
              @click="$emit('submit')"
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
              ></span>
              {{ submitLabel }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import { onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  submitLabel: { type: String, default: "Simpan" },
  cancelLabel: { type: String, default: "Batal" },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const closeModal = () => {
  if (!props.loading) {
    emit("update:modelValue", false);
  }
};

// Handle ESC key to close
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.modelValue) {
    closeModal();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// Body scroll lock
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95) translateY(10px);
}
</style>
