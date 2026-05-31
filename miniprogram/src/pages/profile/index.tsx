import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getProfile } from '@/services/api';
import type { UserProfile } from '@/types';
import styles from './index.module.scss';

const entries = [
  { label: '我的校友卡', value: '查看认证状态与身份信息', url: '/pages/alumni-card/index' },
  { label: '我的预约', value: '查看返校申请记录', url: '/pages/appointment/index' },
  { label: '文章资讯', value: '浏览最新校友动态', url: '/pages/articles/index' },
  { label: '校友风采', value: '查看优秀校友故事', url: '/pages/interviews/index' },
];

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getProfile().then(setProfile).catch((error) => console.error('[Profile] load failed', error));
  }, []);

  return (
    <View className={styles.container}>
      <View className={styles.profileCard}>
        <Text className={styles.name}>{profile?.nickname || '校友用户'}</Text>
        <Text className={styles.meta}>{profile?.department} - {profile?.grade} 级</Text>
        <Text className={styles.meta}>认证状态：{profile?.alumniStatus}</Text>
      </View>

      <View className={styles.section}>
        {entries.map((item) => (
          <View key={item.label} className={styles.item} onClick={() => Taro.navigateTo({ url: item.url })}>
            <Text className={styles.label}>{item.label}</Text>
            <Text className={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default ProfilePage;
