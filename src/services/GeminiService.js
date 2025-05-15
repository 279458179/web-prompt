import { API_CONFIG } from '../config';

class GeminiService {
  async generatePrompt(imageData) {
    try {
      const response = await fetch(`${API_CONFIG.GEMINI.API_URL}?key=${API_CONFIG.GEMINI.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "请分析这张图片，并生成一个详细的英文提示词。提示词应该包含以下要素：\n" +
                      "1. 主体描述（人物、物体、场景等）\n" +
                      "2. 风格描述（艺术风格、渲染风格等）\n" +
                      "3. 环境描述（光照、天气、氛围等）\n" +
                      "4. 构图描述（视角、镜头效果等）\n" +
                      "5. 细节描述（材质、纹理、颜色等）\n" +
                      "请确保生成的提示词是完整的英文句子，不要使用逗号分隔的列表形式。"
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: API_CONFIG.GEMINI.TEMPERATURE,
            maxOutputTokens: API_CONFIG.GEMINI.MAX_TOKENS,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API 错误:', error);
      throw error;
    }
  }
}

export default new GeminiService(); 