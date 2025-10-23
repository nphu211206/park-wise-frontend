// next.config.ts (PHIÊN BẢN ĐẲNG CẤP - Cấu hình Alias trực tiếp - TypeScript)
import path from 'path';
import { Configuration as WebpackConfiguration } from 'webpack'; // Import type cho Webpack config
import { NextConfig } from 'next'; // Import type cho Next.js config

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // --- Cấu hình Webpack để định nghĩa Alias (TypeScript) ---
  webpack: (
    config: WebpackConfiguration, // Thêm type annotation cho config
    { buildId, dev, isServer, defaultLoaders, webpack }
  ) => {
    // Đảm bảo resolve.alias tồn tại
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    // Thêm cấu hình alias (Dùng path.join để đảm bảo đường dẫn đúng)
    // Lưu ý: Cần xử lý alias cho cả object và array (tùy phiên bản Webpack/Next)
    if (typeof config.resolve.alias === 'object' && config.resolve.alias !== null) {
         config.resolve.alias['@'] = path.join(__dirname, './'); // Quan trọng: Ánh xạ '@' tới thư mục gốc './'
    }


    // Trả về config đã sửa đổi
    return config;
  },
};

export default nextConfig; // Dùng export default trong TS