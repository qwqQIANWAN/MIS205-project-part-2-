import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { getProfile } from '@/services/api';
import type { UserProfile } from '@/types';
import styles from './index.module.scss';

function AlumniCardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getProfile().then(setProfile).catch((error) => console.error('[AlumniCard] load failed', error));
  }, []);

  return (
    <View className={styles.container}>
      <View className={styles.card}>
        <Text className={styles.title}>sx校友卡</Text>
        <Text className={styles.meta}>{profile?.nickname}</Text>
        <Text className={styles.meta}>{profile?.department} - {profile?.grade} 级</Text>
      </View>
      <View className={styles.panel}>
        <Text className={styles.status}>{profile?.alumniStatus || '待审核'}</Text>
        <Text className={styles.desc}>当前演示版已展示认证状态与校友身份信息，后续可继续接入证件上传与人工审核流程。</Text>
      </View>
    </View>
  );
}

export default AlumniCardPage;
