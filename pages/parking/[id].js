// pages/parking/[id].js (PHIÊN BẢN ĐẠI TU - Giao diện Đẳng cấp)

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import withAuth from '@/hoc/withAuth'; // Import HOC
import { useAuth } from '@/context/AuthContext'; // Import useAuth để lấy token
import ImageGallery from '@/components/ImageGallery';
import BookingForm from '@/components/BookingForm';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'; 
// --- Import Components "Đẳng cấp" ---
// import TestComponent from '@/components/TestComponent'; // Có thể bỏ nếu không cần test nữa
import ParkingLotVisualizer from '@/components/ParkingLotVisualizer';
// import BookingForm from '@/components/BookingForm'; // Sẽ tạo sau
// import ParkingLotDetailsCard from '@/components/ParkingLotDetailsCard'; // Sẽ tạo sau
// import ImageGallery from '@/components/ImageGallery'; // Component mới cho ảnh
import LoadingSpinner from '@/components/utils/LoadingSpinner'; // Component loading tái sử dụng
import ErrorDisplay from '@/components/utils/ErrorDisplay'; // Component hiển thị lỗi tái sử dụng

const ParkingLotDetailPage = () => {
    const router = useRouter();
    const { id: parkingLotId } = router.query;
    const { token, user } = useAuth(); // Lấy token và user info

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [parkingLotData, setParkingLotData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // --- Fetch Dữ liệu Đầy đủ ---
    useEffect(() => {
        if (!parkingLotId || !token) {
            setIsLoading(false);
            return;
        }

        const fetchLotInfo = async () => {
            setIsLoading(true);
            setError(null);
            setParkingLotData(null); // Reset data cũ
            setSelectedSlot(null); // Reset slot đã chọn
            try {
                const response = await fetch(`${API_URL}/parking-lots/${parkingLotId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401) throw new Error('Xác thực thất bại.');
                if (response.status === 404) throw new Error('Không tìm thấy bãi xe này.');
                if (!response.ok) throw new Error(`Lỗi ${response.status}: Không thể tải dữ liệu.`);

                const data = await response.json();
                setParkingLotData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLotInfo();
    }, [parkingLotId, token, API_URL]);

    const handleSlotSelected = (slot) => {
        setSelectedSlot(slot);
        // Tùy chọn: Cuộn tới form đặt chỗ một cách mượt mà
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Lấy loại xe mặc định của user (nếu có - sẽ làm sau)
    const userVehicleType = "car_4_seats"; // Tạm thời hardcode, sau này lấy từ user.profile.defaultVehicleType

    // --- Render Giao diện "Đẳng cấp" ---

    if (isLoading) {
         // Sử dụng component LoadingSpinner tái sử dụng
        return <LoadingSpinner message="Đang tải chi tiết bãi xe..." fullScreen={true} />;
    }

    if (error) {
         // Sử dụng component ErrorDisplay tái sử dụng
        return <ErrorDisplay message={error} fullScreen={true} />;
    }

    if (!parkingLotData) {
        return <ErrorDisplay message="Không tìm thấy dữ liệu bãi xe." fullScreen={true} icon="fa-search-minus" />;
    }

    // --- Render Nội dung chính ---
    const { name, address, images, slots = [], description, amenities = [], rating, numReviews } = parkingLotData;

    return (
        <>
            <Head>
                <title>{`Chi tiết ${name} - ParkWise`}</title>
                 {/* Thêm mô tả SEO nếu cần */}
                 <meta name="description" content={`Xem chi tiết và đặt chỗ tại ${name}, ${address}. ParkWise - Hệ thống đỗ xe thông minh.`} />
            </Head>

             {/* Layout chính với nền gradient nhẹ nhàng */}
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 text-text-primary p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Nút quay lại + Breadcrumbs (Nâng cấp) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 flex items-center justify-between"
                    >
                         <button
                            onClick={() => router.back()}
                            className="text-sm text-text-secondary hover:text-text-link transition-colors flex items-center gap-2 group"
                        >
                            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                             Quay lại
                        </button>
                         {/* Breadcrumbs (ví dụ) */}
                         <nav className="text-sm text-text-secondary hidden md:block">
                             <Link href="/dashboard" className="hover:underline">
                             Dashboard
                         </Link>
                             <span> / </span>
                             <span className="font-medium text-text-primary">{name}</span>
                         </nav>
                    </motion.div>

                    {/* Phần Header Thông tin Bãi xe */}
                    <motion.section
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 mb-2">
                                    {name}
                                </h1>
                                <p className="text-md text-text-secondary flex items-center gap-2">
                                    <i className="fas fa-map-marker-alt text-gray-400"></i> {address}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm mt-2 md:mt-0">
                                {/* Đánh giá */}
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <i className="fas fa-star"></i>
                                    <span className="font-semibold text-text-primary">{rating.toFixed(1)}</span>
                                     <span className="text-text-secondary">({numReviews} đánh giá)</span>
                                </div>
                                {/* Có thể thêm nút Chia sẻ, Lưu,... */}
                                <button className="text-text-secondary hover:text-brand transition-colors"><i className="fas fa-share-alt"></i></button>
                                <button className="text-text-secondary hover:text-red-500 transition-colors"><i className="fas fa-heart"></i></button>
                            </div>
                        </div>
                         {/* (Đẳng cấp) Thêm phần ảnh nếu có */}
 {images && images.length > 0 && (
     <div className="mt-6 rounded-lg overflow-hidden"> {/* Thêm bo tròn và overflow */}
         <ImageGallery images={images} />
     </div>
 )}
                          
                    </motion.section>

                     {/* Layout Grid cho Visualizer và Thông tin chi tiết */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                         {/* Cột Visualizer (chiếm 2 phần) */}
                        <div className="lg:col-span-2">
                             <ParkingLotVisualizer
                                parkingLotId={parkingLotId}
                                initialSlots={slots} // Truyền slots xuống
                                onSlotSelect={handleSlotSelected}
                                userVehicleType={userVehicleType}
                                lotName={name} // Truyền tên và địa chỉ xuống
                                lotAddress={address}
                            />
                        </div>

                         {/* Cột Thông tin chi tiết/Tiện ích (chiếm 1 phần) */}
                         <motion.div
                             className="lg:col-span-1 space-y-6"
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ duration: 0.6, delay: 0.2 }}
                         >
                            {/* Component Thông tin chi tiết (Ví dụ) */}
                             <div className="card-standard p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
                                 <h3 className="text-lg font-semibold mb-3 border-b pb-2 border-border dark:border-gray-700">Thông tin thêm</h3>
                                 {description ? (
                                     <p className="text-sm text-text-secondary mb-4">{description}</p>
                                 ) : (
                                      <p className="text-sm text-text-secondary italic mb-4">Chưa có mô tả chi tiết cho bãi xe này.</p>
                                 )}
                                 {/* Hiển thị tiện ích */}
                                 {amenities.length > 0 && (
                                     <>
                                        <h4 className="text-sm font-medium mb-2 text-text-primary">Tiện ích:</h4>
                                         <div className="flex flex-wrap gap-2">
                                             {amenities.map(amenity => (
                                                 <span key={amenity} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                                                     {/* Có thể thêm Icon cho từng tiện ích */}
                                                     <i className={`fas ${getAmenityIcon(amenity)}`}></i>
                                                     {formatAmenityName(amenity)}
                                                 </span>
                                             ))}
                                         </div>
                                     </>
                                 )}
                                 {/* Thêm Giờ mở cửa */}
                                 <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                                     <h4 className="text-sm font-medium mb-2 text-text-primary">Giờ hoạt động:</h4>
                                     <p className="text-sm text-text-secondary">
                                         {parkingLotData.openingHours?.is24h
                                             ? <><i className="fas fa-check-circle text-green-500 mr-1"></i> Mở cửa 24/7</>
                                             : <><i className="fas fa-clock text-gray-400 mr-1"></i> {parkingLotData.openingHours?.open} - {parkingLotData.openingHours?.close}</>
                                         }
                                     </p>
                                 </div>
                             </div>
                             {/* Có thể thêm Card Bản đồ nhỏ ở đây */}
                             {/* Có thể thêm Card Đánh giá của người dùng ở đây */}
                         </motion.div>
                    </div>


                    {/* Phần Form Đặt chỗ (Chỉ hiện khi đã chọn ô) */}
                    <AnimatePresence>
                        {selectedSlot && (
                            <motion.section
                                id="booking-section"
                                className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg" // Nâng cấp style
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }} // Hiệu ứng exit khác
                                transition={{ type: 'spring', stiffness: 100, damping: 15 }} // Hiệu ứng spring
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold">
                                         Đặt chỗ cho ô <span className="text-brand font-bold">{selectedSlot.identifier}</span>
                                    </h2>
                                     {/* Nút đóng form nếu cần */}
                                     <button onClick={() => setSelectedSlot(null)} className="text-gray-400 hover:text-red-500">
                                         <i className="fas fa-times text-xl"></i>
                                     </button>
                                </div>

                                {/* --- Component BookingForm sẽ đặt ở đây --- */}
<BookingForm slot={selectedSlot} parkingLot={parkingLotData} user={user} />
                                {/* Placeholder cho BookingForm */}
                                <div className="border-t border-border dark:border-gray-700 pt-6">
                                     <p className="text-center text-text-secondary italic mb-4">(Component Form Đặt Chỗ Chi Tiết sẽ được tích hợp ở đây)</p>
                                     {/* Form mẫu đơn giản */}
                                     <div className="max-w-md mx-auto space-y-4">
                                         <div>
                                             <label className="text-sm font-medium">Thời gian bắt đầu:</label>
                                             <input type="datetime-local" className="input-field mt-1 w-full dark:bg-gray-700 dark:border-gray-600"/>
                                         </div>
                                         <div>
                                             <label className="text-sm font-medium">Thời gian kết thúc:</label>
                                             <input type="datetime-local" className="input-field mt-1 w-full dark:bg-gray-700 dark:border-gray-600"/>
                                         </div>
                                         <div>
                                             <label className="text-sm font-medium">Biển số xe (Tùy chọn):</label>
                                             <input type="text" placeholder="VD: 29A-12345" className="input-field mt-1 w-full dark:bg-gray-700 dark:border-gray-600"/>
                                         </div>
                                         <button className="w-full btn-primary py-3 mt-4">
                                             Tiến hành đặt chỗ (Demo)
                                         </button>
                                     </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

// --- Helper Functions (Có thể tách ra file utils) ---
function formatAmenityName(amenity) {
    // Chuyển 'ev_charging' thành 'Sạc xe điện'
    return amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getAmenityIcon(amenity) {
    switch (amenity) {
        case 'covered_parking': return 'fa-cloud-showers-heavy';
        case 'security_24h': return 'fa-shield-alt';
        case 'cctv': return 'fa-video';
        case 'car_wash': return 'fa-car-wash'; // Cần cài thêm icon set nếu muốn (pro) hoặc tìm icon free tương đương
        case 'ev_charging': return 'fa-charging-station';
        case 'valet_parking': return 'fa-user-tie';
        case 'rooftop': return 'fa-building';
        default: return 'fa-check-circle';
    }
}

// Bọc component export default bằng HOC withAuth
export default withAuth(ParkingLotDetailPage);