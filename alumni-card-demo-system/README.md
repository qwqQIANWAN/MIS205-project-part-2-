# 高中校友卡 Demo

这是一个独立于现有项目的课堂展示版，使用浏览器本地存储模拟完整流程：

- 模拟微信登录
- 提交注册信息
- 网页端接收并审核注册
- 审核通过后提交入校预约
- 后台查看并处理预约

## 打开方式

```bash
python -m http.server 8899
```

- 用户端：`http://localhost:8899/`
- 后台端：`http://localhost:8899/admin.html`
