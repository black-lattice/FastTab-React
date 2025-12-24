# FastTab React

这是 FastTab 的 React 版本，使用最新的 React 18+ 技术栈重构。

## 特性

- 🚀 基于 React 18+ 和 TypeScript
- 🎨 现代化的 UI 设计，支持响应式布局
- 🔍 多搜索引擎支持（Google、Bing、百度）
- 📚 完整的书签管理功能
- 🖱️ 拖拽排序书签
- ✏️ 编辑和删除书签
- 📱 移动端友好的响应式设计
- 🎯 使用自定义 Hooks 进行状态管理

## 技术栈

- **React 18+** - 最新的 React 版本
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **CSS3** - 现代化的样式，包含动画和渐变
- **Chrome Extension API** - 浏览器扩展功能

## 项目结构

```
FastTabReact/
├── src/
│   ├── components/          # React 组件
│   │   ├── SearchSection.tsx
│   │   ├── BookmarkCard.tsx
│   │   ├── BookmarksContainer.tsx
│   │   └── EditModal.tsx
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useBookmarks.ts
│   │   ├── useSearch.ts
│   │   └── useDragDrop.ts
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx             # 主应用组件
│   ├── newtab.tsx          # 新标签页入口
│   ├── popup.tsx           # 弹出窗口组件
│   └── main.tsx            # 应用入口
├── manifest.json            # Chrome 扩展配置
├── package.json             # 项目依赖
├── vite.config.ts          # Vite 配置
├── start.sh                # Linux/macOS 启动脚本
└── start.bat               # Windows 启动脚本
```

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

#### Linux/macOS 用户：

```bash
./start.sh
```

#### Windows 用户：

```cmd
start.bat
```

启动脚本会自动：

- 检查环境依赖
- 安装项目依赖
- 构建项目
- 提供安装指导

### 方法二：手动安装

#### 1. 安装依赖

```bash
pnpm install
```

#### 2. 开发模式

```bash
pnpm dev
```

#### 3. 构建生产版本

```bash
pnpm build
```

#### 4. 预览构建结果

```bash
pnpm preview
```

## 🚀 Chrome 扩展安装和使用指南

### 方法一：开发模式安装（推荐开发者）

#### 1. 构建项目

```bash
pnpm build
```

#### 2. 加载扩展

1. 打开 Chrome 浏览器
2. 在地址栏输入 `chrome://extensions/` 并回车
3. 在右上角开启"开发者模式"开关
4. 点击"加载已解压的扩展程序"按钮
5. 选择 `FastTabReact/dist` 目录
6. 扩展加载成功后，你会看到 "FastTab React" 出现在扩展列表中

#### 3. 配置新标签页

1. 在扩展管理页面找到 "FastTab React"
2. 点击"详情"按钮
3. 确保"允许访问文件网址"已开启
4. 在 Chrome 设置中配置新标签页：
   - 打开 Chrome 设置（`chrome://settings/`）
   - 搜索"新标签页"
   - 选择"打开新标签页时显示" → "快速访问页面"
   - 或者直接访问 `chrome://settings/newTabPage` 进行设置

#### 4. 使用扩展

- **新标签页**: 打开新标签页时会自动显示 FastTab 界面
- **弹出窗口**: 点击工具栏中的扩展图标可以打开设置弹窗
- **书签管理**: 在新标签页中可以查看、编辑、删除和拖拽排序书签
- **搜索功能**: 支持多搜索引擎切换和快速搜索

### 方法二：打包安装（推荐普通用户）

#### 1. 构建项目

```bash
pnpm build
```

#### 2. 打包扩展

1. 在扩展管理页面（`chrome://extensions/`）
2. 找到已加载的 "FastTab React" 扩展
3. 点击"打包扩展程序"按钮
4. 选择 `FastTabReact/dist` 目录作为根目录
5. 点击"打包扩展程序"
6. 会生成 `.crx` 文件和 `.pem` 密钥文件

#### 3. 安装打包后的扩展

1. 将生成的 `.crx` 文件拖拽到 Chrome 扩展管理页面
2. 确认安装
3. 按照上述步骤配置新标签页

### 方法三：从 Chrome Web Store 安装（如果已发布）

1. 访问 Chrome Web Store
2. 搜索 "FastTab React"
3. 点击"添加至 Chrome"
4. 确认安装
5. 配置新标签页

## 🔧 扩展功能说明

### 新标签页功能

- **搜索栏**: 支持 Google、Bing、百度等搜索引擎
- **书签展示**: 以卡片形式展示所有书签
- **拖拽排序**: 可以拖拽书签卡片重新排序
- **快速编辑**: 点击编辑按钮可以修改书签标题和网址
- **权限管理**: 首次使用需要授权访问书签

### 弹出窗口功能

- **快速操作**: 打开新标签页、刷新书签
- **使用帮助**: 显示快捷键和功能说明
- **版本信息**: 显示当前扩展版本

### 快捷键

- `Ctrl + K`: 聚焦搜索框
- `Ctrl + F`: 搜索书签
- `Enter`: 执行搜索
- `Esc`: 关闭对话框

## 🐛 常见问题解决

### 扩展无法加载

- 确保 Chrome 版本在 88 以上
- 检查 `manifest.json` 文件是否完整
- 确认构建成功，`dist` 目录存在

### 新标签页不显示

- 检查扩展权限设置
- 确认新标签页配置正确
- 尝试重启浏览器

### 书签功能异常

- 确认已授予书签权限
- 检查 Chrome 书签 API 是否可用
- 查看浏览器控制台错误信息

### 样式显示异常

- 清除浏览器缓存
- 重新加载扩展
- 检查 CSS 文件是否正确加载

## 🔒 权限说明

扩展需要以下权限：

- **书签**: 读取、创建、编辑、删除书签
- **存储**: 保存用户设置和偏好

这些权限仅用于扩展功能，不会收集或传输任何个人数据。

## 📱 移动端支持

虽然这是一个 Chrome 扩展，但组件设计支持响应式布局，可以在不同尺寸的屏幕上正常显示。

## 🔄 更新扩展

### 开发模式更新

1. 修改代码后重新构建：`pnpm build`
2. 在扩展管理页面点击"重新加载"按钮

### 打包模式更新

1. 重新构建项目：`pnpm build`
2. 重新打包扩展
3. 卸载旧版本，安装新版本

## 📞 技术支持

如果遇到问题：

1. 检查项目 README.md 和 INSTALL.md
2. 查看 Chrome 扩展开发文档
3. 检查浏览器控制台错误信息
4. 确认 Chrome 版本和扩展权限

## 许可证

MIT License

## 发展建议

1.  **统一状态管理方案**: 目前项目使用了自定义 Hooks 进行状态管理，但随着项目复杂度的增加，可能会出现状态管理混乱的情况。建议引入一个统一的状态管理库，例如 [Zustand](https://zustand-demo.pmnd.rs/) 或 [Jotai](https://jotai.org/)，它们都是轻量级且易于使用的库，能够更好地组织和管理全局状态。
2.  **增加单元测试和端到端测试**: 项目目前似乎没有包含自动化测试。为了确保代码质量和功能稳定性，建议引入单元测试框架（如 [Vitest](https://vitest.dev/)）对关键组件和 Hooks 进行测试，并引入端到端测试框架（如 [Playwright](https://playwright.dev/)）对浏览器扩展的整体功能进行测试。
3.  **性能优化**：
    *   **代码分割 (Code Splitting)**: 针对不同的页面（如 `newtab.tsx` 和 `popup.tsx`）进行代码分割，按需加载，减少初始加载时间。Vite 本身支持开箱即用的代码分割。
    *   **列表虚拟化 (List Virtualization)**: 对于书签数量较多的情况，书签列表可能会导致性能问题。可以考虑使用像 `react-window` 或 `react-virtualized` 这样的库进行列表虚拟化，只渲染视口中可见的书签。
    *   **图片优化**: 扩展中使用的图标和背景图片可以进行压缩和按需加载，以减少带宽和提高加载速度。
4.  **UI/UX 改进**：
    *   **可访问性 (Accessibility)**: 检查并改进应用程序的可访问性，确保所有用户（包括使用辅助技术的用户）都能方便地使用。
    *   **主题切换**: 考虑增加亮色/暗色主题切换功能，提升用户体验和个性化设置。
    *   **国际化 (Internationalization)**: 如果未来计划支持多语言用户，可以考虑引入国际化方案（如 `react-i18next`）。
5.  **构建和部署优化**：
    *   **CI/CD 集成**: 引入持续集成/持续部署 (CI/CD) 流程，自动化测试、构建和部署，提高开发效率。
    *   **发布到 Chrome Web Store 流程自动化**: 考虑使用工具或脚本自动化扩展打包和发布到 Chrome Web Store 的过程。
6.  **代码规范自动化**: 目前使用了 ESLint，但可以进一步配置 Prettier 等工具，实现代码格式的自动化，确保团队协作时代码风格的一致性。