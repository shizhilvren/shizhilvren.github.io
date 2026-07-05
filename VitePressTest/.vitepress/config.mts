import { defineConfig } from 'vitepress'
import { defineTeekConfig } from "vitepress-theme-teek/config";
import markdownItLeanPlayground from './markdown-it-lean'

// Teek 主题配置
const teekConfig = defineTeekConfig({
    sidebarTrigger: true,
    description: "A VitePress Site",

    themeConfig: {
        // sidebar: [
        //     {
        //         text: 'Examples',
        //         collapsed: false,
        //         items: [
        //             { text: 'Markdown Examples', link: '/markdown-examples' },
        //             { text: 'Runtime API Examples', link: '/api-examples' }
        //         ]
        //     }
        // ],


    },

});

// https://vitepress.dev/reference/site-config
export default defineConfig({
    extends: teekConfig,
    title: "My Awesome Project",
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
            { text: 'Examples', link: '/markdown-examples' }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
        ],
        outline: [2, 4],
        search: {
            provider: 'local'
        }
    },
})
