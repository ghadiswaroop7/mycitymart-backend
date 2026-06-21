import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export interface FirebaseRecaptchaVerifierModalProps {
  firebaseConfig: any;
  attemptInvisibleVerification?: boolean;
}

const FirebaseRecaptchaVerifierModal = forwardRef((props: FirebaseRecaptchaVerifierModalProps, ref) => {
  const { firebaseConfig, attemptInvisibleVerification } = props;
  const [visible, setVisible] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((token: string) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    verify: () => {
      return new Promise<string>((resolve) => {
        setResolvePromise(() => resolve);
        setVisible(true);
      });
    },
    type: 'recaptcha',
    _reset: () => {}
  }));

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'resolved' && data.token) {
        if (resolvePromise) {
          resolvePromise(data.token);
        }
        setVisible(false);
      } else if (data.type === 'error') {
        console.error('Recaptcha error:', data.error);
        if (resolvePromise) {
          resolvePromise('');
        }
        setVisible(false);
      }
    } catch (e) {
      // Just raw token if not JSON
      if (resolvePromise) {
        resolvePromise(event.nativeEvent.data);
      }
      setVisible(false);
    }
  };

  if (!visible) return null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f9fafb;
        }
        #recaptcha-container {
          display: inline-block;
        }
      </style>
      <!-- Load Firebase Compatibility SDKs -->
      <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div id="recaptcha-container"></div>
      <script>
        try {
          const firebaseConfig = ${JSON.stringify(firebaseConfig)};
          firebase.initializeApp(firebaseConfig);
          
          window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            size: '${attemptInvisibleVerification ? 'invisible' : 'normal'}',
            callback: (token) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'resolved', token }));
            },
            'expired-callback': () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'expired' }));
            },
            'error-callback': (error) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: error.message }));
            }
          });
          
          window.recaptchaVerifier.render().then((widgetId) => {
            if ('${attemptInvisibleVerification ? 'true' : 'false'}' === 'true') {
              window.recaptchaVerifier.verify();
            }
          });
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.message }));
        }
      </script>
    </body>
    </html>
  `;

  const baseUrl = firebaseConfig.authDomain ? `https://${firebaseConfig.authDomain}` : undefined;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={() => {
        setVisible(false);
        if (resolvePromise) resolvePromise('');
      }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              setVisible(false);
              if (resolvePromise) resolvePromise('');
            }} 
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeBtn: {
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#008B45',
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});

export default FirebaseRecaptchaVerifierModal;
