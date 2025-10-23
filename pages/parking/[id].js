// pages/parking/[id].js (PHIÊN BẢN ĐẲNG CẤP - Next.js Page)
// Trang hiển thị chi tiết một bãi xe và sơ đồ ô đỗ

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'; // Để đặt tiêu đề trang
import { motion } from 'framer-motion';
import TestComponent from '@/components/TestComponent';

// Import Component "Đẳng cấp" của chúng ta
//import ParkingLotVisualizer from '@/components/ParkingLotVisualizer';
// Import các components UI khác (sẽ tạo sau)
// import BookingForm from '../../components/BookingForm';
// import ParkingLotDetailsCard from '../../components/ParkingLotDetailsCard';

const ParkingLotDetailPage = () => {
    const router = useRouter();
    const { id: parkingLotId } = router.query; // Lấy ID bãi xe từ URL

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [parkingLotData, setParkingLotData] = useState(null); // Lưu thông tin chung
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null; // Lấy token an toàn

    // Fetch thông tin chung của bãi xe (không cần slots ở đây)
    useEffect(() => {
        if (!parkingLotId) return;
        
        const fetchLotInfo = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Gọi API GET /api/parking-lots/:id nhưng chỉ lấy thông tin cơ bản
                // (Backend cần hỗ trợ select fields hoặc tạo API riêng)
                // Tạm thời vẫn gọi API cũ
                const response = await fetch(`${API_URL}/parking-lots/${parkingLotId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Không thể tải thông tin bãi xe.');
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

    // Callback khi user chọn một ô từ Visualizer
    const handleSlotSelected = (slot) => {
        console.log("Ô được chọn:", slot);
        setSelectedSlot(slot);
        // Có thể tự động cuộn xuống form đặt chỗ
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- (Bùng nổ) Logic lấy loại xe của người dùng từ Profile ---
    // Giả sử lấy từ localStorage hoặc Context API
    const userVehicleType = "car_4_seats"; // TODO: Thay bằng dữ liệu thật

    // --- Render Giao diện "Đẳng cấp" ---
    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-text-secondary">Đang tải chi tiết bãi xe...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-danger">Lỗi: {error}</div>;
    if (!parkingLotData) return <div className="min-h-screen flex items-center justify-center text-text-secondary">Không tìm thấy bãi xe.</div>;

    return (
        <>
            <Head>
                <title>{`Đặt chỗ tại ${parkingLotData.name} - ParkWise`}</title>
            </Head>

            {/* Layout chính của trang */}
            <div className="min-h-screen bg-bg text-text-primary p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                <TestComponent />
                    {/* Nút quay lại */}
                    <motion.button 
                        onClick={() => router.back()}
                        className="mb-6 text-sm text-text-secondary hover:text-text-link transition-colors flex items-center gap-2"
                        whileHover={{ x: -5 }}
                    >
                        <i className="fas fa-arrow-left"></i> Quay lại tìm kiếm
                    </motion.button>

                    {/* Tiêu đề trang */}
                    <motion.h1 
                        className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {parkingLotData.name}
                    </motion.h1>
                    <motion.p 
                        className="text-md text-text-secondary mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <i className="fas fa-map-marker-alt mr-2"></i> {parkingLotData.address}
                    </motion.p>

                    {/* Phần hiển thị Sơ đồ Ô đỗ */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {parkingLotId && (
                            <ParkingLotVisualizer 
                                parkingLotId={parkingLotId} 
                                onSlotSelect={handleSlotSelected}
                                userVehicleType={userVehicleType} 
                            />
                        )}
                    </motion.div>
                    
                    {/* (Bùng nổ) Hiển thị thông tin chi tiết khác (Card riêng) */}
                    {/* <ParkingLotDetailsCard lotData={parkingLotData} /> */}

                    {/* Phần Form Đặt chỗ (Chỉ hiện khi đã chọn ô) */}
                    <AnimatePresence>
                        {selectedSlot && (
                            <motion.div 
                                id="booking-section" 
                                className="mt-12"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 30 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h2 className="text-2xl font-semibold mb-6">Xác nhận đặt chỗ cho ô <span className="text-brand">{selectedSlot.identifier}</span></h2>
                                {/* Component BookingForm sẽ đặt ở đây */}
                                {/* <BookingForm slot={selectedSlot} parkingLot={parkingLotData} /> */}
                                <div className="card-premium p-6 text-center">
                                    <p className="text-text-secondary">Form đặt chỗ sẽ hiển thị ở đây.</p>
                                    <button className="btn-primary mt-4">Tiến hành đặt chỗ</button> 
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default ParkingLotDetailPage;