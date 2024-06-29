# Awesome Hands - Control <img src="https://img.shields.io/badge/Windows-gray?logo=windows" alt="Windows"/> <img src="https://img.shields.io/badge/macOS-black?logo=apple" alt="macOS"/>

[README in English](./README.md) | 中文文档

## 🔥 功能介绍

### ✨ 支持多种手势识别

- 打开手掌 / 握拳
- 竖起食指 / 比耶
- 大拇指向上 / 向下

### ✨ 支持多种操作控制

- 绑定任意软件
- 绑定任意快捷键
- 模拟鼠标动作（ 滚轮 / 光标 / 点击 ）
- 模拟特定行为（ 调节音量 / 切换歌曲 ）

## 🧙🏻 快速上手

### 🔮 开箱即用

直接在 [release](https://github.com/RylanBot/awesome-hands-control/releases) 中下载已经打包好的安装包

### 🔮 二次开发

<p>
  <img src="https://img.shields.io/badge/node-18.x-green" alt="node version"/>
  <img src="https://img.shields.io/badge/npm-8.x-red" alt="npm version"/>
  <img src="https://img.shields.io/badge/yarn-1.x-blue" alt="yarn version"/>
</p>

如果你熟悉 Web 前端技术且对源码感兴趣，可以根据以下命令，在本地启动这个程序

```sh
npm install
npm run dev
```

如果安装依赖过程中报错，可以尝试使用 `npm install -g node-gyp` 解决。

## 🌷 效果预览

> 🔊 **绑定的软件名对应任务管理器中的进程名**  
> - 所有操作系统支持上传本地图片，Windows 支持选择 .exe 文件后自动提取图标。  
> - 每次引入新的设置时，必须重启摄像机才能同步生效。

![dashboard](https://s2.loli.net/2023/12/09/X1Pl9NdOKGDheFT.png)
![global](https://s2.loli.net/2024/05/30/9M8mSqHtplQTRwL.png)
![setting](https://s2.loli.net/2023/12/10/TDwQo7t4Eh6RkzN.png)
![camera](https://s2.loli.net/2024/05/30/POZVw8MaxSChXo4.png)

## ⚙️ 技术栈

### 💻 框架

- [![Vite](https://img.shields.io/badge/-Vite-blueviolet?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
- [![React](https://img.shields.io/badge/-React-blue?logo=react&logoColor=white&style=flat-square)](https://react.dev/)
- [![Electron](https://img.shields.io/badge/-Electron-dodgerblue?logo=electron&logoColor=white&style=flat-square)](https://www.electronjs.org/)
- [![TypeScript](https://img.shields.io/badge/-TypeScript-goldenrod?logo=TypeScript&logoColor=white&style=flat-square)](https://www.electronjs.org/)
- [![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-teal?logo=tailwind-css&logoColor=white&style=flat-square)](https://tailwindcss.com/)

### 💻 核心库

- [MediaPipe](https://developers.google.com/mediapipe)
- [active-win](https://github.com/sindresorhus/active-win)
- [Robotjs](http://robotjs.io/)
