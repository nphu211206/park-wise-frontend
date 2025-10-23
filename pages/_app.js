// pages/_app.js (PHIÊN BẢN ĐẲNG CẤP - Đã thêm AuthProvider)

import '../styles/globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { AuthProvider } from '../context/AuthContext'; // Import AuthProvider

config.autoAddCss = false;

function MyApp({ Component, pageProps }) {
  return (
    // Bọc ứng dụng trong AuthProvider
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;