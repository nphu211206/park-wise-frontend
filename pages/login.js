// pages/login.js (PHIÊN BẢN ĐẲNG CẤP - Trang Đăng nhập Next.js)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Sử dụng hook useAuth
import { useRouter } from 'next/router';
import Link from 'next/link'; // Dùng Link của Next.js để điều hướng client-side
import { motion } from 'framer-motion'; // Thêm hiệu ứng

// Có thể tạo Layout riêng cho trang Auth nếu muốn
// import AuthLayout from '../components/layouts/AuthLayout';

const LoginPage = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // State riêng cho lỗi form
    const [isSubmitting, setIsSubmitting] = useState(false); // State cho trạng thái submit
    const { login, isLoading: isAuthLoading } = useAuth(); // Lấy hàm login và trạng thái loading từ context
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Xóa lỗi cũ
        setIsSubmitting(true); // Bắt đầu submit

        // --- Validation cơ bản ---
        if (!emailOrPhone || !password) {
            setErrorMessage('Vui lòng nhập đầy đủ thông tin.');
            setIsSubmitting(false);
            return;
        }

        try {
            await login(emailOrPhone, password);
            // Chuyển hướng đã được xử lý trong hàm login của AuthContext
            // router.push('/dashboard'); // Không cần ở đây nữa
        } catch (error) {
            // Lỗi đã được set trong AuthContext, nhưng ta cũng set ở đây để hiển thị ngay
            setErrorMessage(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false); // Kết thúc submit
        }
    };

    // --- Hiệu ứng Framer Motion ---
    const formVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const inputVariants = {
         focus: { scale: 1.02, boxShadow: '0 0 0 2px var(--color-brand)' }
    }

     const buttonVariants = {
        hover: { scale: 1.03, boxShadow: '0 5px 15px rgba(0, 140, 255, 0.3)' },
        tap: { scale: 0.98 }
    }


    return (
        // <AuthLayout> // Bọc trong Layout nếu có
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-200 p-4">
            <motion.div
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10"
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="text-center mb-8">
                    <i className="fas fa-parking text-5xl text-blue-600 mb-4"></i>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng đến ParkWise!</h1>
                    <p className="text-gray-500">Đăng nhập để tìm và đặt chỗ đỗ xe</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {errorMessage && (
                        <motion.div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 text-sm"
                            role="alert"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <strong className="font-bold">Lỗi!</strong>
                            <span className="block sm:inline ml-2">{errorMessage}</span>
                        </motion.div>
                    )}

                    <div className="mb-5 relative">
                        <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-600 mb-1">
                            Email hoặc Số điện thoại
                        </label>
                        <motion.input
                            type="text"
                            id="emailOrPhone"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm"
                            placeholder="Nhập email hoặc SĐT"
                            value={emailOrPhone}
                            onChange={(e) => setEmailOrPhone(e.target.value)}
                            required
                            disabled={isSubmitting || isAuthLoading} // Disable khi đang xử lý
                             variants={inputVariants}
                             whileFocus="focus"
                        />
                         <i className='bx bxs-user absolute right-4 top-10 text-gray-400'></i>
                    </div>

                    <div className="mb-6 relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                            Mật khẩu
                        </label>
                        <motion.input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isSubmitting || isAuthLoading}
                             variants={inputVariants}
                             whileFocus="focus"
                        />
                         <i className='bx bxs-lock-alt absolute right-4 top-10 text-gray-400'></i>
                    </div>
                     {/* Bổ sung link Quên mật khẩu */}
                     <div className="text-right mb-6">
    {/* Bỏ thẻ <a> bên trong */}
    <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
        Quên mật khẩu?
    </Link>
</div>


                    <motion.button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting || isAuthLoading} // Disable khi đang xử lý
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        {isSubmitting || isAuthLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i> Đang xử lý...
                            </>
                        ) : (
                            'Đăng nhập'
                        )}
                    </motion.button>
                </form>

                 {/* Thêm phần link sang trang Đăng ký */}
                 <div className="mt-6 text-center text-sm text-gray-600">
    Chưa có tài khoản?{' '}
     {/* Bỏ thẻ <a> bên trong */}
    <Link href="/register" className="font-medium text-blue-600 hover:underline">
        Đăng ký ngay
    </Link>
</div>
                

                 {/* (Bùng nổ) Thêm đăng nhập bằng Google/Facebook (sẽ làm sau) */}
                 <div className="mt-6">
                     <div className="relative">
                         <div className="absolute inset-0 flex items-center">
                             <div className="w-full border-t border-gray-300"></div>
                         </div>
                         <div className="relative flex justify-center text-sm">
                             <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span>
                         </div>
                     </div>
                     <div className="mt-4 grid grid-cols-2 gap-3">
                         {/* Nút Google */}
                         <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                             <span className="sr-only">Đăng nhập bằng Google</span>
                              <i className="fab fa-google text-red-500 text-lg mr-2"></i> Google
                         </button>
                          {/* Nút Facebook */}
                         <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                             <span className="sr-only">Đăng nhập bằng Facebook</span>
                              <i className="fab fa-facebook text-blue-600 text-lg mr-2"></i> Facebook
                         </button>
                     </div>
                 </div>

            </motion.div>
        </div>
        // </AuthLayout>
    );
};

export default LoginPage;