// pages/_app.js (PHIÊN BẢN ĐẲNG CẤP - Import CSS Toàn cục)

// Import file CSS "đẳng cấp" của chúng ta
//import '../styles/globals.css';
import '/styles/globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false; // Ngăn FontAwesome tự thêm CSS (Next.js sẽ xử lý)

function MyApp({ Component, pageProps }) {
  // Component là trang hiện tại (ví dụ: ParkingLotDetailPage)
  // pageProps là các props được truyền vào trang đó
  return <Component {...pageProps} />;
}

export default MyApp;