<div align="center">

<img src="jkp_logo.png" width="128" />

> Douyin Video Downloader —— 抖音免水印视频下载扩展

[![版本](https://img.shields.io/badge/版本-v2.3.2-4FC921)](https://github.com/HaoBaB521/JKP-Video-Downloader/releases)
[![下载量](https://img.shields.io/github/downloads/HaoBaB521/JKP-Video-Downloader/total?label=下载量)](https://github.com/HaoBaB521/JKP-Video-Downloader/releases)
[![Star](https://img.shields.io/github/stars/HaoBaB521/JKP-Video-Downloader?label=Star)](https://github.com/HaoBaB521/JKP-Video-Downloader/stargazers)
[![Fork](https://img.shields.io/github/forks/HaoBaB521/JKP-Video-Downloader?label=Fork)](https://github.com/HaoBaB521/JKP-Video-Downloader/forks)

[![Chrome](https://img.shields.io/badge/Chrome-支持-4FC921?logo=googlechrome&logoColor=white)]()
[![Edge](https://img.shields.io/badge/Edge-支持-0078D6?logo=microsoftedge&logoColor=white)]()
[![Firefox](https://img.shields.io/badge/Firefox-支持-FF7139?logo=firefox&logoColor=white)]()

</div>

# JKP（专注于视频下载）

> Douyin Video Downloader —— 抖音免水印视频下载扩展

## 版本
- **正式版：2.3.2**
- 年份版：2026.10.23

作者：伐浩（个人制作） https://b23.tv/hD8Kcri

（所有问题我不承担，也别联系我。扩展一些小毛病问题，可以在 B 站评论一下，但是不一定能回复。）

## 界面预览

| 概览 | 设置 |
| --- | --- |
| ![概览](docs/options-home.png) | ![设置](docs/options-settings.png) |

| 帮助 | 下载提示 |
| --- | --- |
| ![帮助](docs/options-help.png) | ![提示](docs/snackbar.png) |

## 安装教程
1. 下载本仓库 ZIP（Code → Download ZIP）并解压；
2. 打开浏览器扩展管理页（Chrome: `chrome://extensions` / Edge: `edge://extensions` / Firefox: `about:debugging`）；
3. 开启「开发者模式」（Firefox 选择「临时载入附加组件」）；
4. 点击「加载已解压的扩展程序」，选择解压出的文件夹（内含 `manifest.json` 的那一层）；
5. 打开抖音网页版，刷新页面即可使用。

支持浏览器：**Google Chrome / Microsoft Edge / Mozilla Firefox**（Chromium / Firefox 内核）

## 主要功能

- 全新 UI：独立轻量设置页（概览 / 设置 / 帮助）、透明玻璃下载提示、全透明下载按钮
- 解析大幅提速：视频信息和文件名"嗖"一下就出来，不用再傻等（v2.3 重点优化）
- 双重解析引擎：主要生成 / 2号生成 两种文件名生成逻辑，自动兜底，解析更稳
- 文件名方案自由排序：作者 / 描述 / 标签 / 视频分辨率 / 视频 ID
- 并行解析 + 30 秒缓存，点击即出
- 免水印下载抖音视频
- 文件名自定义：作者 / 描述 / 分辨率 / 视频 ID
- 视频质量可选：最高分辨率 / 最高码率 / 最大文件
- 下载子目录设置
- 滚动优化：抖音页面滑动时暂停 DOM 扫描，设置页去掉实时模糊，上下滑动更顺
- 版本说明面板

## 更新日志

### v2.3.2（2026.10.23）
- 全新：设置页重构为独立轻量界面（概览 / 设置 / 帮助），无第三方 UI 框架，打开更快
- 全新：设置搜索、Ctrl+S 保存、实时文件名与保存路径预览、未保存状态提示
- 全新：下载提示改为透明玻璃样式，标题 + 视频 ID 两级显示，解析中带呼吸圆点
- 修复：「主要生成 / 2号生成」两套文件名逻辑都生效，切换后立即按新模式解析
- 修复：文件名方案中的「标签」不生效
- 修复：默认 douyin 子目录不生效
- 修复：快速下载路径不生成作者 / 描述文件名
- 优化：抖音页面滚动时暂停 DOM 扫描；设置页去除实时模糊与常驻动画，上下滑动更顺

### v2.3（2026.10.19）
- 优化：解析速度全面提速——视频信息和文件名"嗖"一下就出来，不用再傻等
- 优化：播放源等待时间大幅缩短，点击下载响应更快
- 界面：移除推荐流卡片上的下载按钮，只保留播放器内悬停按钮，画面更清爽
- 界面：联系作者窗口换用抖音、B站官方图标
- 修复：修复无法生成视频文件名的问题
- 修复：修复下载按钮显示异常、多余挂载的问题
- 修复：修复部分视频解析慢、卡顿的问题

### v2.2（2026.10.15）
- 新增：首页推荐流视频卡片自动挂载下载按钮（`content-scripts/jkp_extra.js`）
- 新增：解析与下载并行，有播放地址立即下载，响应更快
- 优化：视频详情 iframe 并发解析 1 → 2，解析提速
- 优化：下载按钮改为全透明无边框样式，不再遮挡画面
- 优化：设置页全新 Dashboard 风格改版（顶部导航 / 版本说明卡片 / 作者联系面板）
- 修复：manifest 注册 `jkp_extra.js`，保证新功能加载生效

### v2.1
- 全新液态玻璃 UI、全透明下载按钮
- 双重文件名生成逻辑，解析更稳
- 并行解析 + 30 秒缓存，点击即出

## 声明与禁止事项
本扩展由作者独立开发，仅供个人学习、研究及技术交流使用。

未经作者明确授权，禁止将本扩展及其修改版本用于任何商业用途，包括但不限于收费、出售、付费引流或其他商业获利行为。

未经作者明确授权，禁止转载、二次分发、重新打包或以其他方式重新发布本扩展及其修改版本。

禁止冒用作者名义，或将本扩展及其修改版本冒充为他人原创进行传播。

禁止对本扩展进行修改、破解或逆向后，以未经作者授权的形式公开传播或用于商业获利。

禁止利用本扩展从事侵犯他人著作权、隐私权或其他违法违规的活动。

通过本扩展下载的视频仅供个人收藏与学习使用，请勿用于商业用途或二次传播。
