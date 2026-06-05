import React, { useEffect, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getArticleDetail } from '@/services/api';
import type { ArticleItem } from '@/types';
import styles from './index.module.scss';

function ArticleDetailPage() {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleItem | null>(null);

  useEffect(() => {
    const id = Number(router.params.id || 0);
    getArticleDetail(id)
      .then(setArticle)
      .catch((error) => {
        console.error('[ArticleDetail] load failed', error);
        Taro.showToast({ title: '文章加载失败', icon: 'none' });
      });
  }, [router.params.id]);

  if (!article) {
    return <View className={styles.container} />;
  }

  return (
    <View className={styles.container}>
      {article.coverImage ? <Image className={styles.cover} src={article.coverImage} mode='aspectFill' /> : null}
      <View className={styles.card}>
        <Text className={styles.title}>{article.title}</Text>
        <Text className={styles.meta}>
          {article.source} · {article.category || '公众号文章'}
        </Text>
        {article.createdAt ? <Text className={styles.meta}>发布时间：{article.createdAt}</Text> : null}
        <Text className={styles.summary}>{article.summary}</Text>
        <View className={styles.action} onClick={() => Taro.setClipboardData({ data: article.url })}>
          <Text className={styles.actionText}>复制原文链接</Text>
        </View>
      </View>
    </View>
  );
}

export default ArticleDetailPage;
