
import type { MarkdownIt } from 'vitepress'

export default function markdownItLeanPlayground(md: MarkdownIt) {
  // 缓存原本的 fence 渲染函数
  const defaultRender = md.renderer.rules.fence

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()

    // 检查是否匹配 {lean-playground}
    if (info.startsWith('{lean-playground}')) {
      // 提取参数，例如 :height: 470px
      const heightMatch = info.match(/:height:\s*([^\s]+)/)
      const height = heightMatch ? heightMatch[1] : '400px' // 默认高度

      // 获取代码块内部的纯文本内容，并进行 HTML 转义防止解析出错
      const codeContent = md.utils.escapeHtml(token.content)

      // 返回你自定义的 Vue 组件标签，将代码和高度作为属性传递
      return `<LeanPlayground height="${height}" code="${codeContent}" />`
    }

    // 如果不是 lean-playground，则使用默认的 VitePress 代码块渲染
    return defaultRender!(tokens, idx, options, env, self)
  }
}

