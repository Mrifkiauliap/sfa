<template>
  <div class="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          Visualisasi Knowledge Graph
        </h2>
        <p class="text-slate-500">
          Representasi network sebaran datamu dari Apache Fuseki.
        </p>
      </div>
      <Button
        @click="loadGraph"
        :disabled="isLoading"
        class="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        Singkronkan Graph
      </Button>
    </div>

    <!-- Full canvas area -->
    <div
      class="flex-1 border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden relative shadow-inner"
    >
      <!-- Vis Network Container -->
      <div
        ref="networkContainer"
        class="absolute inset-0 z-10 w-full h-full"
      ></div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm"
      >
        <span
          class="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"
        ></span>
        <h3 class="font-bold text-slate-800">Menarik Semantic Triples...</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
import { onMounted, ref, shallowRef } from "vue";
import { useApi } from "~/services/api";
import { useNotification } from "~/utils/notify";

// Use standalone build from vis-network
// Note: We use raw import on client side because vis-network relies on window/document.
import { Network as VisNetwork } from "vis-network/standalone";

definePageMeta({
  middleware: "auth",
});

const api = useApi();
const { showSuccess, showError } = useNotification();

const networkContainer = ref<HTMLElement | null>(null);
const networkInstance = shallowRef<any>(null);
const isLoading = ref(false);

const drawGraph = (nodes: any[], edges: any[]) => {
  if (!networkContainer.value) return;

  const data = { nodes, edges };
  const options = {
    nodes: {
      shape: "dot",
      size: 16,
      font: {
        size: 12,
        face: "Inter, sans-serif",
      },
      borderWidth: 2,
    },
    edges: {
      width: 1.5,
      color: { inherit: "from" },
      smooth: {
        type: "continuous",
      },
      font: {
        size: 10,
        align: "middle",
      },
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 },
      },
    },
    physics: {
      barnesHut: {
        gravitationalConstant: -15000,
        centralGravity: 0.1,
        springLength: 300, // Panjangkan jarak antar node agar tidak menumpuk berantakan
        springConstant: 0.05,
        damping: 0.09,
      },
      stabilization: {
        enabled: true,
        iterations: 300, // Hitung sebaran node secara tersembunyi jauh lebih matang
        updateInterval: 50,
        fit: true,
      },
    },
    groups: {
      transaction: { color: { background: "#f87171", border: "#ef4444" } }, // Red
      user: {
        color: { background: "#60a5fa", border: "#3b82f6" },
        shape: "diamond",
      }, // Blue
      category: { color: { background: "#34d399", border: "#10b981" } }, // Emerald
      merchant: {
        color: { background: "#facc15", border: "#eab308" },
        shape: "triangle",
        size: 20,
      }, // Yellow
      payment: { color: { background: "#a78bfa", border: "#8b5cf6" } }, // Purple
      literal: {
        color: { background: "#f1f5f9", border: "#cbd5e1" },
        shape: "box",
        font: { size: 10, color: "#475569" },
      }, // Slate box
      default: { color: { background: "#94a3b8", border: "#64748b" } },
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: true,
      dragView: true,
    },
  };

  if (networkInstance.value) {
    networkInstance.value.destroy();
  }

  networkInstance.value = new VisNetwork(networkContainer.value, data, options);

  // Biar langsung fit saat render dan matikan physics agar sangat ringan di CPU
  networkInstance.value.once("stabilizationIterationsDone", function () {
    networkInstance.value?.fit();
    // Mematikan pergerakan physics setelah posisi sempurna, sehingga kalau node ditarik tidak goyang semua
    networkInstance.value?.setOptions({ physics: { enabled: false } });
  });
};

const loadGraph = async () => {
  isLoading.value = true;
  try {
    const res = await api("/rdf/graph-data", { method: "GET" });
    if (res?.data && res.data.nodes && res.data.edges) {
      drawGraph(res.data.nodes, res.data.edges);
      showSuccess(
        `Visualisasi berhasil! (${res.data.nodes.length} Nodes & ${res.data.edges.length} Edges)`,
      );
    } else {
      showError("Format RDF JSON tidak dikenali.");
    }
  } catch (error) {
    showError("Gagal terhubung ke Apache Fuseki Graph DB.");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadGraph();
});
</script>
