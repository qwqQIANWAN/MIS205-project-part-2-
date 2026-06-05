# GitHub 部署流程

## 目标

把当前项目从“本地上传一份代码到服务器”改为“本地提交到 GitHub，GitHub Actions 触发服务器执行 `git pull` 后重建容器”。

默认约定：

- Git 平台：`GitHub`
- 部署分支：`main`
- 服务器项目目录：`/home/ubuntu/apps/alumni-card`

## 一次性准备

### 1. 本地仓库初始化

项目已经初始化为 Git 仓库，并建议使用 `main` 作为主分支。

在本地项目目录执行：

```bash
git status
git add .
git commit -m "chore: initialize git deployment"
```

### 2. 创建 GitHub 仓库

在 GitHub 新建一个空仓库，不要勾选 README、`.gitignore` 和 License。

假设仓库地址是：

```text
git@github.com:<your-name>/alumni-card.git
```

或者：

```text
https://github.com/<your-name>/alumni-card.git
```

### 3. 绑定远程仓库并首次推送

在本地项目目录执行：

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 服务器首次改造

### 1. 安装 Git

```bash
sudo apt update
sudo apt install -y git
```

### 2. 备份并停用旧的本地部署

如果你之前是手动上传代码或直接在服务器本地运行项目，先保留环境变量，并停止旧容器：

```bash
cp /home/ubuntu/apps/alumni-card/.env /home/ubuntu/alumni-card.env.backup
cd /home/ubuntu/apps/alumni-card
docker compose -f docker/docker-compose.yml down || docker-compose -f docker/docker-compose.yml down
```

### 3. 用 Git 仓库接管服务器目录

项目已提供初始化脚本，会自动：

- 检测当前目录是否还是手动部署版本
- 尝试停止旧容器
- 备份旧目录到时间戳目录
- 克隆 GitHub 仓库
- 自动恢复旧 `.env`

```bash
cd /home/ubuntu
git clone -b main <your-github-repo-url> repo-bootstrap-temp
cd repo-bootstrap-temp
chmod +x scripts/server-bootstrap.sh scripts/deploy.sh
TARGET_DIR=/home/ubuntu/apps/alumni-card bash scripts/server-bootstrap.sh <your-github-repo-url> main
```

### 4. 赋予脚本执行权限并部署

```bash
cd /home/ubuntu/apps/alumni-card
chmod +x scripts/deploy.sh scripts/server-bootstrap.sh
bash scripts/deploy.sh main
```

## GitHub Actions 自动部署

仓库已经提供工作流文件：

- [deploy.yml](file:///d:/Desktop/database%20project/.github/workflows/deploy.yml)

### 需要配置的 GitHub Secrets

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中添加：

- `DEPLOY_HOST`：服务器公网 IP 或域名
- `DEPLOY_PORT`：SSH 端口，通常是 `22`
- `DEPLOY_USER`：服务器登录用户，例如 `ubuntu`
- `DEPLOY_SSH_KEY`：用于登录服务器的私钥内容

### 可选的 GitHub Variables

- `DEPLOY_PATH`：服务器项目目录，默认 `/home/ubuntu/apps/alumni-card`
- `DEPLOY_BRANCH`：部署分支，默认 `main`

### 自动触发规则

- 每次 push 到 `main` 时自动部署
- 也可以在 GitHub Actions 页面手动点击 `Run workflow`

## 日常更新流程

以后每次更新都按下面流程走。

### 本地

```bash
git add .
git commit -m "feat: your change"
git push origin main
```

### 服务器

正常情况下不再需要手动登录服务器；GitHub Actions 会自动执行部署。

如果你想手动重发一次部署，也可以执行：

```bash
cd /home/ubuntu/apps/alumni-card
bash scripts/deploy.sh main
```

## 常用检查命令

```bash
cd /home/ubuntu/apps/alumni-card
git log --oneline -n 5
docker-compose -f docker/docker-compose.yml ps
docker-compose -f docker/docker-compose.yml logs --tail=100 backend
curl http://127.0.0.1/health
```

## 注意事项

- 不要把 `.env` 提交到 GitHub。
- 服务器上的 `.env` 只保留在服务器本地。
- 当前上传文件走 Docker volume，不受 `git pull` 影响。
- 以后引入 Alembic 后，建议把数据库迁移命令并入 `scripts/deploy.sh`。
- 微信小程序本体仍需通过微信开发者工具或 CI 上传，云服务器部署的是后端 API 和相关静态资源，不是把小程序包直接跑在服务器上。
