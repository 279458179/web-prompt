// API 配置
const decodeBase64 = (str) => {
  try {
    return atob(str);
  } catch (e) {
    console.error('Base64 解码错误:', e);
    return '';
  }
};

// Base64 编码的 API Key
const ENCODED_GEMINI_API_KEY = 'QUl6YVN5QktpTUtJM3B3aXRwcG5uS29yQ3hweGxsVWoyenNyLVZZ';

export const API_CONFIG = {
  // DeepSeek API 配置
  DEEPSEEK: {
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7
  },
  // Gemini API 配置
  GEMINI: {
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
    API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
    MODEL: 'gemini-pro-vision',
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.7
  }
}; 