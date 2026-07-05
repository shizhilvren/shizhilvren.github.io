import DefaultTheme from 'vitepress/theme'
import LeanPlayground from './components/LeanPlayground.vue'
import type { Theme } from 'vitepress'

// import "./style.css"


import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";


export default {
  // extends: DefaultTheme,
  extends: Teek,

  enhanceApp({ app }) {
    // 全局注册组件，名称必须与插件中返回的标签名一致
    app.component('LeanPlayground', LeanPlayground)
  }
} satisfies Theme