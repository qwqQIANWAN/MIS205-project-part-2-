import React, { useEffect, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getArticles } from '@/services/api';
import type { ArticleItem } from '@/types';
import styles from './index.module.scss';

function ArticlesPage() {
  const [items, setItems] = useState<ArticleItem[]>([]);

  useEffect(() => {
    getArticles().then(setItems).catch((error) => console.error('[Articles] load failed', error));
  }, []);

  return (
    <View className={styles.container}>
      {items.map((item) => (
        <View key={item.id} className={styles.card} onClick={() => Taro.navigateTo({ url: `/pages/articles/detail/index?id=${item.id}` })}>
          {item.coverImage ? <Image className={styles.cover} src={item.coverImage} mode='aspectFill' /> : null}
          <Text className={styles.title}>{item.title}</Text>
          <Text className={styles.summary}>{item.summary}</Text>
          <Text className={styles.source}>来源：{item.source} · 点击查看详情</Text>
        </View>
      ))}
    </View>
  );
}

export default ArticlesPage;
