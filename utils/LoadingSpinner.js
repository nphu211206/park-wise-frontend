// components/utils/LoadingSpinner.js (PHIÊN BẢN ĐẲNG CẤP - Tái sử dụng)

import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = "Đang tải...", fullScreen = false }) => {
  const containerClasses = fullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900" // Style full màn hình
    : "flex flex-col items-center justify-center text-center p-4"; // Style inline

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        loop: Infinity,
        ease: "linear",
        duration: 1
      }
    }
  };

  const textVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { delay: 0.3, duration: 0.5 } }
  };


  return (
    <div className={containerClasses}>
      <motion.div
        className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full mb-4"
        variants={spinnerVariants}
        animate="animate"
        aria-label="Loading indicator" // Accessibility
      />
      <motion.p
        className="text-lg font-medium text-gray-600 dark:text-gray-400"
        variants={textVariants}
        initial="hidden"
        animate="visible"
      >
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;