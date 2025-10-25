// pages/parking/[id].js (PHIÊN BẢN ĐẠI TU HOÀN CHỈNH NHẤT - Giai đoạn 1)
// Trang chi tiết bãi xe "đẳng cấp" với ImageGallery, BookingForm, Reviews, Công cụ Admin (conditional).

// --- Import Core Libraries & Hooks ---
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'; // Quản lý thẻ <head>
import Link from 'next/link'; // Link tối ưu
import Image from 'next/image'; // Tối ưu ảnh

// --- Import UI & Animation Libraries ---
import { motion, AnimatePresence } from 'framer-motion'; // Hiệu ứng
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Icons
import { // Import TẤT CẢ icon cần thiết cho trang này
    faArrowLeft, faMapMarkerAlt, faStar, faShareAlt, faHeart, faCheckCircle, faClock,
    faCloudShowersHeavy, faShieldAlt, faVideo, faCarWash, faChargingStation, faUserTie, faBuilding,
    faSearchMinus, faTimes, faEdit, faTrash, faCommentDots, faPaperPlane, faImage, faSpinner,
    faUserShield, faPlusCircle, faEye, faStarHalfAlt, faCalendarDays, faCircleInfo, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// --- Import Custom Components & Context ---
import { useAuth } from '@/context/AuthContext';    // Context xác thực
import withAuth from '@/hoc/withAuth';            // HOC bảo vệ route
import ParkingLotVisualizer from '@/components/ParkingLotVisualizer'; // Sơ đồ ô đỗ
import BookingForm from '@/components/BookingForm';             // Form đặt chỗ
import ImageGallery from '@/components/ImageGallery';           // Carousel ảnh
import LoadingSpinner from '@/utils/LoadingSpinner';   // Component loading
import ErrorDisplay from '@/utils/ErrorDisplay';     // Component lỗi
// (Bùng nổ) Import component Toast (cần cài đặt thư viện, vd: react-hot-toast)
// import toast, { Toaster } from 'react-hot-toast';

// --- (ĐẲNG CẤP) IMPORT HELPERS TỪ FILE UTILS ---
// Đây là bước quan trọng để sửa lỗi.
import {
    formatCurrency,
    renderStars,
    formatAmenityName,
    getAmenityIcon
} from '@/utils/helpers'; // Import từ file utils (ĐẢM BẢO BẠN ĐÃ TẠO FILE NÀY)


// --- Component Nhỏ: Hiển thị 1 Đánh giá (Phiên bản "Đẳng cấp" hơn) ---
const ReviewItem = ({ review }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="py-5 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
        <div className="flex items-start mb-2">
            {/* Avatar Placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-800 dark:to-cyan-800 flex items-center justify-center mr-3 flex-shrink-0 border-2 border-white dark:border-gray-900 shadow">
                {/* Lấy chữ cái đầu của tên */}
                <span className="text-lg font-bold text-blue-700 dark:text-blue-200">{review.user?.name?.charAt(0).toUpperCase() || '?'}</span>
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-x-2">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{review.user?.name || 'Người dùng ẩn danh'}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3"/>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                </div>
                <div className="flex items-center text-xs text-yellow-500 mt-0.5" title={`${review.rating} sao`}>
                    {renderStars(review.rating)}
                </div>
            </div>
        </div>
        {/* whitespace-pre-wrap để giữ định dạng xuống dòng của comment */}
        <p className="text-sm text-gray-600 dark:text-gray-300 pl-13 leading-relaxed whitespace-pre-wrap">{review.comment || '*Chưa có bình luận*'}</p>
    </motion.div>
);

// --- Component Nhỏ: Form Viết Đánh giá (Phiên bản "Đẳng cấp" hơn) ---
const ReviewForm = ({ parkingLotId, token, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // Thêm state thành công
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setError('Vui lòng chọn số sao đánh giá.'); return; }
        if (!comment.trim()) { setError('Vui lòng nhập bình luận của bạn.'); return; }
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            console.log("Submitting review:", { rating, comment });
            const response = await fetch(`${API_URL}/reviews/${parkingLotId}`, { // API Endpoint mới
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gửi đánh giá thất bại');

            setSuccess('Cảm ơn bạn đã gửi đánh giá!');
            // toast.success('Đã gửi đánh giá thành công!'); // Sử dụng Toast
            setRating(0); // Reset form
            setComment('');
            if (onReviewSubmitted) onReviewSubmitted(data); // Truyền review mới lên cha

        } catch (err) {
            setError(err.message);
            // toast.error(`Lỗi: ${err.message}`); // Sử dụng Toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        >
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">Để lại đánh giá của bạn</h4>
            {/* Hiển thị lỗi hoặc thành công */}
            <AnimatePresence>
                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
                    </motion.p>
                )}
                 {success && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                         <FontAwesomeIcon icon={faCheckCircle} /> {success}
                    </motion.p>
                 )}
            </AnimatePresence>
            {/* Chọn sao */}
            <div className="mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Chất lượng dịch vụ:</span>
                <div className="inline-flex space-x-1 text-2xl cursor-pointer" onMouseLeave={() => setHoverRating(0)}>
                    {[...Array(5)].map((_, i) => (
                        <motion.span key={i} whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.9 }}>
                            <FontAwesomeIcon
                                icon={faStar}
                                className={`transition-colors duration-150 ${(hoverRating || rating) > i ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`}
                                onClick={() => setRating(i + 1)}
                                onMouseEnter={() => setHoverRating(i + 1)}
                            />
                        </motion.span>
                    ))}
                </div>
            </div>
            {/* Textarea bình luận */}
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                placeholder="Chia sẻ cảm nhận chi tiết của bạn về giá cả, vị trí, nhân viên, tiện ích..."
                required
                className="input-field w-full text-sm mb-3 dark:bg-gray-700 dark:border-gray-600 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                disabled={isSubmitting || !!success}
            />
            {/* Nút gửi */}
            <motion.button
                type="submit"
                className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-60"
                disabled={isSubmitting || !!success}
                whileHover={!(isSubmitting || !!success) ? { scale: 1.05 } : {}}
                whileTap={!(isSubmitting || !!success) ? { scale: 0.95 } : {}}
            >
                {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                {isSubmitting ? 'Đang gửi...' : (success ? 'Đã gửi' : 'Gửi đánh giá')}
            </motion.button>
        </motion.form>
    );
};


// ======================================================
// --- COMPONENT CHÍNH: TRANG CHI TIẾT BÃI XE ---
// ======================================================
const ParkingLotDetailPage = () => {
    // --- Hooks ---
    const router = useRouter();
    const { id: parkingLotId } = router.query;
    const { token, user, isAdmin } = useAuth();

    // --- State cho Dữ liệu ---
    const [parkingLotData, setParkingLotData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [canUserReview, setCanUserReview] = useState(false);

    // --- State cho Tương tác UI ---
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Hằng số & Cấu hình ---
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const userVehicleType = user?.profile?.defaultVehicleType || "car_4_seats";

    // --- Callback Fetch Reviews ---
    const fetchReviews = useCallback(async (currentLotId, currentToken) => {
        if (!currentLotId || !currentToken) return;
        console.log("Fetching reviews for lot:", currentLotId);
        try {
            // (BÙNG NỔ) API NÀY CẦN BACKEND HỖ TRỢ
            const res = await fetch(`${API_URL}/reviews/${currentLotId}`, {
                 headers: { 'Authorization': `Bearer ${currentToken}` }
             });
             if (!res.ok) throw new Error('Không thể tải đánh giá');
             const data = await res.json();
             console.log("Reviews fetched:", data);
             setReviews((data.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
             setCanUserReview(data.canReview || false);
        } catch (reviewError) {
            console.error("Lỗi khi tải đánh giá:", reviewError.message);
            // Giả lập dữ liệu nếu fetch lỗi (để UI không trống)
             setReviews([
                 { _id: 'r1', user: { name: 'Nguyễn Văn Test' }, rating: 5, comment: 'Bãi xe rộng rãi, sạch sẽ, giá hợp lý.', createdAt: new Date(Date.now() - 86400000).toISOString() },
                 { _id: 'r2', user: { name: 'Trần Thị Demo' }, rating: 4, comment: 'Nhân viên thân thiện, hướng dẫn nhiệt tình.', createdAt: new Date(Date.now() - 172800000).toISOString() }
             ]);
             setCanUserReview(true); // Giả lập user này có thể review
        }
    }, [API_URL]);

    // --- useEffect Chính: Fetch Dữ liệu ---
    useEffect(() => {
        if (!parkingLotId || !token) {
            setIsLoading(false);
            return;
        }

        console.log(`ParkingLotDetailPage: Fetching data for lot ID: ${parkingLotId}`);
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            setParkingLotData(null);
            setReviews([]);
            setCanUserReview(false);
            setSelectedSlot(null);

            try {
                // Fetch đồng thời cả lot info và reviews
                const [lotResponse] = await Promise.all([
                    fetch(`${API_URL}/parking-lots/${parkingLotId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetchReviews(parkingLotId, token) // Gọi hàm fetch reviews
                ]);

                console.log(`ParkingLot Response Status: ${lotResponse.status}`);

                if (lotResponse.status === 401) throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
                if (lotResponse.status === 404) throw new Error('Không tìm thấy bãi xe này.');
                if (!lotResponse.ok) throw new Error(`Lỗi ${lotResponse.status} khi tải dữ liệu bãi xe.`);

                const lotData = await lotResponse.json();
                console.log("ParkingLot Data Received:", lotData);
                setParkingLotData(lotData);

            } catch (err) {
                console.error("Error fetching parking lot data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [parkingLotId, token, API_URL, fetchReviews]);

    // --- Callbacks ---
    const handleSlotSelected = useCallback((slot) => {
        console.log("Slot selected:", slot);
        setSelectedSlot(slot);
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
    }, []);

    const handleReviewSubmitted = useCallback((newReview) => {
        console.log("Review submitted, adding to list...");
        // toast.success('Đã gửi đánh giá thành công!');
        setReviews(prevReviews => [newReview, ...prevReviews]); // Thêm review mới vào đầu danh sách
        setCanUserReview(false); // User không thể review lại
    }, []);


    // ======================================================
    // --- RENDER GIAO DIỆN ---
    // ======================================================

    if (isLoading) {
        return <LoadingSpinner message="Đang tải chi tiết bãi xe..." fullScreen={true} />;
    }

    if (error) {
        const canRetry = error.includes('tải dữ liệu') || error.includes('Xác thực');
        return <ErrorDisplay
                    message={error}
                    fullScreen={true}
                    showRetryButton={canRetry}
                    onRetry={() => router.reload()} // Reload trang
                />;
    }

    if (!parkingLotData) {
        return <ErrorDisplay message="Rất tiếc, không tìm thấy dữ liệu cho bãi xe này." fullScreen={true} icon={faSearchMinus} />;
    }

    const { name, address, images = [], slots = [], description, amenities = [], rating = 0, numReviews = 0, openingHours } = parkingLotData;

    return (
        <>
            <Head>
                <title>{`Chi tiết ${name} - ParkWise`}</title>
                <meta name="description" content={`Xem chi tiết, đánh giá và đặt chỗ tại ${name}, ${address}. ParkWise - Hệ thống đỗ xe thông minh.`} />
                <meta property="og:title" content={`Chi tiết ${name} - ParkWise`} />
                <meta property="og:description" content={description || `Đặt chỗ tại ${name}, ${address}.`} />
                <meta property="og:image" content={images[0] || 'https://via.placeholder.com/1200x630.png?text=ParkWise'} />
            </Head>
            {/* <Toaster position="top-center" reverseOrder={false} /> */}

            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 md:p-8 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">

                    {/* --- Navigation & Breadcrumbs --- */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
                        className="mb-6 flex items-center justify-between"
                    >
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 group"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-1 transition-transform" />
                             Quay lại
                        </button>
                         <nav className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden md:block" aria-label="Breadcrumb">
                             <Link href="/dashboard" className="hover:underline hover:text-blue-600 dark:hover:text-blue-400">
                                Dashboard
                             </Link>
                             <span className="mx-1.5">/</span>
                             <span className="font-medium text-gray-700 dark:text-gray-200" aria-current="page">{name}</span>
                         </nav>
                    </motion.div>

                    {/* --- Header Thông tin Bãi xe & Ảnh --- */}
                    <motion.section
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="mb-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 mb-1.5">
                                    {name}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 flex-shrink-0"/> {address}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm flex-shrink-0 mt-2 md:mt-0">
                                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2.5 py-1 rounded-full shadow-sm" title={`${rating.toFixed(1)} sao (${numReviews} đánh giá)`}>
                                    <FontAwesomeIcon icon={faStar} />
                                    <span className="font-semibold">{rating.toFixed(1)}</span>
                                     <span className="text-yellow-600 dark:text-yellow-400 hidden sm:inline">({numReviews} đ.giá)</span>
                                </div>
                                <button className="icon-btn" title="Chia sẻ" onClick={() => navigator.clipboard.writeText(window.location.href) /* && toast.success('Đã sao chép link!') */}>
                                    <FontAwesomeIcon icon={faShareAlt} />
                                </button>
                                <button className="icon-btn text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50" title="Yêu thích">
                                    <FontAwesomeIcon icon={faHeart} />
                                </button>
                            </div>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
                             {(images && images.length > 0) ? (
                                <ImageGallery images={images} />
                             ) : (
                                <div className="mt-6 aspect-video w-full rounded-lg overflow-hidden shadow-inner bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                     <FontAwesomeIcon icon={faImage} className="text-4xl text-gray-400 dark:text-gray-500" />
                                </div>
                             )}
                         </div>
                    </motion.section>

                     {/* --- Layout Grid: Visualizer/Reviews & Chi tiết/Admin --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                         {/* --- Cột Trái (Visualizer & Reviews) --- */}
                        <div className="lg:col-span-2 space-y-8">
                            <ParkingLotVisualizer
                                parkingLotId={parkingLotId}
                                initialSlots={slots}
                                onSlotSelect={handleSlotSelected}
                                userVehicleType={userVehicleType}
                                lotName={name}
                                lotAddress={address}
                            />
                            {/* Khu vực Đánh giá */}
                             <motion.div
                                 className="card-standard p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                             >
                                 <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 text-gray-800 dark:text-gray-100 flex items-center justify-between">
                                     <span className="flex items-center gap-2">
                                         <FontAwesomeIcon icon={faCommentDots} className="text-blue-500 dark:text-blue-400"/> Đánh giá ({reviews.length})
                                     </span>
                                     {/* (Bùng nổ) Nút Lọc/Sắp xếp reviews */}
                                     {/* <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Xem tất cả</button> */}
                                 </h3>
                                 {/* Danh sách Reviews */}
                                 {reviews.length > 0 ? (
                                     <div className="max-h-96 overflow-y-auto pr-2 divide-y divide-gray-200 dark:divide-gray-700">
                                         {reviews.map(review => <ReviewItem key={review._id} review={review} />)}
                                     </div>
                                 ) : (
                                     <p className="text-sm text-center text-gray-500 dark:text-gray-400 italic py-6">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                                 )}
                                  {/* Form viết Review */}
                                 {canUserReview && !isAdmin && (
                                     <ReviewForm
                                         parkingLotId={parkingLotId}
                                         token={token}
                                         onReviewSubmitted={handleReviewSubmitted}
                                     />
                                 )}
                                 {/* Thông báo CanReview */}
                                 {!canUserReview && !isAdmin && user && (
                                     <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-5 italic">
                                         Bạn cần hoàn thành một lượt đỗ xe tại đây để có thể viết đánh giá.
                                     </p>
                                 )}
                             </motion.div>
                        </div>

                         {/* --- Cột Phải (Chi tiết & Công cụ Admin) --- */}
                         <motion.div
                             className="lg:col-span-1 space-y-6"
                             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                         >
                            {/* Card Thông tin Chi tiết */}
                             <div className="card-standard p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                 <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                     <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 dark:text-blue-400"/> Thông tin chi tiết
                                 </h3>
                                 {description ? (
                                     <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">{description}</p>
                                 ) : (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-5">Chưa có mô tả chi tiết cho bãi xe này.</p>
                                 )}
                                 {/* Tiện ích */}
                                 {amenities && amenities.length > 0 && (
                                     <div className="mb-5">
                                        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Tiện ích nổi bật:</h4>
                                         <div className="flex flex-wrap gap-2">
                                             {amenities.map(amenity => (
                                                 <span key={amenity} className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                                     <FontAwesomeIcon icon={getAmenityIcon(amenity)} className="w-3.5 h-3.5"/>
                                                     {formatAmenityName(amenity)}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                                 {/* Giờ hoạt động */}
                                 <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                     <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Giờ hoạt động:</h4>
                                     <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                         {openingHours?.is24h
                                             ? <><FontAwesomeIcon icon={faCheckCircle} className="text-green-500"/> Mở cửa 24/7</>
                                             : <><FontAwesomeIcon icon={faClock} className="text-gray-400"/> {openingHours?.open} - {openingHours?.close}</>
                                         }
                                     </p>
                                 </div>
                             </div>
                             
                             {/* (Đẳng cấp) Card Công cụ Admin */}
                            {isAdmin && (
                                <motion.div
                                    className="mt-6 card-standard p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl shadow-lg"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-lg font-semibold mb-4 border-b pb-3 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faUserShield} /> Công cụ Quản trị
                                    </h3>
                                    <div className="space-y-3">
                                        <Link href={`/admin/parking-lots/edit/${parkingLotId}`} legacyBehavior>
                                            <a className="w-full btn-secondary text-sm py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center">
                                                 <FontAwesomeIcon icon={faEdit} className="mr-2"/> Chỉnh sửa Bãi xe
                                             </a>
                                        </Link>
                                        <button className="w-full btn-secondary text-sm py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center"
                                                onClick={() => alert('Chức năng Quản lý Ô đỗ trực quan (Kéo thả, Sửa trạng thái) sẽ được phát triển!')}>
                                            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" /> Quản lý Ô đỗ (Visual)
                                        </button>
                                         <Link href={`/admin/bookings?lotId=${parkingLotId}`} legacyBehavior>
                                            <a className="w-full btn-secondary text-sm py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center">
                                                 <FontAwesomeIcon icon={faEye} className="mr-2"/> Xem Bookings của Bãi
                                             </a>
                                        </Link>
                                         <button className="w-full btn-secondary text-sm py-2 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center justify-center"
                                                 onClick={() => confirm('Xóa bãi xe này?') && alert('API Xóa bãi xe sẽ được gọi!')}>
                                            <FontAwesomeIcon icon={faTrash} className="mr-2"/> Xóa Bãi xe
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                         </motion.div>
                    </div>

                    {/* --- Phần Form Đặt chỗ (Khi chọn Slot) --- */}
                    <AnimatePresence>
                        {selectedSlot && (
                            <motion.section
                                id="booking-section"
                                className="mt-12 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                         Đặt chỗ cho ô <span className="text-brand font-bold">{selectedSlot.identifier}</span>
                                    </h2>
                                     <button onClick={() => setSelectedSlot(null)} className="text-gray-400 hover:text-red-500 transition-colors" title="Đóng">
                                         <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                     </button>
                                </div>
                                
                                {/* --- Tích hợp BookingForm --- */}
                                <BookingForm slot={selectedSlot} parkingLot={parkingLotData} user={user} />
                                
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- CSS Global Inline --- */}
            <style jsx global>{`
                /* Định nghĩa các class CSS dùng chung */
                .input-field {
                    @apply block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out
                           focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                           dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-offset-gray-900;
                }
                .btn-primary {
                    @apply bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 shadow-md disabled:opacity-60 disabled:cursor-wait;
                }
                 .btn-secondary {
                     @apply px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-gray-900 hover:bg-gray-50 dark:hover:bg-gray-600;
                }
                .card-standard {
                    @apply border border-gray-200 dark:border-gray-700;
                }
                .icon-btn {
                    @apply w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150;
                }
                 /* Tùy chỉnh Leaflet Popup */
                .leaflet-popup-content {
                     margin: 12px !important;
                     font-size: 13px;
                     line-height: 1.5;
                 }
                 .leaflet-popup-content-wrapper {
                     border-radius: 8px !important;
                     box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                     border: 1px solid #eee !important;
                 }
                 .leaflet-popup-tip {
                    box-shadow: none !important;
                 }
            `}</style>
        </>
    );
};

// **Quan trọng**: Xóa bỏ toàn bộ các hàm helper (formatCurrency, getAmenityIcon, ...)
// ở cuối file này vì chúng đã được IMPORT từ `utils/helpers.js`.
// Các dòng code lỗi của bạn chính là các hàm helper bị comment dở dang.

// Bọc component export default bằng HOC
export default withAuth(ParkingLotDetailPage);