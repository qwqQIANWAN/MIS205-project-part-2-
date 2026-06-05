import React, { useEffect, useMemo, useState } from 'react';
import { Image, Input, Text, View } from '@tarojs/components';
import { getAssociations } from '@/services/api';
import type { AssociationItem } from '@/types';
import styles from './index.module.scss';

type OrganizationTab = '推荐' | '全部' | '地区' | '书院' | '院系';

const tabs: OrganizationTab[] = ['推荐', '全部', '地区', '书院', '院系'];

function OrganizationPage() {
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<OrganizationTab>('全部');
  const [items, setItems] = useState<AssociationItem[]>([]);

  useEffect(() => {
    getAssociations().then(setItems).catch((error) => console.error('[Organization] associations failed', error));
  }, []);

  const visibleGroups = useMemo(() => {
    const filtered = items.filter((item, index) => {
      const matchesKeyword = !keyword.trim() || item.name.includes(keyword.trim());
      if (!matchesKeyword) return false;

      if (activeTab === '推荐') {
        return index < 10;
      }
      if (activeTab === '地区') {
        return item.name.includes('校友会') || Boolean(item.city || item.province);
      }
      if (activeTab === '书院') {
        return item.name.includes('俱乐部') || item.name.includes('书院');
      }
      if (activeTab === '院系') {
        return item.name.includes('学院') || item.name.includes('系') || item.name.includes('工程');
      }
      return true;
    });

    return filtered.reduce<Array<{ letter: string; items: AssociationItem[] }>>((groups, item) => {
      const firstLetter = item.name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstLetter) ? firstLetter : item.name.charAt(0);
      const current = groups.find((group) => group.letter === letter);
      if (current) {
        current.items.push(item);
      } else {
        groups.push({ letter, items: [item] });
      }
      return groups;
    }, []);
  }, [activeTab, items, keyword]);

  return (
    <View className={styles.container}>
      <View className={styles.topBanner}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>○</Text>
          <Input
            className={styles.searchInput}
            value={keyword}
            placeholder='搜索组织'
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
        {visibleGroups.map((group) => (
          <View key={group.letter}>
            <Text className={styles.letter}>{group.letter}</Text>
            {group.items.map((item) => (
              <View key={item.id} className={styles.listItem}>
                <Image className={styles.logo} src={item.coverImage || 'https://picsum.photos/seed/association/120/120'} mode='aspectFill' />
                <View className={styles.textWrap}>
                  <Text className={styles.name}>{item.name}</Text>
                  <Text className={styles.subText}>
                    {[item.city, item.address].filter(Boolean).join(' · ') || item.description || '校友组织'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        {!visibleGroups.length ? <Text className={styles.emptyText}>没有找到匹配的组织</Text> : null}
      </View>
    </View>
  );
}

export default OrganizationPage;
