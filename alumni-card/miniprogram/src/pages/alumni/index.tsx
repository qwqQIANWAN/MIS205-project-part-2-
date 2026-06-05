import React, { useEffect, useMemo, useState } from 'react';
import { Image, Input, Text, View } from '@tarojs/components';
import { getAlumniDirectory, getProfile } from '@/services/api';
import type { AlumniDirectoryItem, UserProfile } from '@/types';
import styles from './index.module.scss';

type AlumniTab = '推荐' | '全部' | '同城' | '同行' | '同院';

const tabs: AlumniTab[] = ['推荐', '全部', '同城', '同行', '同院'];

function AlumniPage() {
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<AlumniTab>('全部');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<AlumniDirectoryItem[]>([]);

  useEffect(() => {
    getProfile().then(setProfile).catch((error) => console.error('[Alumni] profile failed', error));
  }, []);

  useEffect(() => {
    getAlumniDirectory(keyword)
      .then(setItems)
      .catch((error) => console.error('[Alumni] directory failed', error));
  }, [keyword]);

  const visibleList = useMemo(() => {
    return items.filter((item, index) => {
      if (activeTab === '推荐') {
        return index < 10;
      }
      if (activeTab === '同城') {
        return Boolean(profile?.currentUniversity && item.currentUniversity === profile.currentUniversity);
      }
      if (activeTab === '同行') {
        return Boolean(profile?.currentMajor && item.currentMajor === profile.currentMajor);
      }
      if (activeTab === '同院') {
        return Boolean(profile?.currentCollege && item.currentCollege === profile.currentCollege);
      }
      return true;
    });
  }, [activeTab, items, profile?.currentCollege, profile?.currentMajor, profile?.currentUniversity]);

  return (
    <View className={styles.container}>
      <View className={styles.topBanner}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>○</Text>
          <Input
            className={styles.searchInput}
            value={keyword}
            placeholder='搜索你的校友'
            placeholderClass={styles.searchPlaceholder}
            onInput={(event) => setKeyword(event.detail.value)}
          />
        </View>
        <View className={styles.tabRow}>
          {tabs.map((tab) => (
            <Text
              key={tab}
              className={`${styles.tabText} ${activeTab === tab ? styles.tabTextActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Text>
          ))}
        </View>
      </View>

      <View className={styles.listWrap}>
        {visibleList.map((item) => (
          <View key={item.id} className={styles.listItem}>
            <Image className={styles.avatar} src={item.avatarUrl || 'https://picsum.photos/seed/alumni/120/120'} mode='aspectFill' />
            <View className={styles.textWrap}>
              <Text className={styles.name}>{item.realName}</Text>
              <Text className={styles.subText}>
                {[item.currentUniversity, item.currentCollege, item.currentMajor].filter(Boolean).join(' · ') || item.className || '校友用户'}
              </Text>
            </View>
          </View>
        ))}
        {!visibleList.length ? <Text className={styles.emptyText}>没有找到匹配的校友</Text> : null}
      </View>
    </View>
  );
}

export default AlumniPage;
