// components/ParkingLotVisualizer.js (PHIÊN BẢN ĐẲNG CẤP - Nhận slots qua Props)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faTools, faMotorcycle, faChargingStation, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { io } from 'socket.io-client'; // Vẫn cần socket để cập nhật real-time

// --- (Đẳng cấp) Helper Component cho từng Ô (Slot) - Nâng cấp Styling ---
const ParkingSlot = ({ slot, onSelect, isSelected, userVehicleType }) => {

    const getSlotStyle = (status, type, userType) => {
        let baseStyle = `relative w-24 h-16 md:w-28 md:h-20 rounded-md border-2 shadow-sm 
                       flex flex-col items-center justify-center p-1
                       transition-all duration-200 text-center `; // Kích thước linh hoạt hơn

        // --- Logic màu sắc "Đẳng cấp" hơn ---
        switch (status) {
            case 'available':
                // (Bùng nổ) Kiểm tra tương thích loại xe
                const isCompatible = !userType || type === 'any' || type === userType;
                if (isCompatible) {
                    baseStyle += 'bg-green-600/10 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-400 cursor-pointer';
                } else {
                    // Xe người dùng không phù hợp
                    baseStyle += 'bg-gray-700/20 border-gray-600/50 text-gray-500 cursor-not-allowed opacity-60';
                }
                break;
            case 'occupied':
                baseStyle += 'bg-red-700/20 border-red-800/50 text-red-500 cursor-not-allowed';
                break;
            case 'reserved':
                baseStyle += 'bg-yellow-600/20 border-yellow-700/50 text-yellow-400 cursor-not-allowed';
                break;
            case 'maintenance':
                baseStyle += 'bg-gray-600/20 border-gray-700/50 text-gray-500 cursor-not-allowed';
                break;
            default:
                baseStyle += 'bg-gray-800/20 border-gray-900/50 text-gray-600';
        }
         // Thêm hiệu ứng ring khi được chọn
        if (isSelected) {
            baseStyle += ' ring-4 ring-offset-2 ring-offset-bg ring-brand-light scale-105';
        }

        return baseStyle;
    };

    const getIcon = (vehicleType, status) => {
        let iconClass = "text-xl mb-1"; // Kích thước icon lớn hơn
        if (status === 'maintenance') return <FontAwesomeIcon icon={faTools} className={iconClass} />;

        switch (vehicleType) {
            case 'motorbike': return <FontAwesomeIcon icon={faMotorcycle} className={iconClass} />;
            case 'ev_car': return <FontAwesomeIcon icon={faChargingStation} className={`${iconClass} text-yellow-400`} />; // Màu riêng cho EV
            case 'suv':
            case 'car_7_seats':
            case 'car_4_seats':
            default: // Mặc định là xe hơi
                 // Hiển thị icon xe hơi nếu đang occupied hoặc reserved
                 if (status === 'occupied' || status === 'reserved') {
                     return <FontAwesomeIcon icon={faCar} className={`${iconClass} opacity-70`} />;
                 }
                 // Nếu trống thì không cần icon xe
                 return null;
        }
    };

    const slotVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        hover: { scale: 1.08, zIndex: 10, boxShadow: '0 5px 20px rgba(59, 130, 246, 0.4)' },
        tap: { scale: 0.95 }
    };

     const canSelect = slot.status === 'available' && (!userVehicleType || slot.vehicleType === 'any' || slot.vehicleType === userVehicleType);

    // --- (Bùng nổ) Thêm Tooltip ---
     const getTooltipText = () => {
         let text = `Ô: ${slot.identifier} | Loại: ${slot.vehicleType || 'Any'} | Trạng thái: ${slot.status}`;
         if (slot.status === 'available' && userVehicleType && slot.vehicleType !== 'any' && slot.vehicleType !== userVehicleType) {
             text += ` (Không phù hợp xe của bạn: ${userVehicleType})`;
         }
         return text;
     };


    return (
        <motion.div
            layout
            variants={slotVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={canSelect ? "hover" : ""}
            whileTap={canSelect ? "tap" : ""}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => canSelect && onSelect(slot)}
            className={getSlotStyle(slot.status, slot.vehicleType, userVehicleType)}
            title={getTooltipText()} // Tooltip đơn giản
        >
            {getIcon(slot.vehicleType, slot.status)}
            <span className="text-xs font-semibold mt-auto">{slot.identifier}</span>
        </motion.div>
    );
};

// --- Component Chính ---
const ParkingLotVisualizer = ({ parkingLotId, initialSlots = [], onSlotSelect, userVehicleType, lotName, lotAddress }) => {
    // State giờ chỉ dùng để lưu slots (nhận từ props và cập nhật qua socket)
    const [slots, setSlots] = useState(initialSlots);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [error, setError] = useState(null); // Vẫn giữ lỗi socket nếu có

    // Hook để lấy socket URL từ env
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    // Chỉ kết nối socket và xử lý update
    useEffect(() => {
        // Cập nhật state nội bộ khi initialSlots từ props thay đổi
        setSlots(initialSlots);

        const socket = io(SOCKET_URL);

        socket.on('connect_error', (err) => {
            console.error("Socket Connection Error:", err.message);
            setError("Không thể kết nối đến server real-time.");
        });

        socket.on('connect', () => {
             console.log("Socket connected:", socket.id);
             setError(null); // Xóa lỗi nếu kết nối lại thành công
            // Tham gia phòng của bãi xe này
            socket.emit('joinLotRoom', parkingLotId);
            console.log(`[Socket.IO] Emitted joinLotRoom for ${parkingLotId}`);
        });


        // Lắng nghe sự kiện 'slotUpdate'
        socket.on('slotUpdate', (updatedSlot) => {
            console.log("[Socket.IO] Received slotUpdate:", updatedSlot);
             // Chỉ cập nhật nếu slot đó thuộc bãi xe này (đã join room nhưng check lại cho chắc)
            if (updatedSlot.parkingLotId === parkingLotId) {
                setSlots(prevSlots => {
                    if (!prevSlots) return []; // An toàn nếu prevSlots là null/undefined ban đầu
                     // Tạo mảng mới với slot được cập nhật
                    return prevSlots.map(slot =>
                        slot._id === updatedSlot._id
                            ? { ...slot, status: updatedSlot.status } // Cập nhật trạng thái
                            : slot
                    );
                });
            }
        });

        // Cleanup: Rời phòng và ngắt kết nối
        return () => {
            console.log(`[Socket.IO] Leaving room ${parkingLotId} and disconnecting`);
            socket.emit('leaveLotRoom', parkingLotId);
            socket.disconnect();
        };
    // Chạy lại khi ID bãi xe hoặc initialSlots thay đổi
    }, [parkingLotId, initialSlots, SOCKET_URL]);

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        onSlotSelect(slot);
    };

     // Tính toán thống kê từ state `slots` hiện tại
    const stats = slots.reduce((acc, slot) => {
        acc[slot.status] = (acc[slot.status] || 0) + 1;
        return acc;
    }, { available: 0, occupied: 0, reserved: 0, maintenance: 0 });

    return (
        // Sử dụng card styling từ globals.css/tailwind.config.js
        <motion.div
            className="card-premium border border-border rounded-xl overflow-hidden shadow-lg bg-card" // Style "Đẳng cấp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
        >
            {/* Header của Visualizer */}
            <div className="p-4 sm:p-6 border-b border-border">
                <h3 className="text-xl font-semibold text-text-primary mb-1">{lotName}</h3>
                <p className="text-xs text-text-secondary mb-3">{lotAddress}</p>

                {/* Thanh thống kê Real-time - Styling "Đẳng cấp" hơn */}
                <div className="grid grid-cols-4 gap-2 text-center">
                    {/* Sử dụng map để code gọn hơn */}
                    {[
                        { label: 'TRỐNG', value: stats.available, color: 'text-green-400' },
                        { label: 'ĐÃ CHIẾM', value: stats.occupied, color: 'text-red-400' },
                        { label: 'ĐÃ ĐẶT', value: stats.reserved, color: 'text-yellow-400' },
                        { label: 'BẢO TRÌ', value: stats.maintenance, color: 'text-gray-500' },
                    ].map(item => (
                         <motion.div key={item.label} initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} transition={{delay: 0.4 + stats[item.label.toLowerCase()] * 0.02}}>
                            <span className={`block text-2xl font-bold ${item.color}`}>{item.value}</span>
                            <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">{item.label}</span>
                         </motion.div>
                    ))}
                </div>
                 {/* Hiển thị lỗi Socket */}
                 {error && (
                    <p className="text-xs text-red-400 mt-2 text-center"><FontAwesomeIcon icon={faInfoCircle} /> {error}</p>
                 )}
            </div>

            {/* Khu vực hiển thị Sơ đồ Ô đỗ */}
            <div className="bg-gradient-to-br from-bg to-card p-4 md:p-6 lg:p-8" style={{ minHeight: '300px' }}>
                {slots && slots.length > 0 ? (
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                        <AnimatePresence>
                            {slots
                                .sort((a, b) => a.identifier.localeCompare(b.identifier, undefined, { numeric: true })) // Sắp xếp A-1, A-2, A-10
                                .map(slot => (
                                    <ParkingSlot
                                        key={slot._id || slot.identifier} // Dùng identifier làm fallback key nếu _id chưa có
                                        slot={slot}
                                        onSelect={handleSelectSlot}
                                        isSelected={selectedSlot?._id === slot._id}
                                        userVehicleType={userVehicleType}
                                    />
                                ))
                            }
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-text-secondary">
                        {initialSlots === null ? "Đang tải sơ đồ..." : "Chưa có ô đỗ nào được định nghĩa cho bãi xe này."}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ParkingLotVisualizer;