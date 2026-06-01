import React, { useEffect } from 'react';
import { useDidHide, useDidShow } from '@tarojs/taro';
import './app.scss';

function App(props: { children: React.ReactNode }) {
  useEffect(() => {
    console.info('[App] miniapp mounted');
  }, []);

  useDidShow(() => {
    console.info('[App] visible');
  });

  useDidHide(() => {
    console.info('[App] hidden');
  });

  return props.children;
}

export default App;
