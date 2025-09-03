@echo off
chcp 65001 >nul
echo 🚀 FastTab React 启动脚本
echo ================================

REM 检查是否安装了 pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 pnpm，请先安装 pnpm
    echo 安装命令: npm install -g pnpm
    pause
    exit /b 1
)

REM 检查 Node.js 版本
for /f "tokens=1,2 delims=." %%a in ('node -v') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 16 (
    echo ❌ 错误: Node.js 版本过低，需要 16+ 版本
    node -v
    pause
    exit /b 1
)

echo ✅ Node.js 版本: 
node -v
echo ✅ pnpm 版本: 
pnpm -v

echo.
echo 📦 安装依赖...
pnpm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 🔨 构建项目...
pnpm build

if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo.
echo ✅ 构建成功！
echo.
echo 📋 接下来请按照以下步骤在 Chrome 中安装扩展：
echo.
echo 1. 打开 Chrome 浏览器
echo 2. 在地址栏输入: chrome://extensions/
echo 3. 开启右上角的'开发者模式'
echo 4. 点击'加载已解压的扩展程序'
echo 5. 选择目录: %cd%\dist
echo 6. 扩展加载成功后，配置新标签页
echo.
echo 📖 详细说明请查看 README.md 文件
echo.
echo 🎉 享受使用 FastTab React！
pause 