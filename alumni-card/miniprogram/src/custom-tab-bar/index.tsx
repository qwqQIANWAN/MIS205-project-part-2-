import React, { useEffect, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import homeEmblem from '@/assets/home-emblem.svg';

const tabs = [
  { text: '校友', path: '/pages/alumni/index', icon: '友' },
  { text: '组织', path: '/pages/organization/index', icon: '组' },
  { text: '主页', path: '/pages/index/index', icon: '徽', prominent: true },
  { text: '服务', path: '/pages/service/index', icon: '服' },
  { text: '注册', path: '/pages/register/index', icon: '注' },
];

function getCurrentRoute() {
  const pages = Taro.getCurrentPages();
  const current = pages[pages.length - 1];
  const route = current?.route || 'pages/index/index';
  return route.startsWith('/') ? route : `/${route}`;
}

function CustomTabBar() {
  const [currentPath, setCurrentPath] = useState('/pages/index/index');

  const syncCurrentPath = () => {
    setCurrentPath(getCurrentRoute());
  };

  useEffect(syncCurrentPath, []);
  useDidShow(syncCurrentPath);

  const handleSwitch = (path: string) => {
    if (path === currentPath) return;
    Taro.switchTab({ url: path });
    setCurrentPath(path);
  };

  return (
    <View className={styles.wrapper}>
      <View className={styles.bar}>
        {tabs.map((tab) => {
          const active = currentPath === tab.path;
          return (
            <View
              key={tab.path}
              className={`${styles.item} ${tab.prominent ? styles.itemProminent : ''}`}
              onClick={() => handleSwitch(tab.path)}
            >
              <View
                className={`${styles.iconWrap} ${active ? styles.iconWrapActive : ''} ${
                  tab.prominent ? styles.iconWrapProminent : ''
                }`}
              >
                {tab.prominent ? (
                  <Image className={styles.prominentImage} src={homeEmblem} mode='aspectFit' />
                ) : (
                  <Text className={styles.iconText}>{tab.icon}</Text>
                )}
              </View>
              <Text className={`${styles.label} ${active ? styles.labelActive : ''}`}>{tab.text}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default CustomTabBar;
