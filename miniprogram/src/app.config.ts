export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/associations/index',
    'pages/activities/index',
    'pages/profile/index',
    'pages/alumni-card/index',
    'pages/appointment/index',
    'pages/appointment/create/index',
    'pages/activities/detail/index',
    'pages/articles/index',
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
    color: '#86909c',
    selectedColor: '#0f6fff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/associations/index', text: '校友会' },
      { pagePath: 'pages/activities/index', text: '活动' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  }
})
