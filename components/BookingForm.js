// components/BookingForm.js (PHIÊN BẢN ĐẲNG CẤP - Form Đặt chỗ Chi tiết)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faCar, faMotorcycle, faDollarSign, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

// --- Helper Functions (Có thể tách ra utils) ---
// Định dạng tiền tệ Việt Nam
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 VNĐ';
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

// Hàm lấy giá cơ sở dựa trên loại xe
const getBasePrice = (pricingTiers, vehicleType) => {
    if (!pricingTiers || !vehicleType) return 0;
    const tier = pricingTiers[vehicleType]; // VD: pricingTiers['car_4_seats']
    return tier?.basePricePerHour || 0;
};

// Hàm tính số giờ làm tròn lên
const calculateHours = (start, end) => {
    if (!start || !end || end <= start) return 0;
    const diffMs = Math.abs(end - start);
    return Math.ceil(diffMs / 36e5); // 36e5 = 1 giờ (ms)
};

// Hàm lấy giá trị mặc định cho datetime-local (hiện tại + 15 phút)
const getDefaultStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15); // Thêm 15 phút
    now.setSeconds(0);
    now.setMilliseconds(0);
    // Định dạng YYYY-MM-DDTHH:mm
    return now.toISOString().slice(0, 16);
};
// Hàm lấy giá trị mặc định cho end time (start time + 1 giờ)
const getDefaultEndTime = (startTimeStr) => {
    if (!startTimeStr) return '';
    const start = new Date(startTimeStr);
    start.setHours(start.getHours() + 1);
    return start.toISOString().slice(0, 16);
}


// --- Component Chính ---
const BookingForm = ({ slot, parkingLot, user }) => {
    // --- State cho Form ---
    const [startTime, setStartTime] = useState(getDefaultStartTime());
    const [endTime, setEndTime] = useState(getDefaultEndTime(startTime));
    const [vehicleNumber, setVehicleNumber] = useState(''); // Lấy từ profile user nếu có xe mặc định
    // Giả sử lấy loại xe phù hợp với ô đã chọn, hoặc xe mặc định của user
    const defaultVehicleType = slot?.vehicleType !== 'any' ? slot.vehicleType : (user?.profile?.defaultVehicleType || 'car_4_seats');
    const [vehicleType, setVehicleType] = useState(defaultVehicleType); // TODO: Cho phép user chọn xe nếu có nhiều xe
    const [notes, setNotes] = useState('');

    // --- State cho Tính toán & Hiển thị ---
    const [calculatedHours, setCalculatedHours] = useState(0);
    const [baseParkingFee, setBaseParkingFee] = useState(0);
    const [dynamicPriceInfo, setDynamicPriceInfo] = useState(null); // { price: number, reason: string }
    const [serviceFee] = useState(5000); // Phí dịch vụ cố định (ví dụ)
    const [totalCost, setTotalCost] = useState(serviceFee);
    const [timeError, setTimeError] = useState('');

    // --- State cho việc Submit ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: false, error: null }); // { success: boolean, error: string | null }

    const { token } = useAuth(); // Lấy token để gọi API
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // --- Callback Tính toán Chi phí (Sử dụng useCallback để tối ưu) ---
    const calculateCosts = useCallback(() => {
        setTimeError('');
        const start = startTime ? new Date(startTime) : null;
        const end = endTime ? new Date(endTime) : null;

        if (start && end) {
            if (end <= start) {
                setTimeError('Thời gian kết thúc phải sau thời gian bắt đầu.');
                setCalculatedHours(0);
                setBaseParkingFee(0);
                setTotalCost(serviceFee);
                setDynamicPriceInfo(null);
                return;
            }
             if (start < new Date()) {
                 setTimeError('Thời gian bắt đầu không được ở trong quá khứ.');
                 // Vẫn tính thử giá để user tham khảo
             }


            const hours = calculateHours(start, end);
            const basePricePerHour = getBasePrice(parkingLot.pricingTiers, vehicleType);
            const fee = hours * basePricePerHour;

            setCalculatedHours(hours);
            setBaseParkingFee(fee);
            setTotalCost(fee + serviceFee); // Tạm thời dùng giá cơ sở

            // --- (Bùng nổ 💥) Gọi API Backend để lấy Giá AI Dự kiến ---
            // Tạo một API endpoint mới: GET /api/pricing/estimate?lotId=...&start=...&end=...&vehicleType=...
            const fetchDynamicPrice = async () => {
                try {
                    // Tạm thời comment out, cần API backend
                    /*
                    const params = new URLSearchParams({
                        parkingLotId: parkingLot._id,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        vehicleType: vehicleType
                    });
                    const priceResponse = await fetch(`${API_URL}/pricing/estimate?${params.toString()}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!priceResponse.ok) throw new Error('Cannot fetch dynamic price');
                    const priceData = await priceResponse.json(); // { estimatedPrice: number, factors: ["high_demand", "weekend"] }

                    // Cập nhật giá cuối cùng và lý do
                    setTotalCost(priceData.estimatedPrice + serviceFee);
                    setDynamicPriceInfo({ price: priceData.estimatedPrice, reason: `Giá điều chỉnh theo: ${priceData.factors.join(', ')}` });
                    */
                   // Giả lập giá AI cao hơn 20% vào cuối tuần
                   const isWeekend = start.getDay() === 0 || start.getDay() === 6;
                   const aiPrice = isWeekend ? fee * 1.2 : fee;
                   const reason = isWeekend ? "Giá cuối tuần" : "Giá ngày thường";
                   setTotalCost(aiPrice + serviceFee);
                   setDynamicPriceInfo({ price: aiPrice, reason: reason });


                } catch (priceError) {
                    console.warn("Could not fetch dynamic price, using base price.", priceError);
                    setTotalCost(fee + serviceFee); // Fallback về giá cơ sở
                    setDynamicPriceInfo(null);
                }
            };
            fetchDynamicPrice();


        } else {
            // Nếu thời gian chưa đủ, reset
            setCalculatedHours(0);
            setBaseParkingFee(0);
            setTotalCost(serviceFee);
            setDynamicPriceInfo(null);
        }
    }, [startTime, endTime, parkingLot.pricingTiers, vehicleType, serviceFee, parkingLot._id, token, API_URL]); // Dependencies

    // --- useEffect để gọi calculateCosts khi thời gian hoặc loại xe thay đổi ---
    useEffect(() => {
        calculateCosts();
    }, [calculateCosts]); // Chỉ chạy khi hàm calculateCosts thay đổi (do dependencies của nó thay đổi)

     // --- useEffect để cập nhật endTime mặc định khi startTime thay đổi ---
     useEffect(() => {
         setEndTime(getDefaultEndTime(startTime));
     }, [startTime]);


    // --- Hàm Submit Form ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (timeError && !timeError.includes('quá khứ')) { // Cho phép đặt giờ quá khứ để demo
            alert(`Lỗi thời gian: ${timeError}`);
            return;
        }
        if (!startTime || !endTime) {
            alert('Vui lòng chọn thời gian bắt đầu và kết thúc.');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus({ success: false, error: null });

        const bookingData = {
            slotId: slot._id,
            parkingLotId: parkingLot._id,
            startTime: new Date(startTime).toISOString(), // Gửi định dạng ISO cho backend
            endTime: new Date(endTime).toISOString(),
            vehicleNumber: vehicleNumber || null, // Gửi null nếu trống
            vehicleType: vehicleType,
            // totalPrice: totalCost // Backend sẽ tự tính lại giá cuối cùng để đảm bảo chính xác
            // notes: notes // Thêm ghi chú nếu backend hỗ trợ
        };

        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (!response.ok) {
                // (Bùng nổ 💥) Xử lý lỗi cụ thể từ backend (ví dụ: slot đã bị đặt)
                let specificError = result.message || 'Đặt chỗ thất bại. Vui lòng thử lại.';
                if (response.status === 400 && result.message.includes('đã bị chiếm')) {
                    specificError = `Rất tiếc, ô ${slot.identifier} đã được người khác đặt trong lúc bạn thao tác. Vui lòng chọn ô khác.`;
                     // Có thể tự động refresh Visualizer ở đây
                } else if (response.status === 400 && result.message.includes('chỉ dành cho')) {
                    specificError = `Lỗi loại xe: ${result.message}`;
                }
                 throw new Error(specificError);
            }

            // Đặt chỗ thành công!
            setSubmitStatus({ success: true, error: null });
            // TODO: Hiển thị thông báo thành công đẹp hơn (dùng Toast)
             alert(`Đặt chỗ thành công cho ô ${slot.identifier}! Mã đặt chỗ: ${result._id}`);
             // Có thể chuyển hướng hoặc đóng modal/form
             // router.push('/dashboard?bookingSuccess=true');

        } catch (err) {
            console.error("Lỗi khi đặt chỗ:", err);
            setSubmitStatus({ success: false, error: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Form ---
    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Thông báo lỗi Submit */}
            {submitStatus.error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300" role="alert">
                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2"/> {submitStatus.error}
                </motion.div>
            )}
             {/* Thông báo thành công Submit */}
             {submitStatus.success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-300" role="alert">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2"/> Đặt chỗ thành công! Kiểm tra lịch sử đặt chỗ của bạn.
                </motion.div>
            )}


            {/* --- Input Thời gian --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thời gian bắt đầu */}
                <div>
                    <label htmlFor="startTime" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" /> Bắt đầu
                    </label>
                    <input
                        type="datetime-local"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        min={getDefaultStartTime()} // Ngăn chọn quá khứ (trừ khi cần test)
                        className={`input-field w-full dark:bg-gray-700 dark:border-gray-600 ${timeError && timeError.includes('quá khứ') ? 'border-yellow-500 ring-yellow-500' : (timeError ? 'border-red-500 ring-red-500' : '')}`}
                        disabled={isSubmitting}
                    />
                </div>
                {/* Thời gian kết thúc */}
                <div>
                    <label htmlFor="endTime" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-blue-500" /> Kết thúc
                    </label>
                    <input
                        type="datetime-local"
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        min={startTime} // Kết thúc phải sau bắt đầu
                        className={`input-field w-full dark:bg-gray-700 dark:border-gray-600 ${timeError && !timeError.includes('quá khứ') ? 'border-red-500 ring-red-500' : ''}`}
                        disabled={isSubmitting}
                    />
                </div>
            </div>
             {/* Hiển thị lỗi thời gian */}
             {timeError && (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs ${timeError.includes('quá khứ') ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'} mt-1`}>
                    <FontAwesomeIcon icon={faInfoCircle} /> {timeError}
                 </motion.p>
             )}


            {/* --- Input Thông tin Xe --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Loại xe (TODO: Thay bằng Dropdown nếu user có nhiều xe) */}
                 <div>
                    <label htmlFor="vehicleType" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         <FontAwesomeIcon icon={vehicleType === 'motorbike' ? faMotorcycle : faCar} className="mr-2 text-blue-500" /> Loại xe
                    </label>
                     {/* Hiện tại hiển thị dạng text, sau này là dropdown */}
                    <input
                        type="text"
                        id="vehicleType"
                        value={vehicleType.replace(/_/g, ' ')} // Hiển thị 'car 4 seats' thay vì 'car_4_seats'
                        readOnly
                        className="input-field w-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                     />
                     {/* Thông báo nếu loại xe không khớp ô (dù Visualizer đã chặn) */}
                     {slot.vehicleType !== 'any' && slot.vehicleType !== vehicleType && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              <FontAwesomeIcon icon={faInfoCircle} /> Ô này ưu tiên loại xe {slot.vehicleType.replace(/_/g, ' ')}.
                          </p>
                     )}
                 </div>
                {/* Biển số xe */}
                <div>
                    <label htmlFor="vehicleNumber" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <i className="fas fa-id-card mr-2 text-blue-500"></i> Biển số xe <span className="text-xs text-gray-400 ml-1">(Tùy chọn)</span>
                    </label>
                    <input
                        type="text"
                        id="vehicleNumber"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} // Tự viết hoa
                        placeholder="VD: 29A12345"
                        className="input-field w-full dark:bg-gray-700 dark:border-gray-600 uppercase" // Hiển thị chữ hoa
                        disabled={isSubmitting}
                    />
                </div>
            </div>

             {/* --- Ghi chú (Tùy chọn) ---
             <div>
                 <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm</label>
                 <textarea
                     id="notes"
                     rows="2"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Yêu cầu đặc biệt (nếu có)..."
                     className="input-field w-full dark:bg-gray-700 dark:border-gray-600"
                     disabled={isSubmitting}
                 ></textarea>
             </div>
             */}

            {/* --- Tóm tắt Chi phí "Đẳng cấp" --- */}
            <motion.div
                layout // Hiệu ứng layout mượt mà khi giá thay đổi
                className="cost-summary bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-blue-100 dark:border-gray-600"
            >
                <h4 className="text-md font-semibold mb-3 text-blue-800 dark:text-blue-300">Chi phí dự kiến</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phí đỗ xe ({calculatedHours} giờ):</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(baseParkingFee)}</span>
                    </div>
                     {/* Hiển thị giá AI và lý do nếu có */}
                    {dynamicPriceInfo && dynamicPriceInfo.price !== baseParkingFee && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1" title={dynamicPriceInfo.reason}>
                             <FontAwesomeIcon icon={faInfoCircle} />
                            <span>Giá đã điều chỉnh ({dynamicPriceInfo.reason}): {formatCurrency(dynamicPriceInfo.price)}</span>
                        </motion.div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phí dịch vụ:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(serviceFee)}</span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-gray-600 my-2"></div>
                    <div className="flex justify-between text-base font-bold">
                        <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(totalCost)}</span>
                    </div>
                </div>
            </motion.div>

            {/* --- Nút Submit --- */}
            <motion.button
                type="submit"
                className="w-full btn-primary py-3 mt-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait" // Thêm style disable
                disabled={isSubmitting || !!timeError && !timeError.includes('quá khứ')} // Disable nếu đang submit hoặc có lỗi thời gian (trừ lỗi quá khứ)
                whileHover={!isSubmitting ? { scale: 1.02, boxShadow: '0 5px 15px rgba(59, 130, 246, 0.3)' } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
                {isSubmitting ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Đang xử lý...
                    </>
                ) : (
                    <>
                         <FontAwesomeIcon icon={faCheckCircle} /> Xác nhận Đặt chỗ
                    </>
                )}
            </motion.button>
        </form>
    );
};

export default BookingForm;

// --- CSS bổ sung (có thể đặt trong globals.css) ---
/*
.input-field {
    @apply block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500;
}

.btn-primary {
     @apply bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-md;
}
*/