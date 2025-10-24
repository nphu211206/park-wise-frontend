// pages/login.js (PHIÊN BẢN ĐẲNG CẤP HOÀN THIỆN - Giai đoạn 1)
// Trang đăng nhập tích hợp lựa chọn vai trò, hiệu ứng, validation và kết nối AuthContext.

// --- Import các thư viện và thành phần cần thiết ---
import React, { useState, useEffect } from 'react'; // React hooks cơ bản
import { useAuth } from '../context/AuthContext';    // Hook quản lý xác thực global
import { useRouter } from 'next/router';          // Hook điều hướng của Next.js
import Link from 'next/link';                     // Component Link tối ưu của Next.js
import Head from 'next/head';                     // Component để quản lý thẻ <head> (SEO, title)
import { motion, AnimatePresence } from 'framer-motion'; // Thư viện tạo hiệu ứng chuyển động mượt mà
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Component hiển thị icon
import {
    faParking, faUser, faUserShield, faSpinner, faEye, faEyeSlash,
    faEnvelope, faPhone, faLock, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'; // Import các icon cụ thể
// (Bùng nổ) Cân nhắc import icon Google/Facebook khi tích hợp Social Login
// import { faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons';

// --- Component Chính: Trang Đăng nhập ---
const LoginPage = () => {
    // --- State cho Dữ liệu Form ---
    const [loginIdentifier, setLoginIdentifier] = useState(''); // Có thể là email hoặc SĐT
    const [password, setPassword] = useState('');
    const [loginAs, setLoginAs] = useState('user'); // Vai trò đăng nhập: 'user' hoặc 'admin'

    // --- State cho Trạng thái UI ---
    const [showPassword, setShowPassword] = useState(false); // Ẩn/hiện mật khẩu
    const [errorMessage, setErrorMessage] = useState('');     // Thông báo lỗi cụ thể cho form
    const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái đang gửi request

    // --- Lấy Context và Router ---
    const { login, isLoading: isAuthLoading, error: authError } = useAuth(); // Lấy hàm login, trạng thái loading và lỗi từ AuthContext
    const router = useRouter();

    // --- Xử lý khi người dùng submit form ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn trình duyệt reload trang
        setErrorMessage('');  // Xóa lỗi cũ trước khi submit mới
        setIsSubmitting(true); // Bắt đầu trạng thái loading của nút submit

        // --- (Đẳng cấp) Validation Phía Client Chi Tiết ---
        if (!loginIdentifier.trim() || !password.trim()) {
            setErrorMessage('Vui lòng nhập đầy đủ thông tin đăng nhập.');
            setIsSubmitting(false);
            return; // Dừng nếu thiếu thông tin
        }

        // (Bùng nổ) Có thể thêm validation phức tạp hơn cho email/SĐT ở đây nếu cần
        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
        // if (!emailRegex.test(loginIdentifier) && !phoneRegex.test(loginIdentifier)) {
        //     setErrorMessage('Email hoặc Số điện thoại không hợp lệ.');
        //     setIsSubmitting(false);
        //     return;
        // }

        try {
            // Gọi hàm login từ AuthContext
            // Truyền cả loginAs nếu backend cần (hiện tại backend tự xác định role)
            console.log(`Attempting login as ${loginAs} with identifier: ${loginIdentifier}`);
            await login(loginIdentifier, password);

            // --- Thành công ---
            // Chuyển hướng đã được xử lý bên trong hàm login của AuthContext
            // Không cần router.push ở đây nữa, giúp code gọn hơn và logic tập trung
            console.log('Login successful, redirecting...');
            // setIsSubmitting không cần set false vì đã chuyển trang

        } catch (error) {
            // --- Xử lý Lỗi ---
            console.error("Login failed:", error);
            // Ưu tiên hiển thị lỗi cụ thể từ API (do hàm login ném ra)
            setErrorMessage(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
            setIsSubmitting(false); // Kết thúc loading nút submit khi có lỗi
        }
        // finally không cần thiết vì thành công sẽ chuyển trang
    };

    // --- (Đẳng cấp) Hiệu ứng Chuyển động với Framer Motion ---
    const containerVariants = { // Hiệu ứng cho toàn bộ card
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    };
    const itemVariants = { // Hiệu ứng cho từng item bên trong (xuất hiện tuần tự)
        hidden: { opacity: 0, y: 15 },
        visible: (i) => ({ // Nhận index làm tham số tùy chỉnh delay
            opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" }
        }),
    };
    const inputFocusVariants = { // Hiệu ứng khi focus vào input
         focus: { scale: 1.01, boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)', transition: { duration: 0.2 } }
    };
    const buttonHoverTapVariants = { // Hiệu ứng cho nút bấm
        hover: { scale: 1.03, transition: { duration: 0.2 } },
        tap: { scale: 0.98 }
    };

    // --- Render Giao diện ---
    return (
        <>
            <Head>
                <title>Đăng nhập - ParkWise</title>
                <meta name="description" content="Đăng nhập vào hệ thống ParkWise để quản lý và đặt chỗ đỗ xe thông minh." />
            </Head>

            {/* Container chính, căn giữa nội dung */}
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-4 transition-colors duration-300">
                {/* Card Đăng nhập */}
                <motion.div
                    className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Phần Header Card */}
                    <div className="p-8 md:p-10 border-b border-gray-200 dark:border-gray-700 text-center">
                        <motion.div custom={0} variants={itemVariants}>
                            <FontAwesomeIcon icon={faParking} className="text-5xl text-blue-600 dark:text-blue-400 mb-4" />
                        </motion.div>
                        <motion.h1 custom={1} variants={itemVariants} className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                            Chào mừng trở lại!
                        </motion.h1>
                        <motion.p custom={2} variants={itemVariants} className="text-sm text-gray-500 dark:text-gray-400">
                            Đăng nhập để tiếp tục với ParkWise
                        </motion.p>
                    </div>

                    {/* Phần Form */}
                    <motion.form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-5">

                        {/* Thông báo lỗi (nếu có) */}
                        <AnimatePresence>
                            {(errorMessage || authError) && (
                                <motion.div
                                    className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                                    role="alert"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0"/>
                                    <span>{errorMessage || authError?.message || 'Lỗi không xác định'}</span> {/* Hiển thị message từ authError */}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Lựa chọn Role */}
                        <motion.div custom={3} variants={itemVariants}>
                             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Đăng nhập với tư cách</label>
                            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                {[ { value: 'user', label: 'Người dùng', icon: faUser, color: 'blue' },
                                   { value: 'admin', label: 'Quản trị viên', icon: faUserShield, color: 'red' }
                                ].map((role) => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setLoginAs(role.value)}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                            loginAs === role.value
                                                ? `bg-white dark:bg-gray-900 text-${role.color}-600 dark:text-${role.color}-400 shadow focus:ring-${role.color}-500`
                                                : `text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-400`
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={role.icon} /> {role.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Input Email hoặc SĐT */}
                        <motion.div custom={4} variants={itemVariants} className="relative">
                            <label htmlFor="loginIdentifier" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                                {loginAs === 'admin' ? 'Email Quản trị' : 'Email hoặc Số điện thoại'}
                            </label>
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={loginIdentifier.includes('@') ? faEnvelope : faPhone}
                                    className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none'
                                />
                                <motion.input
                                    type="text"
                                    id="loginIdentifier"
                                    className="input-field w-full !pl-10 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder={loginAs === 'admin' ? 'admin@parkwise.com' : 'Nhập email hoặc SĐT'}
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    required
                                    disabled={isSubmitting || isAuthLoading}
                                    variants={inputFocusVariants}
                                    whileFocus="focus"
                                />
                            </div>
                        </motion.div>

                        {/* Input Password */}
                        <motion.div custom={5} variants={itemVariants} className="relative">
                            <div className="flex justify-between items-baseline">
                                <label htmlFor="password" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Mật khẩu</label>
                                <Link href="/forgot-password" legacyBehavior>
                                    <a tabIndex={-1} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1">Quên mật khẩu?</a>
                                </Link>
                            </div>
                            <div className="relative">
                                <FontAwesomeIcon icon={faLock} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none'/>
                                <motion.input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="input-field w-full !pl-10 !pr-10 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Nhập mật khẩu của bạn"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting || isAuthLoading}
                                    variants={inputFocusVariants}
                                    whileFocus="focus"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1} // Không focus vào nút này khi dùng Tab
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Nút Submit */}
                        <motion.div custom={6} variants={itemVariants}>
                            <motion.button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 dark:from-blue-500 dark:to-cyan-400 dark:hover:from-blue-600 dark:hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 shadow-md disabled:opacity-60 disabled:cursor-wait"
                                disabled={isSubmitting || isAuthLoading}
                                variants={buttonHoverTapVariants}
                                whileHover={!(isSubmitting || isAuthLoading) ? "hover" : ""} // Chỉ hover khi không disable
                                whileTap={!(isSubmitting || isAuthLoading) ? "tap" : ""}     // Chỉ tap khi không disable
                            >
                                {isSubmitting || isAuthLoading ? (
                                    <> <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Đang đăng nhập... </>
                                ) : ( 'Đăng nhập' )}
                            </motion.button>
                        </motion.div>

                        {/* Link Đăng ký */}
                        <motion.div custom={7} variants={itemVariants} className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Chưa có tài khoản?{' '}
                            <Link href="/register" legacyBehavior>
                                <a className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Đăng ký ngay</a>
                            </Link>
                        </motion.div>

                        {/* (Bùng nổ) Phân tách và Nút Social Login */}
                         <motion.div custom={8} variants={itemVariants} className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Hoặc tiếp tục với</span></div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* TODO: Implement Social Logins */}
                                <button type="button" disabled={isSubmitting || isAuthLoading} className="social-login-btn">
                                    {/* <FontAwesomeIcon icon={faGoogle} className="text-red-500"/> Google */}
                                    <i className="fab fa-google text-red-500 text-lg mr-2"></i> Google (Sắp có)
                                </button>
                                <button type="button" disabled={isSubmitting || isAuthLoading} className="social-login-btn">
                                    {/* <FontAwesomeIcon icon={faFacebook} className="text-blue-600"/> Facebook */}
                                     <i className="fab fa-facebook text-blue-600 text-lg mr-2"></i> Facebook (Sắp có)
                                </button>
                            </div>
                        </motion.div>
                    </motion.form>
                </motion.div>

                {/* --- CSS Global Inline "Đẳng cấp" --- */}
                <style jsx global>{`
                  .input-field {
                    @apply block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out
                           focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                           dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-offset-gray-800;
                  }
                  .social-login-btn {
                    @apply w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                           bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed;
                  }
                  /* Thêm CSS cho icon Boxicons nếu bạn muốn dùng thay FontAwesome */
                  /* @import url('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'); */

                   /* Cần link FontAwesome trong _app.js hoặc _document.js */
                   /* Ví dụ import trong _app.js: import '@fortawesome/fontawesome-svg-core/styles.css'; */
                `}</style>
            </div>
        </>
    );
};

// Trang Login không cần bảo vệ bằng withAuth
export default LoginPage;