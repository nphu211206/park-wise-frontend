// context/AuthContext.js (PHIÊN BẢN ĐẲNG CẤP - Quản lý State Xác thực Toàn cục)

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';

// Định nghĩa API URL (Lấy từ biến môi trường nếu có, nếu không dùng default)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// 1. Tạo Context Object
const AuthContext = createContext(null);

// 2. Tạo Provider Component (Nơi chứa state và logic)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Lưu thông tin user (null nếu chưa đăng nhập)
    const [token, setToken] = useState(null); // Lưu JWT token
    const [isLoading, setIsLoading] = useState(true); // Trạng thái kiểm tra xác thực ban đầu
    const [error, setError] = useState(null); // Lưu lỗi xác thực/API
    const router = useRouter();

    // Hàm kiểm tra xác thực khi ứng dụng khởi động (chạy 1 lần)
    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            setError(null);
            const storedToken = localStorage.getItem('userToken');
            const storedUserInfo = localStorage.getItem('userInfo');

            if (storedToken && storedUserInfo) {
                try {
                    const parsedUser = JSON.parse(storedUserInfo);
                    // *** Nâng cấp Đẳng cấp: Xác thực token với Backend ***
                    // Gọi một API mới (ví dụ: /api/users/profile) để kiểm tra token còn hiệu lực không
                    const response = await fetch(`${API_URL}/users/profile`, {
                        headers: { 'Authorization': `Bearer ${storedToken}` }
                    });

                    if (!response.ok) {
                        if (response.status === 401) {
                            // Token không hợp lệ hoặc hết hạn
                            throw new Error('Phiên đăng nhập hết hạn.');
                        }
                        throw new Error('Lỗi xác thực người dùng.');
                    }
                    // Nếu token hợp lệ, lấy thông tin user mới nhất từ API
                    const userDataFromApi = await response.json();
                    setToken(storedToken);
                    setUser(userDataFromApi); // Cập nhật user info mới nhất
                    localStorage.setItem('userInfo', JSON.stringify(userDataFromApi)); // Cập nhật lại localStorage

                } catch (authError) {
                    console.error("Lỗi xác thực token:", authError);
                    // Nếu token không hợp lệ, xóa khỏi localStorage
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('userInfo');
                    setToken(null);
                    setUser(null);
                    setError(authError.message); // Có thể hiển thị lỗi này
                }
            }
            setIsLoading(false); // Kết thúc kiểm tra
        };
        initializeAuth();
    }, []); // Chỉ chạy 1 lần khi mount

    // --- Hàm Đăng nhập "Đẳng cấp" ---
    const login = useCallback(async (emailOrPhone, password) => {
        setIsLoading(true);
        setError(null);
        try {
            // Backend đang dùng email, tạm chuyển đổi phone -> email giả lập
            const email = emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@parkwise.com`;

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            // Đăng nhập thành công
            setToken(data.token);
            setUser(data); // Lưu thông tin user (bao gồm cả role)
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));

             // *** Chuyển hướng "Đẳng cấp" dựa trên vai trò ***
             if (data.role === 'admin') {
                router.push('/admin/dashboard'); // Chuyển đến trang dashboard admin
             } else {
                 router.push('/dashboard'); // Chuyển đến trang dashboard người dùng
             }

        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            setError(err.message);
            setUser(null); // Đảm bảo user là null nếu lỗi
            setToken(null);
            localStorage.removeItem('userToken');
            localStorage.removeItem('userInfo');
            throw err; // Ném lỗi ra để component Login có thể bắt và hiển thị
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // --- Hàm Đăng ký "Đẳng cấp" ---
    const register = useCallback(async (name, phone, password) => {
        setIsLoading(true);
        setError(null);
        try {
            // Backend đang dùng email, tạo email giả lập từ phone
            const email = `${phone}@parkwise.com`;

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            // Đăng ký thành công -> Tự động đăng nhập luôn
            setToken(data.token);
            setUser(data);
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));

            router.push('/dashboard'); // Chuyển đến trang dashboard người dùng

        } catch (err) {
            console.error("Lỗi đăng ký:", err);
            setError(err.message);
            setUser(null);
            setToken(null);
            localStorage.removeItem('userToken');
            localStorage.removeItem('userInfo');
            throw err; // Ném lỗi ra để component Register có thể bắt
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // --- Hàm Đăng xuất "Đẳng cấp" ---
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        setError(null); // Xóa lỗi cũ khi logout
        router.push('/login'); // Chuyển về trang đăng nhập
    }, [router]);

    // 3. Cung cấp state và hàm cho các component con
    const value = {
        user,
        token,
        isLoading, // Trạng thái loading của việc xác thực
        error,     // Lỗi xác thực/API
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user, // Helper để kiểm tra đã đăng nhập chưa
        isAdmin: user?.role === 'admin'     // Helper kiểm tra admin
    };

    // Chỉ render children khi không còn loading xác thực ban đầu
    // Hoặc có thể render children ngay cả khi đang loading và để children tự xử lý
    // Ở đây ta chọn cách chỉ render khi hết loading để tránh lỗi không cần thiết
    return (
        <AuthContext.Provider value={value}>
            {children}
            {/* Có thể thêm một màn hình loading toàn cục ở đây nếu muốn */}
            {/* {isLoading && <GlobalLoadingScreen />} */}
        </AuthContext.Provider>
    );
};

// 4. Tạo Custom Hook để dễ dàng sử dụng Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    // Trong môi trường Next.js, context có thể là null ban đầu phía server-side
    // Return giá trị mặc định hoặc xử lý phù hợp nếu cần thiết
    // Tuy nhiên, với useEffect kiểm tra localStorage, nó sẽ ổn định phía client
    return context || { // Cung cấp giá trị mặc định an toàn
        user: null,
        token: null,
        isLoading: true,
        error: null,
        login: async () => {},
        register: async () => {},
        logout: () => {},
        isAuthenticated: false,
        isAdmin: false
    };
};

// Export context nếu cần dùng trực tiếp (ít phổ biến hơn)
// export default AuthContext;