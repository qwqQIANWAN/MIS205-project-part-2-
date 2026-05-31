import React, { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
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
        <View key={item.id} className={styles.card} onClick={() => Taro.setClipboardData({ data: item.url })}>
          <Text className={styles.title}>{item.title}</Text>
          <Text className={styles.summary}>{item.summary}</Text>
          <Text className={styles.source}>来源：{item.source}，点击复制链接</Text>
        </View>
      ))}
    </View>
  );
}

export default ArticlesPage;
