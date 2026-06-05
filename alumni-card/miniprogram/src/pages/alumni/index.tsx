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

  const stats = useMemo(
    () => [
      { label: '推荐校友', value: String(items.slice(0, 10).length) },
      { label: '当前筛选', value: String(visibleList.length) },
      { label: '我的标签', value: [profile?.currentUniversity, profile?.currentMajor].filter(Boolean).length.toString() },
    ],
    [items, profile?.currentMajor, profile?.currentUniversity, visibleList.length],
  );

  return (
    <View className={styles.container}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>校友联络录</Text>
        <Text className={styles.heroDesc}>
          按地区、专业和学院快速找到你想联系的校友，延续校园里的熟悉连接。
        </Text>
        <View className={styles.metrics}>
          {stats.map((item) => (
            <View key={item.label} className={styles.metricCard}>
              <Text className={styles.metricValue}>{item.value}</Text>
              <Text className={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.searchCard}>
        <Text className={styles.sectionTitle}>查找校友</Text>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>○</Text>
          <Input
            className={styles.searchInput}
            value={keyword}
            placeholder='输入姓名、院校或专业关键词'
            placeholderClass={styles.searchPlaceholder}
            onInput={(event) => setKeyword(event.detail.value)}
          />
        </View>
        <View className={styles.tabRow}>
          {tabs.map((tab) => (
            <View
              key={tab}
              className={`${styles.tabChip} ${activeTab === tab ? styles.tabChipActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <Text className={`${styles.tabText} ${activeTab === tab ? styles.tabTextActive : ''}`}>{tab}</Text>
            </View>
          ))}
        </View>
      </View>

      {profile ? (
        <View className={styles.profileCard}>
          <Text className={styles.sectionTitle}>我的校友画像</Text>
          <Text className={styles.profileText}>学校：{profile.currentUniversity || '待完善'}</Text>
          <Text className={styles.profileText}>学院：{profile.currentCollege || '待完善'}</Text>
          <Text className={styles.profileText}>专业：{profile.currentMajor || '待完善'}</Text>
        </View>
      ) : null}

      <View className={styles.listWrap}>
        {visibleList.map((item) => (
          <View key={item.id} className={styles.listItem}>
            <Image className={styles.avatar} src={item.avatarUrl || 'https://picsum.photos/seed/alumni/120/120'} mode='aspectFill' />
            <View className={styles.cardBody}>
              <View className={styles.cardHeader}>
                <Text className={styles.name}>{item.realName}</Text>
                <Text className={styles.badge}>{item.graduationYear || '校友'}</Text>
              </View>
              <Text className={styles.subText}>
                {[item.currentUniversity, item.currentCollege, item.currentMajor].filter(Boolean).join(' · ') || item.className || '校友用户'}
              </Text>
              <Text className={styles.metaText}>班级 / 身份：{item.className || '资料待完善'}</Text>
            </View>
          </View>
        ))}
        {!visibleList.length ? <Text className={styles.emptyText}>没有找到匹配的校友</Text> : null}
      </View>
    </View>
  );
}

export default AlumniPage;
