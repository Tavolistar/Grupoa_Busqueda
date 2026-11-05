<template>
  <div class="drawer-filtros">
    <button type="button" class="abrir" :aria-expanded="abierto" @click="abierto = true">
      Filtros<span v-if="cantidad"> ({{ cantidad }})</span>
    </button>

    <div v-if="abierto" class="fondo" @click="abierto = false"></div>

    <aside class="panel" :class="{ abierto }" aria-label="Filtros">
      <div class="cabecera">
        <h2>Filtros</h2>
        <button type="button" class="cerrar" aria-label="Cerrar filtros" @click="abierto = false">✕</button>
      </div>
      <slot />
      <button type="button" class="ver" @click="abierto = false">Ver {{ total }} resultados</button>
    </aside>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

defineProps({
  cantidad: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

// Solo tiene efecto en pantallas pequeñas; en escritorio el panel siempre está visible
const abierto = ref(false)

function alPresionarTecla(e) {
  if (e.key === 'Escape') abierto.value = false
}

watch(abierto, (valor) => {
  // Evita que la página de atrás se desplace mientras el panel está abierto
  document.body.style.overflow = valor ? 'hidden' : ''
  if (valor) window.addEventListener('keydown', alPresionarTecla)
  else window.removeEventListener('keydown', alPresionarTecla)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', alPresionarTecla)
})
</script>

<style scoped>
.abrir,
.fondo,
.cabecera,
.ver {
  display: none;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 767px) {
  .abrir {
    display: inline-flex;
    align-items: center;
    width: 100%;
    justify-content: center;
  }

  .fondo {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 20;
  }

  .panel {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(85vw, 340px);
    padding: 16px;
    box-sizing: border-box;
    overflow-y: auto;
    background: var(--bg);
    box-shadow: var(--shadow);
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .panel.abierto {
    transform: translateX(0);
  }

  .cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cabecera h2 {
    margin: 0;
  }

  .cerrar {
    min-width: 44px;
  }

  .ver {
    display: block;
    width: 100%;
    margin-top: auto;
  }
}
</style>
