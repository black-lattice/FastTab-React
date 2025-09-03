#!/bin/bash

echo "🚀 FastTab React 启动脚本"
echo "================================"

# 检查是否安装了 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: 未找到 pnpm，请先安装 pnpm"
    echo "安装命令: npm install -g pnpm"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ 错误: Node.js 版本过低，需要 16+ 版本"
    echo "当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ pnpm 版本: $(pnpm -v)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 构建项目
echo ""
echo "🔨 构建项目..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo ""
echo "✅ 构建成功！"
echo ""
echo "📋 接下来请按照以下步骤在 Chrome 中安装扩展："
echo ""
echo "1. 打开 Chrome 浏览器"
echo "2. 在地址栏输入: chrome://extensions/"
echo "3. 开启右上角的'开发者模式'"
echo "4. 点击'加载已解压的扩展程序'"
echo "5. 选择目录: $(pwd)/dist"
echo "6. 扩展加载成功后，配置新标签页"
echo ""
echo "🔍 如果遇到问题，请查看 test-extension.md 文件"
echo "📖 详细说明请查看 README.md 文件"
echo ""
echo "🎉 享受使用 FastTab React！" 