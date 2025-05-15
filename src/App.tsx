import React, { useState } from 'react';
import { Upload, Button, Input, message, Card, Spin, Typography, Space, Tooltip } from 'antd';
import { UploadOutlined, InboxOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';
import './App.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// 定义主题色变量
const theme = {
  primary: '#4A90E2',      // 主色调：柔和的蓝色
  secondary: '#F5F7FA',    // 次要色：浅灰蓝色
  accent: '#50E3C2',       // 强调色：清新的薄荷绿
  text: {
    primary: '#2C3E50',    // 主要文字颜色
    secondary: '#7F8C8D',  // 次要文字颜色
    light: '#95A5A6'       // 浅色文字
  },
  background: {
    main: '#e0fbfc',       // 主背景色改为#e0fbfc
    card: '#FFFFFF',       // 卡片背景色
    hover: '#EDF2F7'       // 悬停背景色
  },
  border: '#E2E8F0'        // 边框颜色
};

// const GEMINI_API_KEY = 'AIzaSyBKiMkI3pwitppnnKorCxpxllUj2zsr-VY';
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

function App() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedZh, setCopiedZh] = useState(false);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 640;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('图片压缩失败'));
            }
          }, 'image/jpeg', 0.6);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
    });
  };

  const formatPrompt = (rawPrompt: string): string => {
    // 直接返回原始内容，不做长度限制和关键词处理
    return rawPrompt.trim();
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请先上传图片');
      return;
    }

    setLoading(true);
    try {
      const compressedFile = await compressImage(fileList[0].originFileObj as File);
      const base64Image = await fileToBase64(compressedFile);

      // Gemini 多模态API请求
      const promptText = `你是一个专业的图片分析专家，擅长分析图片并生成能够重现该图片的提示词。请先输出一段完整的英文提示词，再输出一段完整的中文提示词，不要在每一项前加任何标签。输出格式如下：\n英文提示词: ...\n中文提示词: ...\n请确保生成的提示词包含以下要素：1. 主体描述 2. 场景描述 3. 风格描述 4. 光照效果 5. 构图要素 6. 画面质量。每个要素都要有中英文描述，顺序一致，内容完整，适合直接用于Stable Diffusion等AI绘画。不要输出多余的解释和说明。`;

      const response = await axios.post(GEMINI_API_URL, {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ]
      });

      // 解析Gemini返回内容
      const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (result) {
        setPrompt(formatPrompt(result));
        message.success('提示词生成成功！');
      } else {
        throw new Error('Gemini API响应格式不正确');
      }
    } catch (error: any) {
      console.error('详细错误信息:', error);
      if (error.response) {
        const errorMessage = error.response.data?.error?.message || '未知错误';
        message.error(`生成提示词失败: ${errorMessage}`);
      } else if (error.request) {
        message.error('服务器未响应，请检查网络连接');
      } else {
        message.error(`生成提示词失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        console.log('Base64转换成功，长度:', base64Data.length);
        resolve(base64Data);
      };
      reader.onerror = error => {
        console.error('Base64转换失败:', error);
        reject(error);
      };
    });
  };

  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const url = URL.createObjectURL(fileList[0].originFileObj);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleCopyEn = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEn(true);
    message.success('英文提示词已复制');
    setTimeout(() => setCopiedEn(false), 2000);
  };

  const handleCopyZh = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedZh(true);
    message.success('中文提示词已复制');
    setTimeout(() => setCopiedZh(false), 2000);
  };

  const extractPrompts = (raw: string) => {
    // 去除所有"英文提示词"、"中文提示词"标签和语言标签
    let clean = raw
      .replace(/英文提示词[:：]?/gi, '')
      .replace(/中文提示词[:：]?/gi, '')
      .replace(/English[:：]?/gi, '')
      .replace(/Chinese[:：]?/gi, '')
      .replace(/英文[:：]?/gi, '')
      .replace(/中文[:：]?/gi, '');
    // 去除常见中英文标签词
    const labelPatterns = [
      /主体描述[:：]?/gi,
      /场景描述[:：]?/gi,
      /风格描述[:：]?/gi,
      /光照效果[:：]?/gi,
      /构图要素[:：]?/gi,
      /画面质量[:：]?/gi,
      /Subject description[:：]?/gi,
      /Scene description[:：]?/gi,
      /Style description[:：]?/gi,
      /Lighting effect[s]?:[:：]?/gi,
      /Composition elements?[:：]?/gi,
      /Image quality[:：]?/gi
    ];
    labelPatterns.forEach(pattern => {
      clean = clean.replace(pattern, '');
    });
    // 匹配所有英文短语（以字母或数字开头，允许8k、4k等）
    const enMatches = Array.from(clean.matchAll(/([A-Za-z0-9][^\n\u4e00-\u9fa5]*)/g)).map(m => m[1].trim()).filter(Boolean);
    // 匹配所有中文短语（以中文或数字开头）
    const zhMatches = Array.from(clean.matchAll(/([\u4e00-\u9fa50-9][^\nA-Za-z]*)/g)).map(m => m[1].trim()).filter(Boolean);
    // 统一格式处理函数
    const format = (arr: string[], isEn = false) => arr.join(', ')
      .replace(/[、，。；：？！…\n\r]+/g, ', ')
      .replace(isEn ? /[.]/g : '', ', ') // 英文部分将句号也替换为逗号
      .replace(/\s+/g, ' ')
      .replace(/(,\s*)+/g, ', ')
      .replace(/,\s*\./g, ',') // 去除逗号后跟句号
      .replace(/^,\s*|,\s*$/g, '');
    return {
      en: format(enMatches, true),
      zh: format(zhMatches)
    };
  };

  return (
    <div className="App" style={{ 
      minHeight: '100vh',
      background: theme.background.main,
      padding: '40px 20px'
    }}>
      <Card style={{ 
        maxWidth: '800px',
        margin: '0 auto',
        background: theme.background.card,
        borderRadius: '20px',
        boxShadow: '0 6px 32px rgba(0, 0, 0, 0.10)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 32,
          marginTop: 8
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            boxShadow: '0 2px 8px rgba(74, 144, 226, 0.15)'
          }}>
            <InboxOutlined style={{ fontSize: 32, color: '#fff', opacity: 0.95 }} />
          </div>
          <Title level={2} style={{
            textAlign: 'center',
            color: theme.text.primary,
            fontWeight: 700,
            letterSpacing: 2,
            margin: 0,
            fontSize: 32,
            textShadow: '0 2px 8px rgba(74, 144, 226, 0.08)'
          }}>
            图片提示词生成器
          </Title>
          <div style={{
            width: 80,
            height: 6,
            borderRadius: 3,
            margin: '16px auto 0',
            background: 'linear-gradient(90deg, #4A90E2 0%, #50E3C2 100%)',
            opacity: 0.5
          }} />
        </div>
        
        <Dragger
          beforeUpload={() => false}
          fileList={fileList}
          onChange={handleFileChange}
          maxCount={1}
          accept="image/*"
          showUploadList={false}
          style={{
            background: theme.background.main,
            border: `2px dashed ${theme.border}`,
            borderRadius: '12px',
            transition: 'all 0.3s ease'
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ 
              color: theme.primary, 
              fontSize: '48px',
              opacity: 0.8
            }} />
          </p>
          <p className="ant-upload-text" style={{ 
            color: theme.text.primary,
            fontSize: '16px',
            marginBottom: '8px'
          }}>
            点击或拖拽图片到此区域上传
          </p>
          <p className="ant-upload-hint" style={{ 
            color: theme.text.secondary,
            fontSize: '14px'
          }}>
            支持单个图片上传，系统会自动压缩图片
          </p>
        </Dragger>

        {previewUrl && (
          <div className="upload-preview" style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <img 
              src={previewUrl} 
              alt="预览图" 
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                objectFit: 'contain'
              }}
            />
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={loading}
            disabled={fileList.length === 0}
            size="large"
            style={{
              background: theme.primary,
              borderColor: theme.primary,
              height: '44px',
              padding: '0 36px',
              fontSize: '16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(74, 144, 226, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            生成提示词
          </Button>
        </div>

        {loading && (
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Spin>
              <div style={{ 
                padding: '50px', 
                background: theme.background.main, 
                borderRadius: '12px',
                color: theme.text.secondary
              }}>
                正在分析图片并生成提示词...
              </div>
            </Spin>
          </div>
        )}

        {prompt && (() => {
          const { en, zh } = extractPrompts(prompt);
          return (
            <div className="prompt-container" style={{ 
              marginTop: '40px',
              background: theme.background.main,
              borderRadius: '12px',
              padding: '24px'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size={24}>
                <div style={{
                  background: '#e0fbfc',
                  borderRadius: 8,
                  padding: 16,
                  position: 'relative',
                  border: '1px solid #b2e4f7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <b style={{ color: theme.text.primary, fontSize: 16 }}>英文提示词</b>
                    <Tooltip title={copiedEn ? '已复制' : '复制英文提示词'}>
                      <Button
                        type="text"
                        icon={copiedEn ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={() => handleCopyEn(en)}
                        style={{ color: theme.primary, fontSize: 16 }}
                      />
                    </Tooltip>
                  </div>
                  <TextArea
                    value={en}
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    readOnly
                    style={{
                      background: '#fff',
                      border: '1px solid #b2e4f7',
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div style={{
                  background: '#e0fbfc',
                  borderRadius: 8,
                  padding: 16,
                  position: 'relative',
                  border: '1px solid #b2e4f7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <b style={{ color: theme.text.primary, fontSize: 16 }}>中文提示词</b>
                    <Tooltip title={copiedZh ? '已复制' : '复制中文提示词'}>
                      <Button
                        type="text"
                        icon={copiedZh ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={() => handleCopyZh(zh)}
                        style={{ color: theme.primary, fontSize: 16 }}
                      />
                    </Tooltip>
                  </div>
                  <TextArea
                    value={zh}
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    readOnly
                    style={{
                      background: '#fff',
                      border: '1px solid #b2e4f7',
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: theme.text.primary
                    }}
                  />
                </div>
              </Space>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

export default App;
