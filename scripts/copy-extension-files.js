import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 正在复制扩展文件...');

// 要复制的文件和目录
const filesToCopy = ['manifest.json', 'icons'];

// 确保 dist 目录存在
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 复制文件
filesToCopy.forEach((item) => {
  const sourcePath = path.join(__dirname, '..', item);
  const destPath = path.join(distDir, item);

  if (fs.existsSync(sourcePath)) {
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // 复制目录
      copyDir(sourcePath, destPath);
      console.log(`✅ 复制目录: ${item}`);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ 复制文件: ${item}`);
    }
  } else {
    console.log(`⚠️  文件不存在: ${item}`);
  }
});

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('🎉 扩展文件复制完成！');
console.log('📂 dist 目录现在包含所有必要的扩展文件');
