export default defineAppConfig({
  pages: [
    'pages/alumni/index',
    'pages/organization/index',
    'pages/index/index',
    'pages/service/index',
    'pages/register/index',
    'pages/profile/register/index',
    'pages/profile/complete/index',
    'pages/profile/teacher-bind/index',
    'pages/profile/index',
    'pages/alumni-card/index',
    'pages/associations/index',
    'pages/appointment/index',
    'pages/appointment/create/index',
    'pages/teacher/review/index',
    'pages/activities/index',
    'pages/activities/detail/index',
    'pages/articles/index',
    'pages/articles/detail/index',
    'pages/interviews/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    backgroundColor: '#f4f7fb',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'sx校友卡',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    custom: true,
    color: '#86909c',
    selectedColor: '#fe0000',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/alumni/index', text: '校友' },
      { pagePath: 'pages/organization/index', text: '组织' },
      { pagePath: 'pages/index/index', text: '主页' },
      { pagePath: 'pages/service/index', text: '服务' },
      { pagePath: 'pages/register/index', text: '注册' }
    ]
  }
})
