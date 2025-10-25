// utils/helpers.js (PHIÊN BẢN ĐẲNG CẤP - TẬP TRUNG HÓA TIỆN ÍCH)
// File này chứa các hàm tiện ích dùng chung cho toàn bộ frontend.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    faStar, faStarHalfAlt, faCloudShowersHeavy, faShieldAlt, faVideo, faCarWash,
    faChargingStation, faUserTie, faBuilding, faCheckCircle,
    faCar, faCheck, faHourglassHalf, faBan, faCircleInfo,
    faWheelchair, faChair, faBicycle, faCalendarCheck
    // (Bùng nổ) Thêm icon nếu cần cho các tiện ích/trạng thái mới sau này
} from '@fortawesome/free-solid-svg-icons';

/**
 * Định dạng số thành tiền tệ Việt Nam Đẳng Cấp.
 * @param {number | null | undefined} amount - Số tiền cần định dạng.
 * @param {string} fallback - Giá trị trả về nếu amount không hợp lệ (mặc định 'N/A').
 * @returns {string} - Chuỗi tiền tệ (ví dụ: "50.000 ₫") hoặc giá trị fallback.
 */
export const formatCurrency = (amount, fallback = 'N/A') => {
    // Kiểm tra kỹ lưỡng hơn, bao gồm cả null và undefined
    if (typeof amount !== 'number' || isNaN(amount) || amount === null || amount === undefined) {
        console.warn(`[formatCurrency] Invalid amount received: ${amount}, returning fallback "${fallback}"`);
        return fallback;
    }
    try {
        // Sử dụng Intl.NumberFormat để có hiệu năng tốt hơn và linh hoạt hơn
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0, // Bỏ phần thập phân .00
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (error) {
        console.error(`[formatCurrency] Error formatting amount ${amount}:`, error);
        return fallback; // Trả về fallback nếu có lỗi không mong muốn
    }
};

/**
 * Render một mảng các component sao FontAwesome dựa trên điểm rating.
 * Hỗ trợ hiển thị nửa sao với độ chính xác cao hơn.
 * @param {number | string | null | undefined} rating - Điểm đánh giá (từ 0 đến 5).
 * @param {string} starClassName - Class CSS tùy chỉnh cho các icon sao (nếu cần).
 * @returns {Array<JSX.Element>} - Mảng các JSX Element icon sao.
 */
export const renderStars = (rating, starClassName = '') => {
    // Chuyển đổi và kiểm tra rating đầu vào
    const numericRating = Number(rating);
    const validRating = (isNaN(numericRating) || numericRating < 0) ? 0 : Math.min(numericRating, 5); // Đảm bảo rating từ 0-5

    const stars = [];
    const fullStars = Math.floor(validRating);
    // Điều chỉnh logic nửa sao: >= 0.25 thì làm tròn lên nửa sao, >= 0.75 làm tròn lên sao tròn
    const hasHalfStar = validRating % 1 >= 0.25 && validRating % 1 < 0.75;
    const roundedUpStars = Math.ceil(validRating); // Số sao làm tròn lên

    // Render sao đầy
    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <FontAwesomeIcon
                key={`full-${i}`}
                icon={faStar}
                className={`text-yellow-400 ${starClassName}`}
                aria-hidden="true" // Ẩn khỏi trình đọc màn hình
            />
        );
    }

    // Render nửa sao (nếu có)
    if (hasHalfStar) {
        stars.push(
            <FontAwesomeIcon
                key="half"
                icon={faStarHalfAlt}
                className={`text-yellow-400 ${starClassName}`}
                aria-hidden="true"
            />
        );
    }

    // Render sao rỗng (phần còn lại)
    const emptyStarsCount = 5 - (fullStars + (hasHalfStar ? 1 : 0));
    for (let i = 0; i < emptyStarsCount; i++) {
        stars.push(
            <FontAwesomeIcon
                key={`empty-${i}`}
                icon={faStar} // Vẫn dùng faStar nhưng với màu khác
                className={`text-gray-300 dark:text-gray-600 ${starClassName}`}
                aria-hidden="true"
            />
        );
    }

    // (Accessibility) Thêm một span ẩn để đọc rating cho trình đọc màn hình
    stars.push(
        <span key="sr-rating" className="sr-only">{`${validRating.toFixed(1)} trên 5 sao`}</span>
    );


    return stars;
};

/**
 * Dịch tên tiện ích từ key sang Tiếng Việt "Đẳng cấp".
 * Có thể mở rộng dễ dàng với nhiều tiện ích hơn.
 * @param {string} amenityKey - Key tiện ích (ví dụ: 'ev_charging').
 * @returns {string} - Tên Tiếng Việt hoặc key gốc nếu không tìm thấy.
 */
export const formatAmenityName = (amenityKey) => {
    const nameMap = {
        'covered_parking': 'Có mái che',
        'security_24h': 'Bảo vệ 24/7',
        'cctv': 'Camera giám sát',
        'car_wash': 'Rửa xe',
        'ev_charging': 'Sạc xe điện',
        'valet_parking': 'Valet',
        'rooftop': 'Tầng thượng',
        'disabled_access': 'Lối đi cho người khuyết tật', // Ví dụ thêm
        'lounge_area': 'Phòng chờ',                  // Ví dụ thêm
        'bike_parking': 'Chỗ đỗ xe đạp',           // Ví dụ thêm
        // Thêm các tiện ích khác ở đây
    };

    if (nameMap[amenityKey]) {
        return nameMap[amenityKey];
    } else {
        // Nếu không có trong map, thử format lại key (bỏ gạch dưới, viết hoa chữ cái đầu)
        console.warn(`[formatAmenityName] Unknown amenity key: ${amenityKey}`);
        return amenityKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

/**
 * Lấy icon FontAwesome cho từng tiện ích "Đẳng cấp".
 * @param {string} amenityKey - Key tiện ích.
 * @returns {object} - Object icon của FontAwesome hoặc icon mặc định.
 */
export const getAmenityIcon = (amenityKey) => {
    const iconMap = {
        'covered_parking': faCloudShowersHeavy,
        'security_24h': faShieldAlt,
        'cctv': faVideo,
        'car_wash': faCarWash,
        'ev_charging': faChargingStation,
        'valet_parking': faUserTie,
        'rooftop': faBuilding,
        'disabled_access': faWheelchair, // Cần import faWheelchair
        'lounge_area': faChair,       // Cần import faChair
        'bike_parking': faBicycle,      // Cần import faBicycle
        // Thêm icon cho các tiện ích khác
    };
    // Cần import thêm các icon mới vào đầu file nếu sử dụng
    // Ví dụ: import { ..., faWheelchair, faChair, faBicycle } from '@fortawesome/free-solid-svg-icons';

    return iconMap[amenityKey] || faCheckCircle; // Trả về icon check mặc định nếu không tìm thấy
};

// --- Các hàm tiện ích cho Trạng thái Booking (Đã có trong file bạn gửi) ---

/**
 * Lấy màu sắc Tailwind (prefix) dựa trên trạng thái booking.
 * @param {string} status - Trạng thái booking (vd: 'completed', 'active').
 * @returns {string} - Tên màu Tailwind (ví dụ: 'green', 'blue', 'gray').
 */
export const getStatusColor = (status) => {
    switch (status?.toLowerCase()) { // Chuyển sang chữ thường để an toàn
        case 'completed': return 'green';
        case 'active': return 'blue';
        case 'confirmed': return 'yellow';
        case 'pending': return 'gray'; // Hoặc 'indigo' nếu muốn khác
        case 'cancelled': return 'red';
        case 'reserved': return 'purple'; // Trạng thái mới từ backend
        default: return 'gray';
    }
};

/**
 * Dịch trạng thái booking sang Tiếng Việt "Đẳng cấp".
 * @param {string} status - Trạng thái booking.
 * @returns {string} - Tên Tiếng Việt hoặc status gốc nếu không map được.
 */
export const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed': return 'Đã hoàn thành';
        case 'active': return 'Đang đỗ';
        case 'confirmed': return 'Đã xác nhận';
        case 'pending': return 'Chờ xử lý';
        case 'cancelled': return 'Đã hủy';
        case 'reserved': return 'Đã đặt trước'; // Trạng thái mới
        default: return status || 'Không xác định'; // Trả về text mặc định nếu status null/undefined
    }
};

/**
 * Lấy icon FontAwesome cho từng trạng thái booking "Đẳng cấp".
 * @param {string} status - Trạng thái booking.
 * @returns {object} - Object icon của FontAwesome hoặc icon mặc định.
 */
export const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed': return faCheckCircle;
        case 'active': return faCar; // Icon xe hơi
        case 'confirmed': return faCheck; // Icon check đơn giản
        case 'pending': return faHourglassHalf; // Icon đồng hồ cát
        case 'cancelled': return faBan; // Icon cấm
        case 'reserved': return faCalendarCheck; // Icon lịch có dấu check (Cần import faCalendarCheck)
        default: return faCircleInfo; // Icon thông tin mặc định
    }
    // Cần import thêm faCalendarCheck nếu dùng: import { ..., faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
};

/**
 * (Bùng nổ 💥) Hàm debounce đơn giản.
 * Giúp trì hoãn việc thực thi một hàm cho đến khi người dùng ngừng thao tác (ví dụ: gõ tìm kiếm).
 * @param {function} func - Hàm cần debounce.
 * @param {number} wait - Thời gian chờ (milliseconds).
 * @returns {function} - Hàm đã được debounce.
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * (Bùng nổ 💥) Hàm tạo slug thân thiện với URL từ chuỗi.
 * Ví dụ: "Bãi Xe Vincom Bà Triệu" -> "bai-xe-vincom-ba-trieu"
 * @param {string} str - Chuỗi cần tạo slug.
 * @returns {string} - Chuỗi slug.
 */
export const slugify = (str) => {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD') // Chuẩn hóa Unicode (tách dấu)
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Bỏ ký tự đặc biệt (giữ lại chữ, số, khoảng trắng, gạch nối)
    .replace(/[\s_-]+/g, '-') // Thay khoảng trắng, gạch dưới bằng gạch nối
    .replace(/^-+|-+$/g, ''); // Bỏ gạch nối ở đầu/cuối
};

// Thêm các hàm helper khác nếu cần...