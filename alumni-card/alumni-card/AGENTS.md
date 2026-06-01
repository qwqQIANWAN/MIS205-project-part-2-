# 校友卡小程序 — AI 工作流指南

## 一、项目概述

一个面向高校校友的微信小程序，提供校友身份认证、地区校友会、返校预约、活动报名、校友风采展示等功能。

### 核心功能清单
| 功能模块 | 描述 |
|---------|------|
| 校友卡（电子身份卡） | 生成专属电子校友卡，展示姓名、学号、院系、入学年份等 |
| 地区校友会 | 地图展示各地区校友会，在线申请加入，查看会长/联系人信息 |
| 返校预约 | 选择日期 + 同行人 → 提交审核 → 通过后生成入校二维码 |
| 活动发布 & 报名 | 管理员后台发布活动，校友小程序端浏览和报名 |
| 校友风采/人物专访 | 展示优秀校友人物专访，富文本内容 |
| 公众号文章链接 | 管理员手动添加公众号文章链接，小程序端浏览 |
| 微信登录 + 证件认证 | 微信授权登录 → 填写校友信息 → 上传毕业证等证件 → 管理员审核 |

---

## 二、技术架构

```
┌─────────────────────────────────────────────────────┐
│                   微信小程序 (Native)                 │
│  pages: 首页/校友卡/地区校友会/返校预约/活动/文章      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / wx.request
┌──────────────────────▼──────────────────────────────┐
│              FastAPI 后端 (Python 3.11+)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ 认证模块  │ │ 业务API  │ │ 文件上传/静态资源 │    │
│  │ wx.login │ │  CRUD    │ │   本地存储        │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ SQLAlchemy + asyncpg
┌──────────────────────▼──────────────────────────────┐
│              PostgreSQL 数据库                       │
│  users | alumnus_info | associations |              │
│  appointments | activities | articles | interviews  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         Vue 3 + Element Plus 管理后台 (Web)          │
│  校友审核 / 校友会管理 / 预约审批 / 活动管理 / 文章管理 │
└─────────────────────────────────────────────────────┘
```

### 技术选型
| 层级 | 技术 | 选型理由 |
|------|------|---------|
| 小程序前端 | 微信原生 + WeUI | 体积小、性能好、微信生态兼容最佳 |
| 后端框架 | Python FastAPI | 异步高性能、自动API文档、类型安全 |
| 数据库 | PostgreSQL | 支持地理查询（校友会地图）、关系型数据强一致性 |
| ORM | SQLAlchemy 2.0 (async) | Python 最成熟的 ORM，2.0 支持原生异步 |
| 管理后台 | Vue 3 + Element Plus | 国内最流行的管理后台技术栈，组件丰富 |
| 部署 | Docker + 云服务器 | 一键部署，环境一致 |

---

## 三、数据库设计 (ER 概要)

```
users (用户)
  ├─ id, openid, nickname, avatar_url, phone
  ├─ is_admin, is_active
  └─ 1:1 → alumnus_info

alumnus_info (校友信息)
  ├─ real_name, student_id, id_number
  ├─ department, major, grade, graduation_year
  ├─ education (本科/硕士/博士)
  ├─ certificate_image (证件照片)
  ├─ verification_status (pending/approved/rejected)
  └─ verification_remark

associations (地区校友会)
  ├─ name, province, city, district, address
  ├─ longitude, latitude (地图定位)
  ├─ president_name, president_phone
  ├─ contact_name, contact_phone
  └─ 1:N → association_members

association_members (校友会成员)
  ├─ association_id, user_id, joined_at

appointments (返校预约)
  ├─ user_id, visit_date, companion_count
  ├─ purpose, status (pending/approved/rejected/cancelled)
  ├─ qr_code, qr_code_expire_at
  └─ 1:N → appointment_companions

appointment_companions (同行人员)
  ├─ appointment_id, name, id_number, phone, relation

activities (活动)
  ├─ title, cover_image, description, location
  ├─ start_time, end_time, signup_deadline
  ├─ max_participants, current_participants
  ├─ status (upcoming/ongoing/ended/cancelled)
  └─ 1:N → activity_registrations

activity_registrations (活动报名)
  ├─ activity_id, user_id, registered_at

articles (公众号文章)
  ├─ title, cover_image, summary, url
  ├─ source, category, is_published, view_count

interviews (校友风采)
  ├─ title, cover_image, alumnus_name
  ├─ department, grade, current_position
  ├─ content (HTML 富文本), is_published
```

---

## 四、API 接口设计

Base URL: `/api/v1`

### 4.1 认证模块 `/auth`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/wechat-login` | 微信登录（code 换 token） | 公开 |
| GET  | `/auth/profile` | 获取当前用户信息 | 登录 |
| PUT  | `/auth/profile` | 更新用户信息 | 登录 |
| POST | `/auth/alumni-verify` | 提交校友认证（含证件照） | 登录 |

### 4.2 校友管理 `/alumni`（管理员）
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/alumni/verifications` | 待审核列表 | 管理员 |
| POST | `/alumni/verify/{id}` | 审核通过/拒绝 | 管理员 |
| GET  | `/alumni/list` | 校友列表（搜索/筛选） | 管理员 |
| GET  | `/alumni/{id}` | 校友详情 | 管理员 |

### 4.3 地区校友会 `/associations`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/associations` | 校友会列表（按省市区筛选） | 登录 |
| GET  | `/associations/{id}` | 校友会详情 + 成员数 | 登录 |
| POST | `/associations/{id}/join` | 申请加入校友会 | 登录（需已认证） |
| POST | `/associations/{id}/leave` | 退出校友会 | 登录 |
| GET  | `/associations/my` | 我已加入的校友会 | 登录 |
| POST | `/associations` | 创建校友会 | 管理员 |
| PUT  | `/associations/{id}` | 编辑校友会 | 管理员 |
| DELETE| `/associations/{id}` | 删除校友会 | 管理员 |

### 4.4 返校预约 `/appointments`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/appointments` | 提交返校预约 | 登录（需已认证） |
| GET  | `/appointments` | 我的预约列表 | 登录 |
| GET  | `/appointments/{id}` | 预约详情（含二维码） | 登录 |
| PUT  | `/appointments/{id}/cancel` | 取消预约 | 登录 |
| GET  | `/appointments/admin` | 所有预约列表（审批用） | 管理员 |
| PUT  | `/appointments/{id}/approve` | 审批通过（生成二维码） | 管理员 |
| PUT  | `/appointments/{id}/reject` | 审批拒绝 | 管理员 |

### 4.5 活动 `/activities`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/activities` | 活动列表（分页） | 登录 |
| GET  | `/activities/{id}` | 活动详情 | 登录 |
| POST | `/activities/{id}/register` | 报名活动 | 登录（需已认证） |
| POST | `/activities/{id}/cancel` | 取消报名 | 登录 |
| GET  | `/activities/my` | 我报名的活动 | 登录 |
| POST | `/activities` | 发布活动 | 管理员 |
| PUT  | `/activities/{id}` | 编辑活动 | 管理员 |
| DELETE| `/activities/{id}` | 删除活动 | 管理员 |

### 4.6 文章 `/articles`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/articles` | 公众号文章列表 | 登录 |
| GET  | `/articles/{id}` | 文章详情（+1浏览量） | 登录 |
| POST | `/articles` | 添加文章链接 | 管理员 |
| PUT  | `/articles/{id}` | 编辑文章 | 管理员 |
| DELETE| `/articles/{id}` | 删除文章 | 管理员 |

### 4.7 校友风采 `/interviews`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET  | `/interviews` | 校友风采列表 | 登录 |
| GET  | `/interviews/{id}` | 风采详情 | 登录 |
| POST | `/interviews` | 发布校友风采 | 管理员 |
| PUT  | `/interviews/{id}` | 编辑校友风采 | 管理员 |
| DELETE| `/interviews/{id}` | 删除校友风采 | 管理员 |

### 4.8 文件上传 `/upload`
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/upload/image` | 上传图片（证件/头像/封面） | 登录 |
| POST | `/upload/certificate` | 上传证件照（仅用于认证） | 登录 |

---

## 五、项目目录结构

```
alumni-card/
├── AGENTS.md                    # 本文件 — AI 工作流指南
├── README.md                    # 项目说明
│
├── backend/                     # 后端 (Python FastAPI)
│   ├── requirements.txt
│   ├── .env.example             # 环境变量模板
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口
│   │   ├── core/
│   │   │   ├── config.py        # 配置类
│   │   │   ├── database.py      # 数据库连接
│   │   │   └── security.py      # JWT + 密码 + 权限
│   │   ├── models/              # SQLAlchemy 数据模型
│   │   │   ├── user.py
│   │   │   ├── association.py
│   │   │   ├── appointment.py
│   │   │   ├── activity.py
│   │   │   └── article.py
│   │   ├── schemas/             # Pydantic 请求/响应模型
│   │   ├── api/v1/              # API 路由
│   │   │   ├── auth.py
│   │   │   ├── alumni.py
│   │   │   ├── associations.py
│   │   │   ├── appointments.py
│   │   │   ├── activities.py
│   │   │   ├── articles.py
│   │   │   └── upload.py
│   │   └── services/            # 业务逻辑层
│   ├── migrations/              # Alembic 数据库迁移
│   └── uploads/                 # 上传文件存储目录
│
├── admin/                       # 管理后台 (Vue 3 + Element Plus)
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/index.ts      # 路由配置
│   │   ├── stores/              # Pinia 状态管理
│   │   ├── api/                 # API 请求封装
│   │   ├── utils/               # 工具函数
│   │   ├── components/          # 公共组件
│   │   └── views/               # 页面
│   │       ├── Dashboard.vue    # 仪表盘
│   │       ├── Login.vue        # 登录页
│   │       ├── AlumniVerify.vue # 校友认证审核
│   │       ├── AlumniList.vue   # 校友列表
│   │       ├── Associations.vue # 校友会管理
│   │       ├── Appointments.vue # 预约审批
│   │       ├── Activities.vue   # 活动管理
│   │       ├── Articles.vue     # 文章管理
│   │       └── Interviews.vue   # 风采管理
│
├── miniprogram/                 # 微信小程序
│   ├── project.config.json
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── utils/
│   │   ├── api.js               # 请求封装
│   │   └── auth.js              # 认证工具
│   ├── components/              # 公共组件
│   │   ├── alumni-card/         # 校友卡组件
│   │   └── nav-bar/             # 自定义导航栏
│   ├── images/                  # 静态图片
│   └── pages/
│       ├── index/               # 首页
│       ├── alumni-card/         # 我的校友卡
│       ├── associations/        # 地区校友会
│       ├── associations/detail/ # 校友会详情
│       ├── appointment/         # 返校预约
│       ├── appointment/create/  # 新建预约
│       ├── activities/          # 活动列表
│       ├── activities/detail/   # 活动详情
│       ├── articles/            # 文章列表
│       ├── articles/detail/     # 文章详情
│       └── profile/             # 个人中心
│
├── docker/                      # Docker 配置
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── nginx.conf
│
└── docs/
    └── api.md                   # API 文档
```

---

## 六、任务拆解（按依赖顺序执行）

### 阶段零：环境准备
- [ ] **T-00** 安装开发环境：Python 3.11+、Node.js 18+、PostgreSQL 15+、微信开发者工具
- [ ] **T-01** 创建 PostgreSQL 数据库 `alumni_card`，配置连接信息
- [ ] **T-02** 填写 `backend/.env` 文件（数据库、JWT密钥、微信AppID/Secret）

### 阶段一：后端基础（优先级最高，其他模块依赖）

**T-10 项目骨架**
- [ ] 创建 FastAPI 应用入口 `app/main.py`（含 CORS 配置、路由注册、启动事件）
- [ ] 创建 `app/core/config.py`（从 .env 读取所有配置）
- [ ] 创建 `app/core/database.py`（异步数据库引擎 + session 工厂）

**T-11 用户 + 认证系统**
- [ ] 创建 `app/models/user.py`（User + AlumnusInfo 模型）
- [ ] 创建 `app/core/security.py`（JWT 生成/验证、密码哈希）
- [ ] 创建 `app/schemas/user.py`（Pydantic 请求/响应 schema）
- [ ] 创建 `app/api/v1/auth.py`：
  - `POST /auth/wechat-login`：接收 `code`，调微信接口获取 openid，创建或返回用户 + JWT token
  - `GET /auth/profile`：返回当前用户信息 + 校友认证状态
  - `PUT /auth/profile`：更新昵称、手机号等
  - `POST /auth/alumni-verify`：提交校友认证信息（姓名、学号、院系、证件照）
- [ ] 创建 `app/api/v1/alumni.py`（管理员审核接口）

**T-12 数据库迁移**
- [ ] 配置 Alembic
- [ ] 执行首次迁移，生成所有表

### 阶段二：核心业务 API

**T-20 地区校友会**
- [ ] 创建 `app/models/association.py`
- [ ] 创建 `app/schemas/association.py`
- [ ] 创建 `app/api/v1/associations.py`：
  - 列表（支持省市区筛选、位置排序）
  - 详情（含成员列表预览）
  - 申请加入/退出
  - 管理员 CRUD

**T-21 返校预约**
- [ ] 创建 `app/models/appointment.py`
- [ ] 创建 `app/schemas/appointment.py`
- [ ] 创建 `app/api/v1/appointments.py`：
  - 用户提交预约（含同行人）
  - 我的预约列表 + 详情
  - 取消预约
  - 管理员审批（通过时生成二维码，拒绝时填写原因）
- [ ] 实现二维码生成（`qrcode` 库生成图片，存储路径写入数据库）

**T-22 活动**
- [ ] 创建 `app/models/activity.py`
- [ ] 创建 `app/schemas/activity.py`
- [ ] 创建 `app/api/v1/activities.py`：
  - 活动列表（分页、状态筛选）
  - 活动详情
  - 报名/取消报名
  - 管理员 CRUD

**T-23 文章 + 校友风采**
- [ ] 创建 `app/models/article.py`（Article + Interview）
- [ ] 创建 `app/schemas/article.py`
- [ ] 创建 `app/api/v1/articles.py`：
  - 文章列表 + 详情（浏览量+1）
  - 校友风采列表 + 详情
  - 管理员 CRUD

**T-24 文件上传**
- [ ] 创建 `app/api/v1/upload.py`：
  - 接收图片上传，校验格式和大小（10MB限制）
  - 按日期生成子目录存储：`uploads/YYYY/MM/filename.ext`
  - 返回可访问的图片 URL

### 阶段三：管理后台

**T-30 项目初始化**
- [ ] Vite + Vue 3 + Element Plus 项目创建
- [ ] 配置路由、Axios 封装、Pinia store
- [ ] 登录页（账号密码或微信扫码登录）

**T-31 功能页面**
- [ ] 仪表盘（数据概览：今日预约数、待审核数、校友总数等）
- [ ] 校友认证审核页（列表 + 通过/拒绝操作 + 证件照查看）
- [ ] 校友列表页（搜索、筛选、详情查看）
- [ ] 校友会管理页（增删改查 + 成员列表）
- [ ] 预约审批页（列表 + 通过/拒绝 + 生成二维码预览）
- [ ] 活动管理页（增删改查 + 报名名单查看）
- [ ] 文章管理页（添加链接、编辑、发布/下架）
- [ ] 校友风采管理页（富文本编辑器 + 发布管理）

### 阶段四：微信小程序

**T-40 项目骨架**
- [ ] 创建 `project.config.json`、`app.json`、`app.js`、`app.wxss`
- [ ] 配置 TabBar（首页、校友会、活动、我的）
- [ ] 封装 `utils/api.js`（wx.request 封装 + token 管理 + 401 自动跳登录）
- [ ] 封装 `utils/auth.js`（wx.login 获取 code + 调后端登录接口 + 存储 token）

**T-41 页面开发**
- [ ] **首页**：轮播图 + 功能入口（校友卡、校友会、返校预约、活动、文章）+ 最新活动/风采展示
- [ ] **校友卡页**：
  - 未认证状态 → 引导填写校友信息 + 上传证件照
  - 审核中状态 → 提示等待审核
  - 已认证状态 → 展示电子校友卡（姓名、学号、院系、入学年份），带学校Logo背景
- [ ] **地区校友会页**：
  - 顶部搜索栏（省市区筛选）
  - 列表展示（名称、地址、成员数、会长）
  - 点击进入详情 → 地图显示位置 + 联系方式 + 加入/退出按钮
- [ ] **返校预约页**：
  - 预约列表（状态标签：审核中/已通过/已拒绝）
  - 新建预约 → 选择日期 + 填写目的 + 添加同行人 + 提交
  - 已通过预约 → 展示二维码（入校凭证）
- [ ] **活动页**：
  - 活动列表（封面图 + 标题 + 时间 + 地点 + 报名人数）
  - 活动详情 → 报名/取消报名按钮
- [ ] **文章/风采页**：
  - 公众号文章列表（封面 + 标题 + 摘要）→ 点击跳转原文链接
  - 校友风采列表（人物头像 + 姓名 + 简介）→ 详情页
- [ ] **个人中心页**：
  - 头像 + 昵称 + 认证状态
  - 我的预约、我的活动、我加入的校友会
  - 关于/设置

### 阶段五：部署上线

**T-50 Docker 化**
- [ ] 编写 `Dockerfile.backend`（Python + FastAPI）
- [ ] 编写 `docker-compose.yml`（fastapi + postgres + nginx）
- [ ] 编写 `nginx.conf`（反向代理 + 静态资源）

**T-51 部署**
- [ ] 购买云服务器、配置安全组、安装 Docker
- [ ] `docker-compose up -d` 启动服务
- [ ] 配置域名 + HTTPS 证书
- [ ] 微信小程序后台配置服务器域名（request合法域名、uploadFile合法域名）

**T-52 上线检查**
- [ ] 微信小程序提交审核
- [ ] 管理后台功能全流程测试
- [ ] 数据备份策略配置

---

## 七、关键业务逻辑说明

### 7.1 微信登录流程
```
小程序端                         后端                        微信服务器
  │                              │                             │
  │── wx.login() ──────────────────────────────────────────→  │
  │←── code ───────────────────────────────────────────────  │
  │                              │                             │
  │── POST /auth/wechat-login ──→│                             │
  │   { code }                   │── code2session(code) ───→ │
  │                              │←── openid, session_key ──  │
  │                              │── 查/建用户                 │
  │                              │── 生成 JWT token            │
  │←── { token, user } ─────────│                             │
  │                              │                             │
  │── 存储 token 到本地缓存       │                             │
```

### 7.2 校友认证流程
```
1. 微信登录后，用户进入校友卡页面
2. 填写：真实姓名、学号、院系、专业、入学年份、学历
3. 上传毕业证/学位证/学生证照片
4. 提交认证 → 状态变为 pending
5. 管理员在后台审核 → 通过/拒绝（拒绝时填写原因）
6. 审核通过 → 生成电子校友卡
```

### 7.3 返校预约二维码
```
1. 已认证用户提交预约（日期+同行人+目的）
2. 管理员审批通过
3. 后端生成唯一预约码 → 用 qrcode 库生成二维码图片
4. 二维码内容：预约ID + 校友姓名 + 日期 + 签名（防伪）
5. 用户在小程序查看/下载二维码
6. 门卫扫码验证
```

### 7.4 权限说明
| 角色 | 权限范围 |
|------|---------|
| 未登录 | 仅微信登录接口 |
| 已登录未认证 | 查看文章/活动/校友会，提交认证 |
| 已认证校友 | 全部浏览功能 + 预约 + 报名 + 加入校友会 |
| 管理员 | 所有权限 + 后台管理 |

---

## 八、开发约定

1. **代码风格**：后端遵循 PEP8，前端遵循 ESLint + Prettier
2. **Git 提交**：`feat:` / `fix:` / `refactor:` / `docs:` 前缀
3. **API 响应格式**：统一 `{ code: 0, message: "ok", data: {...} }`
4. **分页格式**：`{ items: [...], total: 100, page: 1, page_size: 20 }`
5. **错误处理**：后端抛 HTTPException，前端 toast 提示
6. **时间格式**：统一使用 ISO 8601 (`2024-01-01T00:00:00`)
7. **.env 文件不提交**：使用 `.env.example` 作为模板
