# 腾讯云轻量应用服务器部署建议

## 目标架构

- `Nginx`：对外暴露 80/443，反向代理后端，并提供上传文件访问。
- `FastAPI`：容器内运行，监听 `8000`，不直接暴露公网端口。
- `PostgreSQL`：与后端部署在同一台轻量服务器，仅在 Docker 内网开放。
- `uploads`：使用 Docker volume 持久化上传文件。

## 适用阶段

- 当前阶段适合单机部署，成本低，便于快速上线验证。
- 后续用户量上来后，再拆分数据库、对象存储和后台服务。

## 生产建议

- 数据库不要对公网开放 `5432` 端口。
- 先用 `HTTP + IP` 做服务器内调试，拿到域名后再补 `HTTPS`。
- 微信小程序正式联调和上线前，必须切换到备案域名和 `HTTPS`。
- `SECRET_KEY`、数据库密码、微信密钥都放进服务器环境变量或 `.env`，不要提交仓库。

## 建议环境变量

```env
ENVIRONMENT=production
AUTO_CREATE_TABLES=true
POSTGRES_USER=postgres
POSTGRES_PASSWORD=please-change-this-password
POSTGRES_DB=alumni_card
SECRET_KEY=please-change-this-secret-key
WECHAT_APPID=
WECHAT_SECRET=
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760
CORS_ORIGINS=["*"]
```

## 上线顺序

1. 服务器安装 Docker 和 Docker Compose。
2. 若服务器上已有旧的本地部署版本，先执行停服和备份，再切换为 GitHub 仓库部署。
3. 使用 GitHub 仓库初始化服务器目录。
4. 在项目根目录准备生产环境 `.env`。
5. 执行 `docker compose -f docker/docker-compose.yml up -d --build`。
6. 配置 GitHub Actions 的 SSH Secrets，实现 push 到 `main` 自动部署。
7. 访问 `http://服务器IP/health` 检查后端和数据库状态。
8. 拿到域名后，补 Nginx HTTPS 配置，再配置微信小程序合法域名。

## 停用旧本地部署

如果之前是手动上传代码到服务器，建议先执行：

```bash
cd /home/ubuntu/apps/alumni-card
docker compose -f docker/docker-compose.yml down || docker-compose -f docker/docker-compose.yml down
```

然后使用仓库中的初始化脚本接管旧目录：

```bash
cd /home/ubuntu
git clone -b main <your-github-repo-url> repo-bootstrap-temp
cd repo-bootstrap-temp
chmod +x scripts/server-bootstrap.sh
TARGET_DIR=/home/ubuntu/apps/alumni-card bash scripts/server-bootstrap.sh <your-github-repo-url> main
```

脚本会自动备份旧目录，并尽量恢复原有 `.env`。

## 下一阶段建议

- 接入 Alembic，替代启动时自动建表。
- 接入对象存储 COS，替代本地文件上传。
- 加数据库定时备份。
- 拆分 `admin` 和 `miniprogram` 前端工程后再做联调。
