// env.d.ts

// 允许在 TypeScript 中直接使用 import "./style.css" 副作用导入
declare module '*.css';

// 兼容 Vite 常见的特殊导入后缀（可选）
declare module '*.css?inline' {
  const content: string;
  export default content;
}