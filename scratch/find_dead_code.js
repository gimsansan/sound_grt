const fs = require('fs');
const path = require('path');

const srcDirs = ['app', 'components', 'constants', 'context', 'data', 'hooks', 'screens', 'services', 'types'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      if (extensions.some(ext => fullPath.endsWith(ext))) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allFiles = [];
for (const dir of srcDirs) {
  getAllFiles(dir, allFiles);
}

const allFilesSet = new Set(allFiles.map(f => path.resolve(f)));
const graph = {};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  // Simple regex to find ALL local imports (starting with ./ or ../)
  const regex = /from\s+['"](\.[^'"]+)['"]|require\(['"](\.[^'"]+)['"]\)|import\(['"](\.[^'"]+)['"]\)|import\s+['"](\.[^'"]+)['"]/g;
  
  const deps = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const importPath = match[1] || match[2] || match[3] || match[4];
    if (importPath) {
      const resolvedDir = path.dirname(file);
      let targetPath = path.resolve(resolvedDir, importPath);
      
      let found = false;
      for (const ext of ['', ...extensions]) {
        if (allFilesSet.has(targetPath + ext)) {
          deps.push(targetPath + ext);
          found = true;
          break;
        }
      }
      if (!found) {
        for (const ext of extensions) {
          if (allFilesSet.has(path.join(targetPath, 'index' + ext))) {
            deps.push(path.join(targetPath, 'index' + ext));
            break;
          }
        }
      }
    }
  }
  
  // also handle absolute imports using 'components/...' etc if they exist
  const absRegex = /from\s+['"](components|constants|context|data|hooks|screens|services|types)\/([^'"]+)['"]/g;
  while ((match = absRegex.exec(content)) !== null) {
      const targetPath = path.resolve(process.cwd(), match[1], match[2]);
      for (const ext of ['', ...extensions]) {
        if (allFilesSet.has(targetPath + ext)) {
          deps.push(targetPath + ext);
          break;
        }
      }
  }

  graph[path.resolve(file)] = deps;
}

const usedFiles = new Set();
const roots = allFiles.filter(f => f.startsWith('app' + path.sep) || f.startsWith('app/')).map(f => path.resolve(f));

function dfs(file) {
  if (usedFiles.has(file)) return;
  usedFiles.add(file);
  const deps = graph[file] || [];
  for (const dep of deps) {
    dfs(dep);
  }
}

for (const root of roots) {
  dfs(root);
}

const unusedFiles = [];
for (const file of allFiles) {
  const absPath = path.resolve(file);
  if (!usedFiles.has(absPath) && !file.endsWith('.d.ts')) {
    unusedFiles.push(file);
  }
}

console.log('---UNUSED FILES---');
unusedFiles.forEach(f => console.log(f));
