# sx校友卡

`sx校友卡` 是一个面向课程展示的校友服务平台项目，包含：

- `backend`：基于 `FastAPI` 的后端接口服务
- `admin`：基于 `Vue 3 + Vite + Element Plus` 的管理后台
- `miniprogram`：基于 `Taro + React + TypeScript` 的微信小程序前端
- `docker`：用于腾讯云轻量服务器部署的 `Docker Compose + Nginx + PostgreSQL` 配置

项目当前目标是支持课程演示，覆盖校友认证、返校预约、活动展示、校友会信息、文章资讯和校友风采等核心流程。

## 项目特性

- 校友小程序首页、校友会、活动、预约、资讯、个人中心等基础页面
- 管理后台看板、校友审核、预约管理、活动管理、文章管理等演示入口
- FastAPI 后端统一提供认证、校友、活动、预约、文章、访谈等接口
- PostgreSQL 持久化存储
- Docker 一键部署到云服务器
- 提供 Git 部署脚本和腾讯云部署文档

## 技术栈

- 后端：`FastAPI`、`SQLAlchemy 2.0`、`PostgreSQL`、`Pydantic`
- 小程序：`Taro 4`、`React 18`、`TypeScript`、`SCSS`
- 管理后台：`Vue 3`、`Vite`、`Element Plus`、`Axios`
- 部署：`Docker Compose`、`Nginx`

## 目录结构

```text
.
├─ backend/        # FastAPI 后端
├─ admin/          # Vue 管理后台
├─ miniprogram/    # Taro 小程序
├─ docker/         # Docker Compose 与 Nginx 配置
├─ docs/           # 部署与 Git 使用文档
└─ scripts/        # 服务器初始化与部署脚本
```

## 本地预览

### 1. 管理后台预览

进入 `admin` 目录后执行：

```bash
npm install
npm run dev
```

启动成功后，在浏览器打开终端输出的本地地址，通常类似：

```text
http://localhost:5173/
```

### 2. 小程序本地预览

进入 `miniprogram` 目录后执行：

```bash
npm install
```

然后使用微信开发者工具导入 `miniprogram` 目录进行预览。

说明：

- 当前项目已配置小程序 `AppID`
- 若只是本地开发和界面查看，直接用微信开发者工具即可
- 若需要通过 `miniprogram-ci` 生成二维码预览，还需要微信公众平台配置上传密钥和 `IP 白名单`

### 3. 后端本地启动

建议使用 Python 3.11 及以上版本。

进入 `backend` 目录后执行：

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

复制环境变量模板：

```bash
copy .env.example .env
```

然后启动服务：

```bash
uvicorn app.main:app --reload
```

默认健康检查地址：

```text
http://127.0.0.1:8000/health
```

### 4. 初始化老师测试数据

项目已提供一份老师测试数据与导入脚本：

- 数据文件：`backend/scripts/teachers.sample.json`
- 导入脚本：`backend/scripts/import_teachers.py`

在 `backend` 目录执行：

```bash
python scripts/import_teachers.py
```

如果你想导入自定义 JSON 文件，也可以传入文件路径：

```bash
python scripts/import_teachers.py scripts/teachers.sample.json
```

JSON 结构示例：

```json
[
  {
    "name": "陈老师",
    "phone": "13600000000",
    "subject": "语文",
    "title": "高三年级主任",
    "is_active": true
  }
]
```

说明：

- 以 `姓名 + 电话` 作为匹配键
- 若老师已存在，则更新 `subject`、`title`、`is_active`
- 若老师不存在，则自动新增

## Docker 部署

项目提供了完整的 Docker 部署配置，适合直接部署到腾讯云轻量应用服务器。

在项目根目录准备好环境变量后，执行：

```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

默认会启动以下服务：

- `db`：PostgreSQL
- `backend`：FastAPI
- `nginx`：反向代理

相关文件：

- [docker-compose.yml](file:///d:/Desktop/database%20project/alumni-card/docker/docker-compose.yml)
- [Dockerfile.backend](file:///d:/Desktop/database%20project/alumni-card/docker/Dockerfile.backend)
- [nginx.conf](file:///d:/Desktop/database%20project/alumni-card/docker/nginx.conf)

## Git 部署

仓库支持通过 Git 拉取后在服务器上执行脚本完成部署。

参考文档：

- [git-deploy.md](file:///d:/Desktop/database%20project/alumni-card/docs/git-deploy.md)
- [tencent-cloud-lite-deploy.md](file:///d:/Desktop/database%20project/alumni-card/docs/tencent-cloud-lite-deploy.md)

服务器部署脚本：

- [deploy.sh](file:///d:/Desktop/database%20project/alumni-card/scripts/deploy.sh)
- [server-bootstrap.sh](file:///d:/Desktop/database%20project/alumni-card/scripts/server-bootstrap.sh)

## 当前状态

当前版本适合课程展示与功能演示，整体上已具备：

- 小程序 MVP 页面展示
- 管理后台演示面板
- 后端主要接口与基础部署能力

但仍有一些演示版特征：

- 小程序部分功能仍采用 mock 数据回退
- 管理后台部分操作仍以演示流程为主
- 小程序正式二维码预览依赖微信公众平台权限和配置

## 注意事项

- 仓库中不会提交小程序上传私钥、认证文件和本地敏感配置
- 首次部署前请务必修改生产环境中的 `SECRET_KEY`、数据库密码等默认值
- 若他人从 GitHub 下载本项目：
  - 可以直接本地运行 `admin`
  - 可以通过微信开发者工具打开 `miniprogram`
  - 不能直接获得小程序二维码预览，除非具备微信后台权限与白名单配置

## 文档补充

如果你希望进一步完善仓库文档，建议后续继续补充：

- 接口说明
- 数据库设计图
- 页面截图
- 演示视频链接
