// pages/register.js (PHIÊN BẢN ĐẲNG CẤP - Trang Đăng ký Next.js)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        // --- Validation "Đẳng cấp" ---
        if (!name || !phone || !password || !confirmPassword) {
            setErrorMessage('Vui lòng nhập đầy đủ thông tin.');
            setIsSubmitting(false);
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp.');
            setIsSubmitting(false);
            return;
        }
        // Thêm kiểm tra độ dài mật khẩu, định dạng SĐT (có thể dùng regex)
        if (password.length < 6) {
             setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
             setIsSubmitting(false);
             return;
        }
         // Regex đơn giản cho SĐT Việt Nam (10-11 số, bắt đầu bằng 0)
         const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
         if (!phoneRegex.test(phone)) {
             setErrorMessage('Số điện thoại không hợp lệ.');
             setIsSubmitting(false);
             return;
         }


        try {
            await register(name, phone, password);
            // Chuyển hướng đã được xử lý trong AuthContext
        } catch (error) {
            setErrorMessage(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Hiệu ứng Framer Motion (tương tự trang Login) ---
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-200 p-4">
            <motion.div
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10"
                variants={formVariants} initial="hidden" animate="visible"
            >
                <div className="text-center mb-8">
                     <i className="fas fa-user-plus text-5xl text-blue-600 mb-4"></i>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Tạo tài khoản ParkWise</h1>
                    <p className="text-gray-500">Nhanh chóng và dễ dàng</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {errorMessage && (
                         <motion.div
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 text-sm" role="alert"
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        >
                            <strong className="font-bold">Lỗi!</strong>
                            <span className="block sm:inline ml-2">{errorMessage}</span>
                        </motion.div>
                    )}

                    <div className="mb-5 relative">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Họ và Tên</label>
                        <motion.input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting || isAuthLoading} variants={inputVariants} whileFocus="focus" placeholder="Nguyễn Văn A" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm"/>
                         <i className='bx bxs-user absolute right-4 top-10 text-gray-400'></i>
                    </div>

                    <div className="mb-5 relative">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                        <motion.input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isSubmitting || isAuthLoading} variants={inputVariants} whileFocus="focus" placeholder="09xxxxxxxx" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm"/>
                         <i className='bx bxs-phone absolute right-4 top-10 text-gray-400'></i>
                    </div>

                    <div className="mb-5 relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">Mật khẩu</label>
                        <motion.input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting || isAuthLoading} variants={inputVariants} whileFocus="focus" placeholder="Ít nhất 6 ký tự" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm"/>
                         <i className='bx bxs-lock-alt absolute right-4 top-10 text-gray-400'></i>
                    </div>

                    <div className="mb-6 relative">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1">Xác nhận Mật khẩu</label>
                        <motion.input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSubmitting || isAuthLoading} variants={inputVariants} whileFocus="focus" placeholder="Nhập lại mật khẩu" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm"/>
                         <i className='bx bxs-lock-alt absolute right-4 top-10 text-gray-400'></i>
                    </div>

                    <motion.button type="submit" disabled={isSubmitting || isAuthLoading} variants={buttonVariants} whileHover="hover" whileTap="tap" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting || isAuthLoading ? (<><i className="fas fa-spinner fa-spin mr-2"></i> Đang đăng ký...</>) : 'Đăng ký'}
                    </motion.button>
                </form>

                 <div className="mt-6 text-center text-sm text-gray-600">
    Đã có tài khoản?{' '}
     {/* Bỏ thẻ <a> bên trong */}
    <Link href="/login" className="font-medium text-blue-600 hover:underline">
        Đăng nhập
    </Link>
</div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;