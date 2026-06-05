import React, { useEffect, useMemo, useState } from 'react';
import { Image, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getAssociations, joinAssociation } from '@/services/api';
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

  const stats = useMemo(
    () => [
      { label: '组织总数', value: String(items.length) },
      { label: '已加入', value: String(items.filter((item) => item.isJoined).length) },
      { label: '当前筛选', value: String(visibleGroups.reduce((sum, group) => sum + group.items.length, 0)) },
    ],
    [items, visibleGroups],
  );

  const handleAssociationClick = async (item: AssociationItem) => {
    if (item.isJoined) {
      Taro.showActionSheet({
        itemList: ['已加入该组织', '暂不处理'],
      });
      return;
    }

    const result = await Taro.showActionSheet({
      itemList: ['加入组织', '暂不加入'],
    }).catch(() => null);

    if (!result || result.tapIndex !== 0) {
      return;
    }

    try {
      await joinAssociation(item.id);
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? { ...current, isJoined: true, memberCount: current.memberCount + 1 }
            : current,
        ),
      );
      Taro.showToast({ title: '已加入组织', icon: 'success' });
    } catch (error) {
      console.error('[Organization] join failed', error);
      Taro.showToast({ title: '加入失败，请稍后重试', icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>组织与校友会</Text>
        <Text className={styles.heroDesc}>
          查看地区组织、学院组织和兴趣社群，选择加入后即可持续接收校友活动联络。
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
        <Text className={styles.sectionTitle}>筛选组织</Text>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>○</Text>
          <Input
            className={styles.searchInput}
            value={keyword}
            placeholder='输入组织名称或城市'
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

      <View className={styles.listWrap}>
        {visibleGroups.map((group) => (
          <View key={group.letter} className={styles.groupBlock}>
            <Text className={styles.letter}>{group.letter}</Text>
            {group.items.map((item) => (
              <View key={item.id} className={styles.listItem} onClick={() => handleAssociationClick(item)}>
                <Image className={styles.logo} src={item.coverImage || 'https://picsum.photos/seed/association/120/120'} mode='aspectFill' />
                <View className={styles.cardBody}>
                  <View className={styles.cardHeader}>
                    <Text className={styles.name}>{item.name}</Text>
                    <View className={`${styles.joinTag} ${item.isJoined ? styles.joinTagActive : ''}`}>
                      <Text className={`${styles.joinTagText} ${item.isJoined ? styles.joinTagTextActive : ''}`}>
                        {item.isJoined ? '已加入' : '可加入'}
                      </Text>
                    </View>
                  </View>
                  <Text className={styles.subText}>
                    {[item.city, item.address].filter(Boolean).join(' · ') || item.description || '校友组织'}
                  </Text>
                  <View className={styles.metaRow}>
                    <Text className={styles.metaText}>会长：{item.presidentName || '待补充'}</Text>
                    <Text className={styles.metaText}>成员：{item.memberCount}</Text>
                  </View>
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
