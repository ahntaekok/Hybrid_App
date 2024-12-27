import React, { useEffect } from 'react';
import { BackHandler, Alert, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function App() {
  const webviewRef = React.useRef(null); // WebView 참조
  const canGoBackRef = React.useRef(false); // 이전 페이지 여부 저장

  useEffect(() => {
    const enablePortrait = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT); // 기기 방향에 따라 자동 조정
    };

    enablePortrait();

    // 뒤로가기 버튼 동작 정의
    const backAction = () => {
      if (canGoBackRef.current) {
        webviewRef.current.goBack(); // 웹뷰의 이전 페이지로 이동
        return true; // 기본 동작 차단
      }

      // 이전 페이지가 없을 경우 종료 알림
      Alert.alert('앱을 종료하시겠습니까?', '', [
        { text: '취소', style: 'cancel' },
        { text: '종료', onPress: () => BackHandler.exitApp() },
      ]);
      return true; // 기본 동작 차단
    };

    // BackHandler 이벤트 등록 (Android 전용)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove(); // 컴포넌트 언마운트 시 이벤트 제거
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        source={{ uri: 'https://raonpick.com/' }} // 웹앱 URL
        onNavigationStateChange={(navState) => {
          canGoBackRef.current = navState.canGoBack; // 이전 페이지 여부 업데이트
        }}
        allowsBackForwardNavigationGestures={true} // 제스처 활성화
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight
  },
});