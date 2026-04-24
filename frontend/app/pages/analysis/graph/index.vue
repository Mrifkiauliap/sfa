<template>
  <div class="flex flex-col h-[calc(100vh-6rem)] gap-0 overflow-hidden">
    <!-- Header Bar -->
    <div class="flex items-center justify-between px-1 pb-4 shrink-0">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">
          Financial Knowledge Graph
        </h2>
        <p class="text-slate-500 text-sm">
          Visualisasi interaktif ontologi &amp; pola Apriori dari Semantic Web.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          @click="fitGraph"
          variant="outline"
          class="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50"
          :disabled="!networkInstance"
        >
          <Maximize2 class="w-4 h-4" />
          Fit
        </Button>
        <Button
          @click="resetSelection"
          variant="outline"
          class="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50"
          :disabled="!selectedNode"
        >
          <RotateCcw class="w-4 h-4" />
          Reset
        </Button>
        <Button
          @click="loadGraph"
          :disabled="isLoading"
          class="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          Sinkronkan
        </Button>
      </div>
    </div>

    <!-- Main Area: Sidebar + Canvas -->
    <div class="flex flex-1 gap-4 min-h-0">
      <!-- Sidebar Control Panel -->
      <div class="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <!-- Performance Mode Toggle -->
        <div class="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <p
            class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
          >
            Mode Tampilan
          </p>
          <div class="space-y-2">
            <label
              class="flex items-center justify-between cursor-pointer group"
            >
              <div>
                <p class="text-sm font-semibold text-slate-700">
                  Sembunyikan Literal
                </p>
                <p class="text-[11px] text-slate-400">
                  Hapus node tanggal &amp; nominal (lebih ringan)
                </p>
              </div>
              <button
                @click="
                  hideLiterals = !hideLiterals;
                  if (rawNodes.length > 0) applyFiltersAndDraw();
                "
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :class="hideLiterals ? 'bg-blue-500' : 'bg-slate-300'"
              >
                <span
                  class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                  :class="hideLiterals ? 'translate-x-5' : 'translate-x-0.5'"
                />
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="text-sm font-semibold text-slate-700">
                  Sembunyikan Transaksi
                </p>
                <p class="text-[11px] text-slate-400">
                  Fokus ke Kategori &amp; Merchant saja
                </p>
              </div>
              <button
                @click="
                  hideTransactions = !hideTransactions;
                  if (rawNodes.length > 0) applyFiltersAndDraw();
                "
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :class="hideTransactions ? 'bg-blue-500' : 'bg-slate-300'"
              >
                <span
                  class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                  :class="
                    hideTransactions ? 'translate-x-5' : 'translate-x-0.5'
                  "
                />
              </button>
            </label>
          </div>
        </div>

        <!-- Apriori Layer Toggle Card -->
        <div
          class="rounded-2xl border p-4 shadow-sm transition-all duration-300"
          :class="
            aprioriLayerActive
              ? 'bg-amber-50 border-amber-300 shadow-amber-100'
              : 'bg-white border-slate-200'
          "
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                :class="
                  aprioriLayerActive
                    ? 'bg-amber-200 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                "
              >
                <Wand2 class="w-4 h-4" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800">Lapisan Apriori</p>
                <p class="text-xs text-slate-500">Tampilkan asosiasi pola</p>
              </div>
            </div>
            <button
              @click="toggleAprioriLayer"
              :disabled="isLoadingOverlay"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
              :class="aprioriLayerActive ? 'bg-amber-500' : 'bg-slate-300'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200"
                :class="aprioriLayerActive ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div
            v-if="aprioriLayerActive && overlayMeta"
            class="mt-3 pt-3 border-t border-amber-200 space-y-1"
          >
            <div class="flex justify-between text-xs">
              <span class="text-amber-700">Rules tersedia:</span>
              <span class="font-bold text-amber-800">{{
                overlayMeta.totalRules
              }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-amber-700">Berhasil dioverlay:</span>
              <span class="font-bold text-amber-800">{{
                overlayMeta.resolvedEdges ?? graphStats.aprioriEdges
              }}</span>
            </div>
            <p class="text-[10px] text-amber-600/70 mt-1">
              ✨ Garis emas putus-putus = asosiasi kuat. Makin tebal =
              confidence makin tinggi.
            </p>
          </div>

          <div
            v-if="
              aprioriLayerActive &&
              overlayMeta &&
              overlayMeta.resolvedEdges === 0
            "
            class="mt-2"
          >
            <p class="text-xs text-amber-700 bg-amber-100 rounded-lg p-2">
              ⚠️ Rules tidak bisa dioverlay ke graph. Pastikan data Fuseki sudah
              disinkronkan dan Apriori sudah dijalankan.
            </p>
          </div>

          <div
            v-if="aprioriLayerActive && !overlayMeta && !isLoadingOverlay"
            class="mt-2"
          >
            <p class="text-xs text-amber-700 bg-amber-100 rounded-lg p-2">
              Belum ada hasil Apriori. Jalankan analisis dulu di halaman Pola
              Apriori.
            </p>
          </div>

          <div v-if="isLoadingOverlay" class="mt-2 flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin"
            />
            <span class="text-xs text-amber-600">Memuat data asosiasi...</span>
          </div>
        </div>

        <!-- Graph Stats Card -->
        <div class="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <p
            class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
          >
            Statistik Graf
          </p>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span class="text-sm text-slate-600">Node (Total)</span>
              </div>
              <span class="text-sm font-bold text-slate-800">{{
                rawNodes.length
              }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span class="text-sm text-slate-600">Node (Dirender)</span>
              </div>
              <span class="text-sm font-bold text-slate-800">{{
                graphStats.nodes
              }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span class="text-sm text-slate-600">Edges</span>
              </div>
              <span class="text-sm font-bold text-slate-800">{{
                graphStats.edges
              }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span class="text-sm text-slate-600">Apriori Edges</span>
              </div>
              <span class="text-sm font-bold text-slate-800">{{
                graphStats.aprioriEdges
              }}</span>
            </div>
          </div>
        </div>

        <!-- Stabilization Progress -->
        <div
          v-if="isStabilizing"
          class="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 shadow-sm"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              class="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0"
            />
            <p class="text-sm font-bold text-indigo-700">
              Menghitung Layout...
            </p>
          </div>
          <div class="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
            <div
              class="h-1.5 bg-indigo-500 rounded-full transition-all duration-300"
              :style="{ width: `${stabilizationProgress}%` }"
            />
          </div>
          <p class="text-[11px] text-indigo-500 mt-1">
            {{ stabilizationProgress.toFixed(0) }}% selesai
          </p>
        </div>

        <!-- Legend Card -->
        <div class="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <p
            class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
          >
            Legenda
          </p>
          <div class="space-y-2">
            <div
              v-for="l in legend"
              :key="l.label"
              class="flex items-center gap-2.5"
            >
              <div
                class="w-5 h-5 rounded-full border-2 shrink-0"
                :style="{ backgroundColor: l.bg, borderColor: l.border }"
              />
              <span class="text-sm text-slate-700">{{ l.label }}</span>
            </div>
            <div
              class="flex items-center gap-2.5 mt-1 pt-2 border-t border-slate-100"
            >
              <div
                class="w-5 h-0 border-t-2 border-dashed border-amber-400 shrink-0"
              />
              <span class="text-xs text-amber-700 font-medium"
                >Asosiasi Apriori</span
              >
            </div>
          </div>
        </div>

        <!-- Node Info Card -->
        <Transition name="slide-up">
          <div
            v-if="selectedNode"
            class="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 shadow-sm"
          >
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-bold text-indigo-600 uppercase tracking-wider"
              >
                Node Dipilih
              </p>
              <button
                @click="resetSelection"
                class="text-indigo-400 hover:text-indigo-600"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <span
                  class="text-xs text-indigo-500 font-semibold w-12 shrink-0 mt-0.5"
                  >Label</span
                >
                <span class="text-sm text-indigo-900 font-bold break-all">{{
                  selectedNode.label
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs text-indigo-500 font-semibold w-12 shrink-0"
                  >Tipe</span
                >
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                  :class="groupBadgeClass(selectedNode.group)"
                >
                  {{ selectedNode.group }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs text-indigo-500 font-semibold w-12 shrink-0"
                  >Edges</span
                >
                <span class="text-sm text-indigo-900 font-bold">{{
                  selectedNodeEdgeCount
                }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Canvas Area -->
      <div
        class="flex-1 border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden relative shadow-inner min-h-0"
      >
        <div
          ref="networkContainer"
          class="absolute inset-0 z-10 w-full h-full"
        />

        <div
          v-if="isLoading"
          class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm"
        >
          <span
            class="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"
          />
          <h3 class="font-bold text-slate-800">Menarik Semantic Triples...</h3>
          <p class="text-sm text-slate-500 mt-1">Terhubung ke Apache Fuseki</p>
        </div>

        <div
          v-if="!isLoading && rawNodes.length === 0"
          class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
        >
          <div
            class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center"
          >
            <Network class="w-8 h-8 text-blue-300" />
          </div>
          <p class="font-bold text-slate-700">Graph Kosong</p>
          <p class="text-sm text-slate-400 text-center max-w-xs">
            Tekan tombol "Sinkronkan" untuk memuat data dari Apache Fuseki.
          </p>
        </div>

        <div
          v-if="
            !isLoading &&
            graphStats.nodes > 0 &&
            !selectedNode &&
            !isStabilizing
          "
          class="absolute bottom-4 right-4 z-20 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 shadow-sm pointer-events-none"
        >
          💡 Klik node untuk fokus &amp; lihat koneksinya
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Maximize2,
  Network,
  RefreshCw,
  RotateCcw,
  Wand2,
  X,
} from "lucide-vue-next";
import { Network as VisNetwork } from "vis-network/standalone";
import { computed, onMounted, ref, shallowRef } from "vue";
import { useApi } from "~/services/api";
import { useNotification } from "~/utils/notify";

definePageMeta({ middleware: "auth" });

const api = useApi();
const { showSuccess, showError } = useNotification();

// --- State ---
const networkContainer = ref<HTMLElement | null>(null);
const networkInstance = shallowRef<any>(null);
const isLoading = ref(false);
const isLoadingOverlay = ref(false);
const isStabilizing = ref(false);
const stabilizationProgress = ref(0);

const aprioriLayerActive = ref(false);
const hideLiterals = ref(true); // Default: literal disembunyikan (lebih ringan)
const hideTransactions = ref(false);

const rawNodes = ref<any[]>([]);
const rawEdges = ref<any[]>([]);
const aprioriOverlayEdges = ref<any[]>([]);
const overlayMeta = ref<any>(null);

const selectedNode = ref<any>(null);
const selectedNodeEdgeCount = ref(0);

// --- Computed Stats ---
const filteredNodes = computed(() => {
  return rawNodes.value.filter((n: any) => {
    if (hideLiterals.value && n.group === "literal") return false;
    if (hideTransactions.value && n.group === "transaction") return false;
    return true;
  });
});

const filteredNodeIds = computed(
  () => new Set(filteredNodes.value.map((n: any) => n.id)),
);

const filteredEdges = computed(() => {
  return rawEdges.value.filter((e: any) => {
    return filteredNodeIds.value.has(e.from) && filteredNodeIds.value.has(e.to);
  });
});

const graphStats = computed(() => ({
  nodes: filteredNodes.value.length,
  edges: filteredEdges.value.length,
  aprioriEdges: aprioriLayerActive.value ? aprioriOverlayEdges.value.length : 0,
}));

// --- Legend ---
const legend = [
  { label: "Mahasiswa (User)", bg: "#60a5fa", border: "#3b82f6" },
  { label: "Transaksi", bg: "#f87171", border: "#ef4444" },
  { label: "Kategori", bg: "#34d399", border: "#10b981" },
  { label: "Merchant / Tempat", bg: "#facc15", border: "#eab308" },
  { label: "Metode Bayar", bg: "#a78bfa", border: "#8b5cf6" },
  { label: "Data Literal", bg: "#f1f5f9", border: "#cbd5e1" },
];

const groupBadgeClass = (group: string) => {
  const map: Record<string, string> = {
    user: "bg-blue-100 text-blue-700",
    transaction: "bg-red-100 text-red-700",
    category: "bg-emerald-100 text-emerald-700",
    merchant: "bg-yellow-100 text-yellow-700",
    payment: "bg-purple-100 text-purple-700",
    literal: "bg-slate-100 text-slate-600",
    default: "bg-gray-100 text-gray-600",
  };
  return map[group] ?? map.default;
};

// --- Build Optimized vis-network Options ---
const buildOptions = (nodeCount: number) => {
  // Turunkan iterasi berdasarkan jumlah node agar tidak patah-patah
  const iterations = nodeCount < 100 ? 200 : nodeCount < 300 ? 100 : 50;
  const gravitationalConstant = nodeCount < 200 ? -12000 : -6000;
  const springLength = nodeCount < 200 ? 250 : 150;

  return {
    nodes: {
      shape: "dot",
      size: 14,
      font: { size: 11, face: "Inter, sans-serif" },
      borderWidth: 2,
      // Shadow hanya aktif saat node kecil (hemat GPU)
      shadow: nodeCount < 200,
    },
    edges: {
      width: 1.2,
      color: { inherit: "from", opacity: 0.7 },
      smooth: nodeCount < 300 ? { type: "continuous" } : { type: "none" }, // Matikan kurva di graph besar → jauh lebih cepat
      font: { size: 9, align: "middle" },
      arrows: { to: { enabled: true, scaleFactor: 0.4 } },
    },
    physics: {
      enabled: true,
      solver: "barnesHut" as const,
      barnesHut: {
        gravitationalConstant,
        centralGravity: 0.15,
        springLength,
        springConstant: 0.04,
        damping: 0.12,
        avoidOverlap: 0.1,
      },
      stabilization: {
        enabled: true,
        iterations,
        updateInterval: 30,
        fit: true,
        onlyDynamicEdges: false,
      },
      maxVelocity: 50,
      minVelocity: 2, // Stop physics lebih cepat saat sudah cukup stabil
      timestep: 0.5,
    },
    groups: {
      transaction: { color: { background: "#f87171", border: "#ef4444" } },
      user: {
        color: { background: "#60a5fa", border: "#3b82f6" },
        shape: "diamond",
      },
      category: { color: { background: "#34d399", border: "#10b981" } },
      merchant: {
        color: { background: "#facc15", border: "#eab308" },
        shape: "triangle",
        size: 18,
      },
      payment: { color: { background: "#a78bfa", border: "#8b5cf6" } },
      literal: {
        color: { background: "#f1f5f9", border: "#cbd5e1" },
        shape: "box",
        font: { size: 9, color: "#94a3b8" },
      },
      default: { color: { background: "#94a3b8", border: "#64748b" } },
    },
    interaction: {
      hover: true,
      tooltipDelay: 300,
      zoomView: true,
      dragView: true,
      // Matikan hide-edges-on-drag hanya jika node sedikit
      hideEdgesOnDrag: nodeCount > 300,
      hideNodesOnDrag: false,
    },
    // Render optimization
    rendering: {
      hideEdgesOnDrag: nodeCount > 300,
    },
  };
};

// --- Draw Graph (accepts pre-filtered nodes & edges) ---
const drawGraph = (nodes: any[], edges: any[]) => {
  if (!networkContainer.value) return;

  const aprioriEdges = aprioriLayerActive.value ? buildAprioriEdges(nodes) : [];
  const allEdges = [...edges, ...aprioriEdges];

  if (networkInstance.value) {
    networkInstance.value.destroy();
    networkInstance.value = null;
  }

  isStabilizing.value = true;
  stabilizationProgress.value = 0;

  const net = new VisNetwork(
    networkContainer.value,
    { nodes, edges: allEdges },
    buildOptions(nodes.length),
  );
  networkInstance.value = net;

  // Progress bar saat stabilisasi
  net.on("stabilizationProgress", (params: any) => {
    stabilizationProgress.value = (params.iterations / params.total) * 100;
  });

  net.once("stabilizationIterationsDone", () => {
    stabilizationProgress.value = 100;
    isStabilizing.value = false;
    net.fit({ animation: { duration: 500, easingFunction: "easeInOutQuad" } });
    // Matikan physics sepenuhnya agar smooth permanen
    net.setOptions({ physics: { enabled: false } });
  });

  // Klik node → Ego-Network
  net.on("click", (params: any) => {
    if (params.nodes.length > 0) {
      highlightEgoNetwork(params.nodes[0], nodes);
    } else {
      resetHighlight(nodes);
    }
  });
};

// --- Apply Filters and Redraw ---
const applyFiltersAndDraw = () => {
  selectedNode.value = null;
  drawGraph(filteredNodes.value, filteredEdges.value);
};

// --- Build Apriori Overlay Edges ---
const buildAprioriEdges = (activeNodes: any[]) => {
  // Buat Set nodeId yang aktif di canvas (sudah terfilter)
  const activeNodeIds = new Set(activeNodes.map((n: any) => n.id));

  return aprioriOverlayEdges.value
    .map((rule: any) => {
      // Gunakan fromNodeId & toNodeId dari backend (sudah berupa URI vis-network)
      const fromId = rule.fromNodeId;
      const toId = rule.toNodeId;

      // Hanya render jika kedua node ada di canvas saat ini
      if (
        !fromId ||
        !toId ||
        !activeNodeIds.has(fromId) ||
        !activeNodeIds.has(toId)
      ) {
        return null;
      }

      const thickness = Math.max(2, Math.min(8, rule.confidence / 15));

      return {
        id: rule.id,
        from: fromId,
        to: toId,
        label: `Conf: ${rule.confidence}%`,
        dashes: [8, 4], // panjang putus-putus yang jelas
        width: thickness,
        color: { color: "#f59e0b", highlight: "#d97706", opacity: 1.0 },
        font: {
          size: 11,
          color: "#92400e",
          background: "#fef3c7",
          strokeWidth: 0,
          bold: true,
        },
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        smooth: { type: "curvedCW", roundness: 0.35 },
      };
    })
    .filter(Boolean);
};

// --- Ego-Network Highlight ---
const highlightEgoNetwork = (nodeId: string, activeNodes: any[]) => {
  if (!networkInstance.value) return;

  const connectedEdges = networkInstance.value.getConnectedEdges(
    nodeId,
  ) as string[];
  const connectedNodes = networkInstance.value.getConnectedNodes(
    nodeId,
  ) as string[];

  const nodeData = activeNodes.find((n: any) => n.id === nodeId);
  selectedNode.value = nodeData ?? { label: nodeId, group: "default" };
  selectedNodeEdgeCount.value = connectedEdges.length;

  const nodeUpdates = activeNodes.map((n: any) => ({
    id: n.id,
    opacity: connectedNodes.includes(n.id) || n.id === nodeId ? 1.0 : 0.08,
    size: n.id === nodeId ? 26 : 14,
    borderWidth: n.id === nodeId ? 4 : 2,
  }));

  networkInstance.value.body.data.nodes.update(nodeUpdates);
  networkInstance.value.focus(nodeId, {
    animation: { duration: 600, easingFunction: "easeInOutQuad" },
    scale: 1.4,
  });
};

// --- Reset Highlight ---
const resetHighlight = (activeNodes: any[]) => {
  selectedNode.value = null;
  selectedNodeEdgeCount.value = 0;
  if (networkInstance.value) {
    const nodeUpdates = activeNodes.map((n: any) => ({
      id: n.id,
      opacity: 1,
      size: 14,
      borderWidth: 2,
    }));
    networkInstance.value.body.data.nodes.update(nodeUpdates);
    networkInstance.value.fit({ animation: { duration: 400 } });
  }
};

const resetSelection = () => resetHighlight(filteredNodes.value);
const fitGraph = () =>
  networkInstance.value?.fit({ animation: { duration: 500 } });

// --- Load Graph from Fuseki ---
const loadGraph = async () => {
  isLoading.value = true;
  selectedNode.value = null;
  try {
    const res = await api("/rdf/graph-data", { method: "GET" });
    if (res?.data?.nodes && res?.data?.edges) {
      rawNodes.value = res.data.nodes;
      rawEdges.value = res.data.edges;
      applyFiltersAndDraw();
      showSuccess(
        `${res.data.nodes.length} Nodes & ${res.data.edges.length} Edges dimuat. Dirender: ${filteredNodes.value.length} nodes.`,
      );
    } else {
      showError("Format data RDF dari Fuseki tidak dikenali.");
    }
  } catch {
    showError("Gagal terhubung ke Apache Fuseki Graph DB.");
  } finally {
    isLoading.value = false;
  }
};

// --- Toggle Apriori Layer ---
const toggleAprioriLayer = async () => {
  aprioriLayerActive.value = !aprioriLayerActive.value;

  if (aprioriLayerActive.value && aprioriOverlayEdges.value.length === 0) {
    isLoadingOverlay.value = true;
    try {
      const res = await api("/analysis/apriori/graph-overlay", {
        method: "GET",
      });
      const d = res?.data;
      if (d) {
        aprioriOverlayEdges.value = d.overlayEdges ?? [];
        overlayMeta.value = d.meta ?? null;
      }
    } catch {
      showError("Gagal memuat data asosiasi Apriori.");
      aprioriLayerActive.value = false;
      return;
    } finally {
      isLoadingOverlay.value = false;
    }
  }

  if (rawNodes.value.length > 0) {
    applyFiltersAndDraw();
  }
};

onMounted(() => {
  loadGraph();
});
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
