// components/BookingForm.js (PHIÊN BẢN ĐẠI NÂNG CẤP - CHI TIẾT & ĐẲNG CẤP NHẤT V1.0)
// Tích hợp nhiều tính năng, validation chi tiết, gọi giá AI, chọn xe, UI/UX mượt mà.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router'; // Import useRouter để có thể chuyển hướng sau khi đặt chỗ thành công
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt, faClock, faCar, faMotorcycle, faDollarSign, faInfoCircle,
    faSpinner, faCheckCircle, faTimesCircle, faIdCard, faStickyNote,
    faBolt, faCarSide, // Thêm icon faCarSide
    // Import thêm icon nếu cần cho các loại xe khác (faTruck, faBus, ...)
} from '@fortawesome/free-solid-svg-icons';
import {  faCreditCard } from '@fortawesome/free-solid-svg-icons';
// Import helpers (Đảm bảo file này tồn tại và đúng nội dung)
import { formatCurrency, debounce } from '@/utils/helpers';

// --- Hằng số và Cấu hình ---
const SERVICE_FEE = 5000; // Phí dịch vụ (có thể lấy từ config/backend sau)
const MIN_BOOKING_DURATION_MINUTES = 30; // Thời gian đặt tối thiểu (ví dụ: 30 phút)
const DEBOUNCE_TIME_MS = 500; // Thời gian chờ khi thay đổi input thời gian trước khi gọi API giá

// --- Kiểu Dữ liệu (Sử dụng JSDoc cho JS) ---
/**
 * @typedef {object} UserVehicle
 * @property {string} _id
 * @property {string} numberPlate
 * @property {'motorbike' | 'car_4_seats' | 'car_7_seats' | 'suv' | 'ev_car' | string} type
 * @property {boolean} isDefault
 * @property {string} [nickname] - Tên gợi nhớ cho xe
 */

/**
 * @typedef {object} DynamicPriceInfo
 * @property {number} estimatedPrice - Giá cuối cùng ước tính (đã bao gồm AI/phụ phí)
 * @property {number} basePrice - Giá gốc (chưa tính phụ phí)
 * @property {string[]} factors - Các yếu tố ảnh hưởng giá (vd: ['weekend_surcharge', 'high_demand'])
 * @property {string | null} reason - Mô tả ngắn gọn lý do giá thay đổi (vd: "Cuối tuần, Nhu cầu cao")
 */

// --- Component Chính ---
const BookingForm = ({ slot, parkingLot, user }) => {
    const router = useRouter(); // Khởi tạo router
    const { token, user: authUser } = useAuth(); // Lấy token và thông tin user đầy đủ từ context
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // --- State cho Form Input ---
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    // (Bùng nổ 💥) State để lưu danh sách xe của user và xe đang chọn
    const [userVehicles, setUserVehicles] = useState(/** @type {UserVehicle[]} */ ([]));
    const [selectedVehicleId, setSelectedVehicleId] = useState(''); // ID của xe được chọn từ danh sách
    const [selectedVehicleType, setSelectedVehicleType] = useState(''); // Loại xe được chọn (quan trọng cho tính giá)
    const [notes, setNotes] = useState('');

    // --- State cho Tính toán & Hiển thị ---
    const [calculatedHours, setCalculatedHours] = useState(0);
    const [baseParkingFee, setBaseParkingFee] = useState(0);
    const [dynamicPriceInfo, setDynamicPriceInfo] = useState(/** @type {DynamicPriceInfo | null} */ (null));
    const [totalCost, setTotalCost] = useState(SERVICE_FEE);
    const [validationError, setValidationError] = useState({ time: '', vehicle: '', general: '' }); // Lỗi validation chi tiết
    const [isFetchingPrice, setIsFetchingPrice] = useState(false); // Trạng thái đang gọi API giá

    // --- State cho việc Submit ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: false, message: null }); // { success: boolean, message: string | null }

    // --- Hàm lấy giá trị mặc định cho datetime-local ---
    const getDefaultDateTime = useCallback((minutesToAdd = 15) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutesToAdd);
        now.setSeconds(0);
        now.setMilliseconds(0);
        // Add timezone offset before slicing to get correct local time format
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
        return localISOTime;
    }, []);

    // --- useEffect: Khởi tạo giá trị mặc định cho thời gian và xe ---
    useEffect(() => {
        setStartTime(getDefaultDateTime(15)); // Mặc định bắt đầu sau 15 phút
        setEndTime(getDefaultDateTime(75));   // Mặc định kết thúc sau 1 giờ 15 phút (tức là đặt 1 tiếng)

        // (Bùng nổ 💥) Lấy danh sách xe của user từ profile (giả sử có trong authUser)
        const vehicles = authUser?.profile?.vehicles || []; // Cần backend trả về thông tin này
        setUserVehicles(vehicles);

        // Chọn xe mặc định hoặc xe đầu tiên phù hợp với slot
        let defaultVehicle = vehicles.find(v => v.isDefault);
        if (!defaultVehicle && vehicles.length > 0) {
            // Nếu không có xe default, thử tìm xe đầu tiên phù hợp với loại slot
            const suitableVehicle = vehicles.find(v => slot?.vehicleType === 'any' || v.type === slot?.vehicleType);
            defaultVehicle = suitableVehicle || vehicles[0]; // Nếu không có xe phù hợp, lấy xe đầu tiên
        }

        if (defaultVehicle) {
            setSelectedVehicleId(defaultVehicle._id);
            setSelectedVehicleType(defaultVehicle.type);
            setVehicleNumber(defaultVehicle.numberPlate); // Tự điền biển số xe mặc định
        } else {
            // Nếu user chưa có xe nào, hoặc slot yêu cầu loại xe đặc biệt mà user không có
            // -> Ưu tiên loại xe của slot (nếu không phải 'any')
            const initialType = slot?.vehicleType !== 'any' ? slot.vehicleType : 'car_4_seats'; // Mặc định là ô tô 4 chỗ nếu slot là 'any'
            setSelectedVehicleType(initialType);
            setSelectedVehicleId(''); // Không có xe nào được chọn từ danh sách
            setVehicleNumber(''); // Để trống biển số
        }

    }, [authUser, slot, getDefaultDateTime]); // Chỉ chạy 1 lần khi component mount hoặc user/slot thay đổi

    // --- Hàm lấy giá cơ sở từ parkingLot data ---
    const getBasePricePerHour = useCallback((vehicleType) => {
        if (!parkingLot?.pricingTiers || !vehicleType) return 0;
        const tier = parkingLot.pricingTiers[vehicleType];
        return tier?.basePricePerHour || 0;
    }, [parkingLot?.pricingTiers]);

    // --- Hàm tính số giờ làm tròn lên ---
    const calculateBookingHours = useCallback((start, end) => {
        if (!start || !end || end <= start) return 0;
        const diffMs = Math.abs(end - start);
        return Math.ceil(diffMs / 3600000); // 3600000 ms = 1 giờ
    }, []);

    // --- (Đẳng cấp ✨) Hàm Fetch Giá Động/AI (Sử dụng useCallback và debounce) ---
    const fetchDynamicPriceEstimate = useCallback(debounce(async (fetchStartTime, fetchEndTime, fetchVehicleType) => {
        if (!fetchStartTime || !fetchEndTime || !fetchVehicleType || !parkingLot?._id || !token) {
            console.warn("[fetchDynamicPriceEstimate] Missing required params or context.");
            return; // Không gọi API nếu thiếu thông tin
        }

        const start = new Date(fetchStartTime);
        const end = new Date(fetchEndTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            console.warn("[fetchDynamicPriceEstimate] Invalid time range.");
            return; // Không gọi API nếu thời gian không hợp lệ
        }

        setIsFetchingPrice(true);
        setDynamicPriceInfo(null); // Xóa giá cũ
        console.log(`[fetchDynamicPriceEstimate] Calling API for lot ${parkingLot._id}, type ${fetchVehicleType}`);

        try {
            const params = new URLSearchParams({
                parkingLotId: parkingLot._id,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                vehicleType: fetchVehicleType
            });
            const priceResponse = await fetch(`${API_URL}/pricing/estimate?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const priceData = await priceResponse.json();

            if (!priceResponse.ok) {
                throw new Error(priceData.message || 'Không thể lấy giá dự kiến.');
            }

            console.log("[fetchDynamicPriceEstimate] API response:", priceData);

            // Format lý do giá động
            let reason = null;
            if (priceData.factors && priceData.factors.length > 0 && !priceData.factors.includes('base_price')) {
                 reason = priceData.factors.map(factor => {
                        switch (factor) {
                            case 'weekend_surcharge': return 'Cuối tuần';
                            case 'peak_hour_surcharge': return 'Giờ cao điểm';
                            // Thêm các case khác
                            default: return factor.replace(/_/g, ' ');
                        }
                    }).join(', ');
            }

            setDynamicPriceInfo({
                estimatedPrice: priceData.estimatedPrice,
                basePrice: priceData.basePrice,
                factors: priceData.factors || ['base_price'],
                reason: reason
            });
            // Cập nhật lại totalCost dựa trên giá động
            setTotalCost((priceData.estimatedPrice || baseParkingFee) + SERVICE_FEE);

        } catch (priceError) {
            console.error("[fetchDynamicPriceEstimate] Error:", priceError);
            setValidationError(prev => ({ ...prev, general: `Lỗi lấy giá: ${priceError.message}` }));
            setDynamicPriceInfo(null); // Reset nếu lỗi
            // Giữ lại totalCost dựa trên giá cơ sở đã tính trước đó
        } finally {
            setIsFetchingPrice(false);
        }
    }, DEBOUNCE_TIME_MS), [parkingLot?._id, token, API_URL, baseParkingFee]); // Thêm baseParkingFee vào dependencies của debounce wrapper

    // --- useEffect: Tính toán lại chi phí và gọi API giá khi input thay đổi ---
    useEffect(() => {
        // --- Bước 1: Validation thời gian và loại xe ---
        let timeError = '';
        let vehicleError = '';
        const start = startTime ? new Date(startTime) : null;
        const end = endTime ? new Date(endTime) : null;
        let currentHours = 0;
        let currentBaseFee = 0;

        if (start && end) {
            if (end <= start) {
                timeError = 'Giờ kết thúc phải sau giờ bắt đầu.';
            } else {
                const durationMinutes = (end.getTime() - start.getTime()) / 60000;
                if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) {
                    timeError = `Thời gian đặt tối thiểu là ${MIN_BOOKING_DURATION_MINUTES} phút.`;
                } else {
                    currentHours = calculateBookingHours(start, end);
                }
            }
             // Cảnh báo nếu chọn giờ quá khứ (vẫn cho phép để demo, nhưng có cảnh báo)
             const nowWithBuffer = new Date(Date.now() - 5 * 60000); // Cho phép trễ 5 phút
             if (start && start < nowWithBuffer) {
                 timeError = timeError ? `${timeError} Thời gian bắt đầu đã ở trong quá khứ.` : 'Thời gian bắt đầu đã ở trong quá khứ.';
             }
        } else if (!startTime || !endTime) {
            timeError = 'Vui lòng chọn thời gian bắt đầu và kết thúc.';
        }

        // Kiểm tra loại xe được chọn có phù hợp với slot không
        if (slot?.vehicleType && slot.vehicleType !== 'any' && selectedVehicleType && selectedVehicleType !== slot.vehicleType) {
            vehicleError = `Ô ${slot.identifier} chỉ dành cho loại xe "${slot.vehicleType.replace(/_/g, ' ')}". Xe bạn chọn là "${selectedVehicleType.replace(/_/g, ' ')}".`;
            // Cân nhắc: Có nên chặn submit hay chỉ cảnh báo? Hiện tại chỉ cảnh báo.
        }

        // --- Bước 2: Tính giá cơ sở ---
        if (currentHours > 0 && selectedVehicleType) {
            const pricePerHour = getBasePricePerHour(selectedVehicleType);
            if (pricePerHour === 0 && parkingLot?.pricingTiers) {
                 // Nếu giá là 0, kiểm tra xem có tier giá cho loại xe đó không
                 if (!parkingLot.pricingTiers[selectedVehicleType]) {
                     vehicleError = `Bãi xe này chưa hỗ trợ giá cho loại xe "${selectedVehicleType.replace(/_/g, ' ')}".`;
                 }
            }
            currentBaseFee = currentHours * pricePerHour;
        }

        // --- Bước 3: Cập nhật state UI ---
        setValidationError({ time: timeError, vehicle: vehicleError, general: '' }); // Xóa lỗi general cũ
        setCalculatedHours(currentHours);
        setBaseParkingFee(currentBaseFee);
        setTotalCost(currentBaseFee + SERVICE_FEE); // Cập nhật totalCost với giá cơ sở trước khi gọi API

        // --- Bước 4: Gọi hàm fetch giá động (đã được debounce) ---
        if (!timeError && !vehicleError && currentHours > 0 && selectedVehicleType) {
             // Chỉ gọi API nếu thời gian và xe hợp lệ cơ bản
            fetchDynamicPriceEstimate(startTime, endTime, selectedVehicleType);
        } else {
            // Nếu có lỗi validation, không gọi API giá và reset giá động
             setIsFetchingPrice(false); // Đảm bảo không còn loading
             setDynamicPriceInfo(null);
        }

    // Các dependencies của useEffect chính này
    }, [startTime, endTime, selectedVehicleType, slot?.vehicleType, slot?.identifier, getBasePricePerHour, calculateBookingHours, fetchDynamicPriceEstimate]);


    // --- Hàm Submit Form "Đẳng Cấp" ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- Validation Cuối Cùng Trước Khi Submit ---
        if (validationError.time && !validationError.time.includes('quá khứ')) {
            setSubmitStatus({ success: false, message: validationError.time });
            return;
        }
         if (validationError.vehicle) { // Chặn nếu có lỗi loại xe không phù hợp
             setSubmitStatus({ success: false, message: validationError.vehicle });
             return;
         }
        if (calculatedHours <= 0) {
            setSubmitStatus({ success: false, message: 'Thời gian đặt không hợp lệ hoặc quá ngắn.' });
            return;
        }
        if (!selectedVehicleType) {
            setSubmitStatus({ success: false, message: 'Vui lòng chọn loại xe.' });
            return;
        }
         // (Bùng nổ 💥) Kiểm tra lại slot ngay trước khi submit
         // Điều này cần một API mới: GET /api/slots/:slotId/check-availability?parkingLotId=...
         /*
         try {
             const checkRes = await fetch(`${API_URL}/slots/${slot._id}/check-availability?parkingLotId=${parkingLot._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
             const checkData = await checkRes.json();
             if (!checkRes.ok || !checkData.isAvailable) {
                 throw new Error(checkData.message || `Ô ${slot.identifier} không còn trống.`);
             }
         } catch (checkErr) {
             setSubmitStatus({ success: false, message: `Lỗi kiểm tra ô: ${checkErr.message}` });
             return;
         }
         */


        setIsSubmitting(true);
        setSubmitStatus({ success: false, message: null });

        const bookingData = {
            slotId: slot._id,
            parkingLotId: parkingLot._id,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            vehicleNumber: vehicleNumber || null,
            vehicleType: selectedVehicleType,
            notes: notes.trim() || null,
            // totalPrice: totalCost // Backend sẽ tự tính lại giá cuối cùng
        };
        console.log("Submitting booking data:", bookingData);

        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(bookingData)
            });
            const result = await response.json();

            if (!response.ok) {
                let specificError = result.message || 'Đặt chỗ thất bại. Vui lòng thử lại.';
                if (response.status === 400 && result.message?.includes('đã bị chiếm')) {
                    specificError = `Rất tiếc, ô ${slot.identifier} vừa được người khác đặt. Vui lòng chọn ô khác.`;
                    // Có thể thêm logic tự động refresh Visualizer ở đây
                } else if (response.status === 400 && result.message?.includes('chỉ dành cho')) {
                    specificError = `Lỗi loại xe: ${result.message}`;
                }
                throw new Error(specificError);
            }

            console.log("Booking successful:", result);
            setSubmitStatus({ success: true, message: `Đặt chỗ thành công cho ô ${slot.identifier}! Mã: ${result._id}` });

            // (Bùng nổ 💥) Tùy chọn: Chuyển hướng sau vài giây hoặc hiển thị nút để quay lại dashboard
             setTimeout(() => {
                 router.push('/dashboard?bookingSuccess=true'); // Chuyển hướng về dashboard với query param
             }, 3000); // Chờ 3 giây

        } catch (err) {
            console.error("Lỗi khi đặt chỗ:", err);
            setSubmitStatus({ success: false, message: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Lấy Icon cho Loại xe ---
    const getVehicleIcon = (type) => {
        switch (type) {
            case 'motorbike': return faMotorcycle;
            case 'ev_car': return faChargingStation; // Cần import
            // Thêm các case khác nếu cần
            default: return faCarSide; // Icon xe hơi chung
        }
    };

    // --- Render Form ---
    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* --- Thông báo Submit --- */}
            <AnimatePresence>
                {submitStatus.message && (
                    <motion.div
                        key="submit-status"
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`p-4 mb-4 text-sm rounded-lg flex items-center gap-2 ${
                            submitStatus.success
                                ? 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300'
                                : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300'
                        }`} role="alert"
                    >
                        <FontAwesomeIcon icon={submitStatus.success ? faCheckCircle : faTimesCircle} className="flex-shrink-0"/>
                        {submitStatus.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Input Thời gian --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thời gian bắt đầu */}
                <div>
                    <label htmlFor="startTime" className="label-form">
                        <FontAwesomeIcon icon={faCalendarAlt} /> Bắt đầu *
                    </label>
                    <input
                        type="datetime-local" id="startTime" value={startTime}
                        onChange={(e) => setStartTime(e.target.value)} required
                        min={getDefaultDateTime(0)} // Cho phép chọn từ bây giờ
                        className={`input-field ${validationError.time && validationError.time.includes('quá khứ') ? 'input-warning' : (validationError.time ? 'input-error' : '')}`}
                        disabled={isSubmitting || submitStatus.success}
                    />
                </div>
                {/* Thời gian kết thúc */}
                <div>
                    <label htmlFor="endTime" className="label-form">
                        <FontAwesomeIcon icon={faClock} /> Kết thúc *
                    </label>
                    <input
                        type="datetime-local" id="endTime" value={endTime}
                        onChange={(e) => setEndTime(e.target.value)} required
                        min={startTime} // Phải sau thời gian bắt đầu
                        className={`input-field ${validationError.time && !validationError.time.includes('quá khứ') ? 'input-error' : ''}`}
                        disabled={isSubmitting || submitStatus.success}
                    />
                </div>
            </div>
            {/* Hiển thị lỗi thời gian */}
            {validationError.time && (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs mt-1 ${validationError.time.includes('quá khứ') ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    <FontAwesomeIcon icon={faInfoCircle} /> {validationError.time}
                 </motion.p>
             )}

            {/* --- Input Thông tin Xe "Đẳng cấp" --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* (Bùng nổ 💥) Chọn xe từ danh sách hoặc nhập mới */}
                 <div>
                    <label htmlFor="vehicleSelect" className="label-form">
                         <FontAwesomeIcon icon={getVehicleIcon(selectedVehicleType)} /> Chọn xe *
                    </label>
                    <select
                        id="vehicleSelect"
                        value={selectedVehicleId}
                        onChange={(e) => {
                            const vId = e.target.value;
                            setSelectedVehicleId(vId);
                            if (vId === 'new') {
                                setSelectedVehicleType(''); // Reset type khi chọn nhập mới
                                setVehicleNumber('');
                            } else {
                                const selectedVeh = userVehicles.find(v => v._id === vId);
                                if (selectedVeh) {
                                    setSelectedVehicleType(selectedVeh.type);
                                    setVehicleNumber(selectedVeh.numberPlate);
                                }
                            }
                        }}
                        className="input-field"
                        disabled={isSubmitting || submitStatus.success}
                    >
                        <option value="" disabled={userVehicles.length > 0}>-- Chọn xe đã lưu --</option>
                        {userVehicles.map(vehicle => (
                            <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.nickname || vehicle.numberPlate} ({vehicle.type.replace(/_/g, ' ')})
                            </option>
                        ))}
                        <option value="new">-- Nhập thông tin xe mới --</option>
                    </select>
                 </div>

                 {/* Hiển thị input Loại xe & Biển số khi chọn "Nhập mới" hoặc chưa có xe */}
                 <AnimatePresence>
                 {(selectedVehicleId === 'new' || userVehicles.length === 0) && (
                     <motion.div
                        key="new-vehicle-inputs"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                     >
                         <div>
                             <label htmlFor="newVehicleType" className="label-form">Loại xe mới *</label>
                             <select
                                 id="newVehicleType"
                                 value={selectedVehicleType}
                                 onChange={(e) => setSelectedVehicleType(e.target.value)}
                                 className={`input-field ${validationError.vehicle ? 'input-error' : ''}`}
                                 required={selectedVehicleId === 'new' || userVehicles.length === 0}
                                 disabled={isSubmitting || submitStatus.success}
                             >
                                 <option value="" disabled>-- Chọn loại xe --</option>
                                 {/* Lấy enum từ model ParkingLot */}
                                 {(ParkingLot?.schema?.path('slots')?.schema?.path('vehicleType')?.enumValues || ['motorbike', 'car_4_seats', 'car_7_seats', 'suv', 'ev_car', 'any']).map(type => (
                                     type !== 'any' && // Không cho đặt xe 'any'
                                     <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                 ))}
                             </select>
                         </div>
                         <div>
                             <label htmlFor="newVehicleNumber" className="label-form">Biển số xe mới <span className="label-optional">(Tùy chọn)</span></label>
                             <input
                                 type="text" id="newVehicleNumber" value={vehicleNumber}
                                 onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                 placeholder="VD: 29A12345"
                                 className="input-field uppercase"
                                 disabled={isSubmitting || submitStatus.success}
                             />
                         </div>
                     </motion.div>
                 )}
                 </AnimatePresence>
                 {/* Hiển thị biển số của xe đã chọn (nếu không phải nhập mới) */}
                 {selectedVehicleId && selectedVehicleId !== 'new' && (
                     <div>
                         <label htmlFor="selectedVehicleNumber" className="label-form"><FontAwesomeIcon icon={faIdCard} /> Biển số xe</label>
                         <input
                             type="text" id="selectedVehicleNumber" value={vehicleNumber} readOnly
                             className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                         />
                     </div>
                 )}

            </div>
             {/* Hiển thị lỗi/cảnh báo về loại xe */}
             {validationError.vehicle && (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-600 dark:text-red-400 mt-1">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> {validationError.vehicle}
                 </motion.p>
             )}


            {/* --- Ghi chú (Tùy chọn) --- */}
             <div>
                 <label htmlFor="notes" className="label-form">
                     <FontAwesomeIcon icon={faStickyNote} /> Ghi chú thêm <span className="label-optional">(Tùy chọn)</span>
                 </label>
                 <textarea
                     id="notes" rows="2" value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Yêu cầu đặc biệt (ví dụ: cần hỗ trợ đỗ xe)..."
                     className="input-field"
                     disabled={isSubmitting || submitStatus.success}
                 ></textarea>
             </div>

            {/* --- Tóm tắt Chi phí "Đẳng cấp" (Đã cập nhật ở lần trước) --- */}
            <motion.div
                layout // Hiệu ứng layout mượt mà khi giá thay đổi
                className="cost-summary bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-blue-100 dark:border-gray-600 relative overflow-hidden"
            >
                {/* Overlay loading khi đang fetch giá */}
                 <AnimatePresence>
                 {isFetchingPrice && (
                     <motion.div
                         key="price-loading"
                         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                         className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm flex items-center justify-center z-10"
                     >
                         <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-xl mr-2"/>
                         <span className="text-sm text-gray-600 dark:text-gray-300">Đang lấy giá...</span>
                     </motion.div>
                 )}
                 </AnimatePresence>

                <h4 className="text-md font-semibold mb-3 text-blue-800 dark:text-blue-300">Chi phí dự kiến</h4>
                 {/* ... (Nội dung hiển thị giá như đã code ở lần trước) ... */}
                 <div className="space-y-1.5 text-sm">
                    {calculatedHours > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Giá đỗ xe gốc ({calculatedHours} giờ):</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(baseParkingFee, '...')}</span>
                        </div>
                    )}
                    {dynamicPriceInfo && dynamicPriceInfo.estimatedPrice !== baseParkingFee && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center justify-between gap-1 pl-2 border-l-2 border-indigo-300 dark:border-indigo-600">
                             <span className="flex items-center gap-1"><FontAwesomeIcon icon={faBolt} />{dynamicPriceInfo.reason ? `Giá động (${dynamicPriceInfo.reason}):` : 'Giá ước tính:'}</span>
                             <span className="font-semibold">{formatCurrency(dynamicPriceInfo.estimatedPrice, '...')}</span>
                        </motion.div>
                    )}
                     {dynamicPriceInfo && dynamicPriceInfo.estimatedPrice === baseParkingFee && !dynamicPriceInfo.reason && (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500 dark:text-gray-400 text-right">(Áp dụng giá cơ bản)</motion.div>
                     )}
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phí dịch vụ:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(SERVICE_FEE)}</span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-gray-600 my-2"></div>
                    <div className="flex justify-between text-base font-bold">
                        <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(totalCost, '...')}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic text-center"><FontAwesomeIcon icon={faInfoCircle} className="mr-1"/>Giá ước tính. Giá cuối cùng dựa trên thời gian thực tế.</p>
                </div>
            </motion.div>

             {/* (Bùng nổ 💥) Placeholder cho Chọn Phương thức Thanh toán */}
             <div className="payment-placeholder border-t border-gray-200 dark:border-gray-700 pt-5">
                 <h4 className="label-form mb-2"><FontAwesomeIcon icon={faCreditCard} /> Thanh toán</h4>
                 <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                     (Tính năng thanh toán trực tuyến qua Momo/ZaloPay/VNPay sẽ được tích hợp ở giai đoạn sau. Hiện tại, vui lòng thanh toán tại bãi.)
                 </div>
             </div>


            {/* --- Nút Submit --- */}
            <motion.button
                type="submit"
                className={`w-full btn-primary py-3 mt-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${submitStatus.success ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 !text-white' : ''}`}
                disabled={isSubmitting || submitStatus.success || !!validationError.time || !!validationError.vehicle || calculatedHours <= 0 || isFetchingPrice} // Disable nếu đang submit, thành công, có lỗi, chưa tính giờ, đang fetch giá
                whileHover={!(isSubmitting || submitStatus.success) ? { scale: 1.02, boxShadow: '0 5px 15px rgba(59, 130, 246, 0.3)' } : {}}
                whileTap={!(isSubmitting || submitStatus.success) ? { scale: 0.98 } : {}}
            >
                {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin /> Đang xử lý...</>
                 : submitStatus.success ? <><FontAwesomeIcon icon={faCheckCircle} /> Đặt chỗ thành công!</>
                 : <><FontAwesomeIcon icon={faCheckCircle} /> Xác nhận Đặt chỗ</>
                 }
            </motion.button>

             {/* Thêm CSS class tiện ích */}
             <style jsx>{`
                .label-form {
                    @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
                }
                .label-optional {
                    @apply text-xs text-gray-400 dark:text-gray-500 font-normal;
                }
                .input-field {
                    @apply block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-offset-gray-800;
                }
                .input-error {
                     @apply border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-600 dark:focus:ring-red-600;
                }
                 .input-warning {
                    @apply border-yellow-500 ring-1 ring-yellow-500 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-600 dark:focus:border-yellow-600 dark:focus:ring-yellow-600;
                 }
                 /* Cần import faCreditCard */
                 /* import { ..., faCreditCard } from '@fortawesome/free-solid-svg-icons'; */
             `}</style>

        </form>
    );
};



export default BookingForm;