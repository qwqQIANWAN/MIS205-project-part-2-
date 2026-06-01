import React, { useState } from 'react';
import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { submitVerification, uploadCertificateImage } from '@/services/api';
import styles from './index.module.scss';

function CompleteProfilePage() {
  const [studentId, setStudentId] = useState('');
  const [graduationYear, setGraduationYear] = useState('2020');
  const [className, setClassName] = useState('高三(2)班');
  const [currentUniversity, setCurrentUniversity] = useState('');
  const [currentCollege, setCurrentCollege] = useState('');
  const [currentMajor, setCurrentMajor] = useState('');
  const [certificateImage, setCertificateImage] = useState('');

  const handleChooseImage = async () => {
    try {
      const chooseResult = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] });
      const filePath = chooseResult.tempFilePaths?.[0];
      if (!filePath) return;

      Taro.showLoading({ title: '上传中' });
      const url = await uploadCertificateImage(filePath);
      setCertificateImage(url);
      Taro.hideLoading();
      Taro.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      console.error('[CompleteProfile] upload failed', error);
      Taro.showToast({ title: '上传失败', icon: 'none' });
    }
  };

  const handleSubmit = async () => {
    if (!graduationYear || !className || !currentUniversity || !currentCollege || !currentMajor || !certificateImage) {
      Taro.showToast({ title: '请补全资料并上传证件', icon: 'none' });
      return;
    }

    try {
      await submitVerification({
        studentId,
        graduationYear,
        className,
        currentUniversity,
        currentCollege,
        currentMajor,
        certificateImage,
      });
      Taro.showToast({ title: '已提交审核', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 600);
    } catch (error) {
      console.error('[CompleteProfile] submit failed', error);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.panel}>
        <Text className={styles.title}>补充高中与高校信息</Text>
        <Text className={styles.desc}>请上传学生证或毕业证，管理员会在后台人工审核通过后发放正式校友身份。</Text>

        <Text className={styles.label}>高中学号/证件编号（可选）</Text>
        <Input className={styles.input} value={studentId} placeholder='可填写学号或毕业证编号' onInput={(event) => setStudentId(event.detail.value)} />

        <Text className={styles.label}>毕业届次</Text>
        <Input className={styles.input} value={graduationYear} placeholder='如 2020' onInput={(event) => setGraduationYear(event.detail.value)} />

        <Text className={styles.label}>高中班级</Text>
        <Input className={styles.input} value={className} placeholder='如 高三(2)班' onInput={(event) => setClassName(event.detail.value)} />

        <Text className={styles.label}>当前就读高校</Text>
        <Input className={styles.input} value={currentUniversity} placeholder='请输入高校名称' onInput={(event) => setCurrentUniversity(event.detail.value)} />

        <Text className={styles.label}>当前院系</Text>
        <Input className={styles.input} value={currentCollege} placeholder='请输入院系名称' onInput={(event) => setCurrentCollege(event.detail.value)} />

        <Text className={styles.label}>当前专业</Text>
        <Input className={styles.input} value={currentMajor} placeholder='请输入专业名称' onInput={(event) => setCurrentMajor(event.detail.value)} />

        <Text className={styles.label}>学生证 / 毕业证</Text>
        <View className={styles.uploadCard} onClick={handleChooseImage}>
          <Text className={styles.uploadText}>{certificateImage ? '重新上传证件照片' : '点击上传证件照片'}</Text>
          <Text className={styles.uploadHint}>
            {certificateImage ? `已上传：${certificateImage}` : '支持上传学生证、毕业证照片，便于管理员人工审核'}
          </Text>
        </View>

        <View className={styles.submit} onClick={handleSubmit}>
          <Text className={styles.submitText}>提交人工审核</Text>
        </View>
      </View>
    </View>
  );
}

export default CompleteProfilePage;
