<template>
  <div class="lean-playground-wrapper" :style="{ height: height }">
    <!-- 読み込み中のプレースホルダー -->
    <div v-if="!isLoaded" class="lean-loading-placeholder">
      <span class="lean-loading-text">Loading Lean 4 Playground...</span>
    </div>

    <!-- iframe 本体 -->
    <iframe
      :src="playgroundUrl"
      width="100%"
      height="100%"
      frameborder="0"
      sandbox="allow-scripts allow-same-origin allow-popups"
      allow="clipboard-write"
      loading="lazy"
      class="lean-playground"
      :class="{ 'iframe-hidden': !isLoaded }"
      @load="handleIframeLoad"
    ></iframe>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import LZString from 'lz-string'

const props = defineProps({
  height: {
    type: String,
    default: '400px'
  },
  code: {
    type: String,
    default: ''
  }
})

const isLoaded = ref(false)

// Lean playground 的查询参数配置。抽离出来方便集中修改，
// 键为参数名，值为参数值（会自动做 URI 编码）。
const playgroundQueryParams = {
  abbreviationCharacter: '\\',
  acceptSuggestionOnEnter: 'false',
  showGoalNames: 'true',
  showExpectedType: 'true',
  compress: 'true',
  theme: 'light',
  wordWrap: 'true',
}

const playgroundUrl = computed(() => {
  const baseUrl = 'https://live.lean-lang.org'
  // 保留原始 ASCII 字符与换行（不做 UTF-8 字节化、不做 percent-encoding），
  // 直接把源字符串交给 LZString 压缩，压缩产物再走 URI 友好编码。
  const cleanedCode = props.code ? props.code.trim() : ''
  // if (typeof console !== 'undefined') {
  //   console.log('[LeanPlayground] code before LZ compress:\n' + cleanedCode)
  // }
  const compressedCode = LZString.compressToEncodedURIComponent(cleanedCode)
  // 再对压缩产物做一次 URI 编码，把 `+` `-` `$` 等潜在特殊字符转成 %XX 序列，
  // 确保 fragment 在任何浏览器 / 代理环境下都能原样送达。
  // 注意：encodeURIComponent 不会编码 `-`（unreserved），这里手动把 `-` 转为 %2F。
  const urlSafeCode = encodeURIComponent(compressedCode).replace(/-/g, '%2F')
  const queryString = Object.entries(playgroundQueryParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  return `${baseUrl}/?${queryString}#codez=${urlSafeCode}`
})

// --- 核心防滚动逻辑状态管理 ---
// 修正：在外部只做声明，不访问 window 对象，防止 VitePress 打包阶段报错 (SSR Safe)
let savedY = 0
let reverting = false
let observer = null

const isIframeActive = () => {
  if (typeof document === 'undefined') return false
  const el = document.activeElement
  return !!el && el.tagName === 'IFRAME' && el.classList.contains('lean-playground')
}

const restoreScrollPosition = () => {
  if (typeof window === 'undefined') return
  const y = savedY
  requestAnimationFrame(() => {
    window.scrollTo(0, y)
    requestAnimationFrame(() => window.scrollTo(0, y))
  })
}

const handleIframeLoad = () => {
  isLoaded.value = true
  restoreScrollPosition()
}

const parentIntent = (ev) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  
  if (isIframeActive()) {
    if (!(ev.type === 'mousedown' && ev.target && ev.target.classList &&
          ev.target.classList.contains('lean-playground'))) {
      document.activeElement.blur()
    }
  }
  requestAnimationFrame(() => { savedY = window.scrollY })
  setTimeout(() => { savedY = window.scrollY }, 120)
}

const handleWindowScroll = () => {
  if (typeof window === 'undefined') return

  if (reverting) {
    reverting = false
    return
  }
  
  if (isIframeActive()) {
    if (window.scrollY !== savedY) {
      reverting = true
      window.scrollTo(0, savedY)
    }
  } else {
    savedY = window.scrollY
  }
}

const guardIframe = (iframe) => {
  if (iframe.dataset.leanGuarded) return
  iframe.dataset.leanGuarded = '1'
  iframe.addEventListener('load', restoreScrollPosition)
}

const scanAndGuardIframes = () => {
  if (typeof document === 'undefined') return
  document.querySelectorAll('iframe.lean-playground').forEach(guardIframe)
}

// --- Vue 生命周期集成 ---
onMounted(() => {
  // 安全初始化：只有在挂载到真实的浏览器客户端环境后，才安全地读取 DOM 和全局环境
  savedY = window.scrollY

  ;['wheel', 'touchmove', 'keydown', 'mousedown'].forEach((ev) => {
    window.addEventListener(ev, parentIntent, { passive: true, capture: true })
  })

  window.addEventListener('scroll', handleWindowScroll, { passive: true })

  scanAndGuardIframes()

  observer = new MutationObserver(scanAndGuardIframes)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
})

onUnmounted(() => {
  // 核心修正：解绑时必须传递具有相同属性值的对象，以确保移除成功
  ;['wheel', 'touchmove', 'keydown', 'mousedown'].forEach((ev) => {
    window.removeEventListener(ev, parentIntent, { capture: true })
  })
  window.removeEventListener('scroll', handleWindowScroll)
  
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lean-playground-wrapper {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
  background-color: var(--vp-c-bg-soft);
}

.iframe-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 0 !important;
  height: 0 !important;
  opacity: 0;
  pointer-events: none;
}

.lean-loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-bg-soft);
}

.lean-loading-text {
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>