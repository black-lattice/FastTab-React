import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证 FastTab React 扩展文件完整性...');
console.log('==========================================');

const distDir = path.join(__dirname, '..', 'dist');
const requiredFiles = [
  'manifest.json',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'src/newtab.html',
  'src/popup.html'
];

const requiredDirs = ['assets'];

let allGood = true;

// 检查必需的文件
console.log('\n📁 检查必需文件:');
requiredFiles.forEach((file) => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log(`❌ ${file} - 不是文件`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allGood = false;
  }
});

// 检查必需的目录
console.log('\n📂 检查必需目录:');
requiredDirs.forEach((dir) => {
  const dirPath = path.join(distDir, dir);
  if (fs.existsSync(dirPath)) {
    const stats = fs.statSync(dirPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(dirPath);
      console.log(`✅ ${dir}/ - ${files.length} 个文件`);
    } else {
      console.log(`❌ ${dir}/ - 不是目录`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${dir}/ - 目录不存在`);
    allGood = false;
  }
});

// 检查 manifest.json 内容
console.log('\n📋 检查 manifest.json:');
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`✅ manifest.json 格式正确`);
    console.log(`   - 名称: ${manifest.name}`);
    console.log(`   - 版本: ${manifest.version}`);
    console.log(`   - 新标签页: ${manifest.chrome_url_overrides?.newtab}`);
    console.log(`   - 弹出窗口: ${manifest.action?.default_popup}`);
  } catch (error) {
    console.log(`❌ manifest.json 格式错误: ${error.message}`);
    allGood = false;
  }
}

// 检查 HTML 文件中的资源路径
console.log('\n🔗 检查资源路径:');
const htmlFiles = ['src/newtab.html', 'src/popup.html'];
htmlFiles.forEach((htmlFile) => {
  const htmlPath = path.join(distDir, htmlFile);
  if (fs.existsSync(htmlPath)) {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const hasRelativePaths = content.includes('../assets/');
    if (hasRelativePaths) {
      console.log(`✅ ${htmlFile} - 使用相对路径`);
    } else {
      console.log(`❌ ${htmlFile} - 路径可能有问题`);
      allGood = false;
    }
  }
});

// 最终结果
console.log('\n==========================================');
if (allGood) {
  console.log('🎉 扩展文件验证通过！可以安全地在 Chrome 中加载。');
  console.log('\n📋 安装步骤:');
  console.log('1. 打开 Chrome 浏览器');
  console.log('2. 访问 chrome://extensions/');
  console.log('3. 开启开发者模式');
  console.log('4. 加载已解压的扩展程序');
  console.log('5. 选择 dist 目录');
} else {
  console.log('❌ 扩展文件验证失败！请检查构建过程。');
  console.log('\n🔧 建议:');
  console.log('1. 重新运行 pnpm build');
  console.log('2. 检查错误信息');
  console.log('3. 确认所有文件都已复制');
}

console.log('\n📖 更多信息请查看 README.md 和 test-extension.md');
