/// <reference types="vite/client" /> 

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  // 其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 