// hoc/withAuth.js (PHIÊN BẢN ĐẲNG CẤP - HOC Bảo vệ Route)

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const withAuth = (WrappedComponent, options = {}) => {
    const { requiredRole } = options; // Tùy chọn: yêu cầu role cụ thể (ví dụ: 'admin')

    const Wrapper = (props) => {
        const { isAuthenticated, user, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            // Chỉ kiểm tra khi context không còn loading và người dùng chưa được xác thực
            if (!isLoading && !isAuthenticated) {
                router.replace('/login'); // Chuyển hướng về trang đăng nhập
            }
            // (Đẳng cấp) Kiểm tra role nếu được yêu cầu
            else if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
                 // Nếu đã đăng nhập nhưng sai role, có thể chuyển về trang lỗi hoặc trang user
                 console.warn(`Truy cập bị từ chối: Yêu cầu role "${requiredRole}", người dùng có role "${user?.role}"`);
                 router.replace('/unauthorized'); // Hoặc '/dashboard' nếu muốn
            }

        }, [isLoading, isAuthenticated, user, router, requiredRole]);

        // Hiển thị màn hình loading tạm thời trong khi kiểm tra xác thực
        if (isLoading || !isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
            // Có thể hiển thị component loading đẹp hơn ở đây
             return <div className="min-h-screen flex items-center justify-center">Đang kiểm tra quyền truy cập...</div>;
        }

        // Nếu đã xác thực và đúng role (nếu có yêu cầu), render component gốc
        return <WrappedComponent {...props} />;
    };

    // Sao chép các static method (quan trọng cho Next.js như getInitialProps)
    // Hoặc sử dụng cách khác tùy thuộc vào phiên bản Next.js
    // if (WrappedComponent.getInitialProps) {
    //   Wrapper.getInitialProps = WrappedComponent.getInitialProps;
    // }

    // Đặt tên hiển thị cho component Wrapper để dễ debug
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    Wrapper.displayName = `withAuth(${wrappedComponentName})`;


    return Wrapper;
};

export default withAuth;

// (Đẳng cấp) Có thể tạo thêm HOC `withAdminAuth` cho tiện lợi
export const withAdminAuth = (WrappedComponent) => {
    return withAuth(WrappedComponent, { requiredRole: 'admin' });
};