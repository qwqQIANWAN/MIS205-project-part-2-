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
        <Text className={styles.meta}>{profile?.realName || profile?.nickname}</Text>
        <Text className={styles.meta}>{profile?.className} · {profile?.graduationYear}届</Text>
      </View>
      <View className={styles.panel}>
        <Text className={styles.status}>{profile?.alumniStatus || '待审核'}</Text>
        <Text className={styles.desc}>当前高校：{profile?.currentUniversity || '待完善'}</Text>
        <Text className={styles.desc}>当前院系：{profile?.currentCollege || '待完善'}</Text>
        <Text className={styles.desc}>当前专业：{profile?.currentMajor || '待完善'}</Text>
        <Text className={styles.desc}>审核备注：{profile?.verificationRemark || '暂无备注'}</Text>
      </View>
    </View>
  );
}

export default AlumniCardPage;
