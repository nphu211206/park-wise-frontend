// components/utils/ErrorDisplay.js (PHIÊN BẢN ĐẲNG CẤP - Tái sử dụng)

import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Import các icon cần thiết (cần cài đặt: npm install @fortawesome/free-solid-svg-icons)
import { faExclamationTriangle, faTimesCircle, faSearchMinus, faServer } from '@fortawesome/free-solid-svg-icons';

const ErrorDisplay = ({
    message = "Đã xảy ra lỗi không mong muốn.",
    details = null, // Hiển thị chi tiết lỗi nếu có (cho dev hoặc admin)
    icon = "fa-exclamation-triangle", // Icon mặc định
    fullScreen = false,
    showRetryButton = false, // Tùy chọn hiển thị nút thử lại
    onRetry = () => {} // Hàm callback khi nhấn nút thử lại
}) => {
  const containerClasses = fullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center p-6 bg-red-50 dark:bg-red-900/20"
    : "flex flex-col items-center text-center p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg";

   // Mapping icon string to FontAwesome icon object
   const getIconObject = (iconName) => {
       switch (iconName) {
           case 'fa-times-circle': return faTimesCircle;
           case 'fa-search-minus': return faSearchMinus;
           case 'fa-server': return faServer;
           case 'fa-exclamation-triangle':
           default: return faExclamationTriangle;
       }
   };

    const iconObject = getIconObject(icon);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 15, stiffness: 100 } }
  };

  return (
    <motion.div
        className={`${containerClasses} text-red-700 dark:text-red-300`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="alert" // Accessibility
    >
      {iconObject && (
        <FontAwesomeIcon icon={iconObject} className="text-4xl md:text-5xl mb-4 text-red-400 dark:text-red-500" />
      )}
      <h2 className="text-xl md:text-2xl font-semibold mb-2">Thông báo lỗi</h2>
      <p className="mb-4 text-red-600 dark:text-red-400">{message}</p>

      {/* Hiển thị chi tiết lỗi (chỉ trong môi trường dev hoặc cho admin?) */}
      {details && process.env.NODE_ENV === 'development' && (
        <pre className="text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto max-w-full text-left mb-4">
          <code>{typeof details === 'object' ? JSON.stringify(details, null, 2) : details}</code>
        </pre>
      )}

      {showRetryButton && (
        <motion.button
            onClick={onRetry}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
             <i className="fas fa-redo mr-2"></i> Thử lại
        </motion.button>
      )}
    </motion.div>
  );
};

export default ErrorDisplay;