// utils/helpers.js (PHIÊN BẢN ĐẲNG CẤP - Tiện ích dùng chung)

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import {
    faCloudShowersHeavy, faShieldAlt, faVideo, faCarWash,
    faChargingStation, faUserTie, faBuilding, faCheckCircle,
    faCar, faCheck, faHourglassHalf, faBan, faCircleInfo
} from '@fortawesome/free-solid-svg-icons';

/**
 * Định dạng số thành tiền tệ Việt Nam.
 * @param {number} amount - Số tiền.
 * @returns {string} - Chuỗi tiền tệ (ví dụ: 50.000 ₫).
 */
export const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        // Trả về 'N/A' hoặc một giá trị mặc định rõ ràng
        return 'N/A';
    }
    return amount.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0 // Bỏ .00
    });
};

/**
 * Render một mảng các component sao dựa trên điểm rating.
 * @param {number} rating - Điểm đánh giá (từ 0 đến 5).
 * @returns {Array<JSX.Element>} - Mảng các icon sao.
 */
export const renderStars = (rating) => {
    const validRating = Number(rating) || 0;
    const stars = [];
    const fullStars = Math.floor(validRating);
    const halfStar = validRating % 1 >= 0.4; // Cho phép làm tròn từ .4
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
        stars.push(<FontAwesomeIcon key={`full-${i}`} icon={faStar} className="text-yellow-400" />);
    }
    if (halfStar) {
        stars.push(<FontAwesomeIcon key="half" icon={faStarHalfAlt} className="text-yellow-400" />);
    }
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="text-gray-300 dark:text-gray-600" />);
    }
    return stars;
};

/**
 * Dịch tên tiện ích từ key sang Tiếng Việt.
 * @param {string} amenity - Key tiện ích (ví dụ: 'ev_charging').
 * @returns {string} - Tên Tiếng Việt.
 */
export const formatAmenityName = (amenity) => {
    const nameMap = {
        'covered_parking': 'Có mái che',
        'security_24h': 'Bảo vệ 24/7',
        'cctv': 'Camera giám sát',
        'car_wash': 'Rửa xe',
        'ev_charging': 'Sạc xe điện',
        'valet_parking': 'Valet',
        'rooftop': 'Tầng thượng'
    };
    return nameMap[amenity] || amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Lấy icon FontAwesome cho từng tiện ích.
 * @param {string} amenity - Key tiện ích.
 * @returns {object} - Object icon của FontAwesome.
 */
export const getAmenityIcon = (amenity) => {
    switch (amenity) {
        case 'covered_parking': return faCloudShowersHeavy;
        case 'security_24h': return faShieldAlt;
        case 'cctv': return faVideo;
        case 'car_wash': return faCarWash;
        case 'ev_charging': return faChargingStation;
        case 'valet_parking': return faUserTie;
        case 'rooftop': return faBuilding;
        default: return faCheckCircle;
    }
};

/**
 * Lấy màu sắc Tailwind dựa trên trạng thái booking.
 * @param {string} status - Trạng thái booking.
 * @returns {string} - Tên màu (ví dụ: 'green', 'blue').
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return 'green';
        case 'active': return 'blue';
        case 'confirmed': return 'yellow';
        case 'cancelled': return 'red';
        default: return 'gray';
    }
};

/**
 * Dịch trạng thái booking sang Tiếng Việt.
 * @param {string} status - Trạng thái booking.
 * @returns {string} - Tên Tiếng Việt.
 */
export const getStatusText = (status) => {
    switch (status) {
        case 'completed': return 'Đã hoàn thành';
        case 'active': return 'Đang đỗ';
        case 'confirmed': return 'Đã xác nhận';
        case 'pending': return 'Chờ xác nhận';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
};

/**
 * Lấy icon FontAwesome cho từng trạng thái booking.
 * @param {string} status - Trạng thái booking.
 * @returns {object} - Object icon của FontAwesome.
 */
export const getStatusIcon = (status) => {
    switch (status) {
        case 'completed': return faCheckCircle;
        case 'active': return faCar;
        case 'confirmed': return faCheck;
        case 'pending': return faHourglassHalf;
        case 'cancelled': return faBan;
        default: return faCircleInfo;
    }
};