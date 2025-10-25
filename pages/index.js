// pages/index.js (PHIÊN BẢN ĐẲNG CẤP - Entry Point & Auto Redirect)

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../utils/LoadingSpinner'; // Import component loading

const HomePage = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Chỉ thực hiện chuyển hướng khi context không còn loading
        if (!isLoading) {
            if (isAuthenticated) {
                // Đã đăng nhập, chuyển hướng dựa trên vai trò
                if (user?.role === 'admin') {
                    console.log("Redirecting admin to /admin/dashboard");
                    router.replace('/admin/dashboard'); // Trang dashboard admin (sẽ tạo sau)
                } else {
                    console.log("Redirecting user to /dashboard");
                    router.replace('/dashboard'); // Trang dashboard người dùng
                }
            } else {
                // Chưa đăng nhập, chuyển hướng đến trang login
                console.log("Redirecting guest to /login");
                router.replace('/login');
            }
        }
    }, [isLoading, isAuthenticated, user, router]); // Phụ thuộc vào các state này

    // Trong khi chờ kiểm tra xác thực và chuyển hướng, hiển thị loading
    // Điều này đảm bảo người dùng không thấy trang trống hoặc trang homepage thật (nếu có) trước khi bị redirect
    return <LoadingSpinner message="Đang kiểm tra phiên đăng nhập..." fullScreen={true} />;

    // Hoặc nếu bạn muốn có một trang chủ thực sự cho người dùng chưa đăng nhập (ít phổ biến hơn với luồng này):
    // if (isLoading) return <LoadingSpinner message="Đang tải..." fullScreen={true} />;
    // if (!isAuthenticated) {
    //     // Render nội dung trang chủ công khai ở đây (ví dụ: giới thiệu, nút login/register)
    //     return (
    //         <div>
    //             <h1>Chào mừng đến ParkWise!</h1>
    //             <Link href="/login"><a>Đăng nhập</a></Link>
    //             {/* ... */}
    //         </div>
    //     );
    // }
    // // Nếu đã đăng nhập thì vẫn nên redirect, hoặc hiển thị loading chờ redirect
    // return <LoadingSpinner message="Đang chuyển hướng..." fullScreen={true} />;

};

// Trang chủ không cần bảo vệ bằng withAuth
export default HomePage;