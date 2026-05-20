# ============================================================
# MUD Game - 多阶段构建 Dockerfile
# ============================================================
# 阶段1: 构建依赖（仅安装生产依赖）
FROM node:20-alpine AS deps

WORKDIR /app

# 复制 package.json（利用 Docker 层缓存）
COPY package.json package-lock.json* ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# ============================================================
# 阶段2: 运行时镜像（最小化体积）
FROM node:20-alpine AS runner

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# 创建非 root 用户（安全最佳实践）
RUN addgroup -S mudgroup && adduser -S muduser -G mudgroup

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码
COPY server/ ./server/
COPY client/ ./client/

# 复制 package.json（供 npm start 使用）
COPY package.json ./

# 切换到非 root 用户
USER muduser

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# 启动命令
CMD ["node", "server/index.js"]
