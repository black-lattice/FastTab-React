# FastTab React 安装说明

## 开发环境设置

### 1. 安装依赖

```bash
cd FastTabReact
pnpm install
```

### 2. 开发模式运行

```bash
pnpm dev
```

这将启动 Vite 开发服务器，你可以在浏览器中预览应用。

### 3. 构建生产版本

```bash
pnpm build
```

构建完成后，`dist` 目录将包含可部署的文件。

## Chrome 扩展安装

### 1. 构建项目

```bash
pnpm build
```

### 2. 加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `FastTabReact/dist` 目录

### 3. 配置新标签页

1. 在扩展管理页面找到 "FastTab React"
2. 点击"详情"
3. 确保"允许访问文件网址"已开启
4. 在 Chrome 设置中，将新标签页设置为使用扩展

## 项目结构说明

```
FastTabReact/
├── src/
│   ├── components/          # React 组件
│   │   ├── SearchSection.tsx    # 搜索组件
│   │   ├── BookmarkCard.tsx     # 书签卡片
│   │   ├── BookmarksContainer.tsx # 书签容器
│   │   └── EditModal.tsx        # 编辑模态框
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useBookmarks.ts      # 书签管理
│   │   ├── useSearch.ts         # 搜索功能
│   │   └── useDragDrop.ts       # 拖拽功能
│   ├── types/              # 类型定义
│   ├── App.tsx             # 主应用
│   ├── newtab.tsx          # 新标签页
│   └── popup.tsx           # 弹出窗口
├── manifest.json            # 扩展配置
├── package.json             # 项目配置
└── vite.config.ts          # 构建配置
```

## 开发注意事项

### 1. Chrome API 权限

确保在 `manifest.json` 中正确配置了权限：

```json
{
  "permissions": ["bookmarks", "storage"]
}
```

### 2. 类型安全

项目使用 TypeScript，确保所有 Chrome API 调用都有正确的类型定义。

### 3. 响应式设计

组件支持移动端，使用 CSS Grid 和 Flexbox 实现响应式布局。

### 4. 状态管理

使用 React Hooks 进行状态管理，避免使用外部状态管理库。

## 故障排除

### 1. 构建失败

- 检查 Node.js 版本（建议 16+）
- 清除 `node_modules` 并重新安装
- 检查 TypeScript 配置

### 2. 扩展不工作

- 检查 Chrome 版本（建议 88+）
- 确认扩展权限已正确配置
- 检查控制台错误信息

### 3. 书签功能异常

- 确认已授予书签权限
- 检查 Chrome 书签 API 是否可用
- 查看浏览器控制台错误

## 更新和维护

### 1. 更新依赖

```bash
pnpm update
```

### 2. 代码检查

```bash
pnpm lint
```

### 3. 类型检查

```bash
pnpm build
```

## 支持

如果遇到问题，请检查：

1. 项目 README.md
2. Chrome 扩展开发文档
3. React 和 TypeScript 官方文档
4. 项目 Issues 页面
