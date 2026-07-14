import { defineConfig } from 'vitepress'
import { defineTeekConfig } from "vitepress-theme-teek/config";
import markdownItLeanPlayground from './markdown-it-lean'

// Teek 主题配置
const teekConfig = defineTeekConfig({
    sidebarTrigger: true,
    description: "A VitePress Site",
    // vitepress-plugin-sidebar-resolve 会自动扫描目录生成侧边栏，
    // 需要把 collapsed 设为布尔值（false = 默认展开且可折叠），
    // 否则 VitePress 不会渲染分组的折叠 caret。
    // - type: 'array'      所有目录合并成一个侧边栏，跨页面显示
    // - initItemsText: true 让分组 text 使用文件夹名（有 text 才会渲染折叠按钮）
    // - rootTitle           根目录下散文件所在分组的标题
    vitePlugins: {
        sidebarOption: {
            // type: "array",
            initItemsText: true,
            // rootTitle: "杂项",
            collapsed: false,
        },
    },
    friendLink: {
        list: [
            {
                name: "aiifabbf",
                link: "https://aiifabbf.github.io/",
                avatar: "https://aiifabbf.github.io/_static/favicon.ico",
                desc: "aiifabbf 的博客"
            }
        ]
    },
});

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lang: 'zh-CN',
    extends: teekConfig,
    title: "shizhilvren",
    srcDir: 'src',
    markdown: {
        math: true,
        lineNumbers: true, // 开启行号
        config: (md) => {
            // 使用自定义插件
            md.use(markdownItLeanPlayground)
        }
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Lean 语言指北', link: '/Lena/lean语言指北' }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/shizhilvren' }
        ],
        outline: [2, 4],
        search: {
            provider: 'local'
        },
    },
})
