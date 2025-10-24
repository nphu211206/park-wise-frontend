// pages/dashboard.js (PHIÊN BẢN ĐẲNG CẤP HOÀN THIỆN - Đã sửa lỗi Helper)
// Trang tìm kiếm, bản đồ, danh sách bãi xe và lịch sử đặt chỗ.

// --- Import Core Libraries & Hooks ---
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

// --- Import UI & Animation Libraries ---
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet'; // Import Leaflet library
import 'leaflet/dist/leaflet.css'; // Import CSS của Leaflet
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMapMarkerAlt, faStar, faDollarSign, faCar, faMotorcycle, faSlidersH,
    faList, faMapMarkedAlt, faTimes, faHistory, faSpinner, faSearch, faLocationArrow,
    faParking, faUser, faSignOutAlt, faCheckCircle, faBan, faHourglassHalf, faCheck,
    faCircleInfo, faImage, faCog
} from '@fortawesome/free-solid-svg-icons';

// --- Import Custom Components & Context ---
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth'; // Bảo vệ trang này
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import ErrorDisplay from '@/components/utils/ErrorDisplay';

// --- (ĐẲNG CẤP) IMPORT HELPERS TỪ FILE UTILS ---
import {
    formatCurrency,
    renderStars,
    getStatusColor,
    getStatusText,
    getStatusIcon,
    formatAmenityName,
    getAmenityIcon
} from '@/utils/helpers'; // Import từ file utils (ĐẢM BẢO BẠN ĐÃ TẠO FILE NÀY)

// --- Component Card Bãi xe (Hoàn thiện) ---
const ParkingCard = ({ lot, onHover, isHovered }) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        hover: { scale: 1.03, zIndex: 10, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2), 0 5px 10px rgba(0,0,0,0.05)' }
    };

    // Lấy giá cơ sở thấp nhất để hiển thị
    const basePrice = Math.min(
        lot.pricingTiers?.car_4_seats?.basePricePerHour || Infinity,
        lot.pricingTiers?.motorbike?.basePricePerHour || Infinity,
        lot.pricingTiers?.suv?.basePricePerHour || Infinity,
        lot.pricingTiers?.car_7_seats?.basePricePerHour || Infinity
    );
    const displayPrice = isFinite(basePrice) ? basePrice : 0;

    const hoverEffectClass = isHovered
        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 shadow-lg scale-[1.02]'
        : 'shadow-md';

    return (
        <motion.div
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 ${hoverEffectClass}`}
            onMouseEnter={() => onHover(lot._id)}
            onMouseLeave={() => onHover(null)}
        >
            <Link href={`/parking/${lot._id}`} legacyBehavior>
                <a className="block group">
                    <div className="h-40 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                        {lot.images && lot.images[0] ? (
                            <Image
                                src={lot.images[0]}
                                alt={`Ảnh ${lot.name}`}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                             <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                 <FontAwesomeIcon icon={faImage} className="text-4xl text-gray-400 dark:text-gray-500"/>
                             </div>
                        )}
                         <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                             {lot.totalSpots > 0 && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full shadow ${
                                    (lot.availableSpots / lot.totalSpots) > 0.3 ? 'bg-green-100 text-green-800' :
                                    (lot.availableSpots > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')
                                }`}>
                                    Trống: {lot.availableSpots ?? '?'}
                                </span>
                             )}
                         </div>
                    </div>
                    <div className="p-4">
                        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{lot.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 flex-shrink-0"/> {lot.address}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center text-xs" title={`${lot.rating?.toFixed(1) ?? 'Chưa'} sao (${lot.numReviews ?? 0} đánh giá)`}>
                                {renderStars(lot.rating ?? 0)}
                                <span className="text-gray-500 dark:text-gray-400 ml-1.5">({lot.numReviews ?? 0})</span>
                            </div>
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(displayPrice)}
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/giờ</span>
                            </div>
                        </div>
                    </div>
                </a>
            </Link>
        </motion.div>
    );
};

// --- Component Bản đồ Tùy chỉnh (Hoàn thiện) ---
const MapView = ({ lots, hoveredLotId, initialCenter = [21.0285, 105.8542], onMarkerHover, onMarkerClick }) => {
    const mapRef = useRef();

    // Icon SVG inline
    const createMarkerIcon = (color = '#3B82F6', size = 30) => {
        return L.divIcon({
            html: `
                <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                </svg>`,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        });
    };

    const defaultIcon = createMarkerIcon('#3B82F6', 30);
    const highlightedIcon = createMarkerIcon('#EF4444', 40);

    // Component Cập nhật Bounds
    const MapBoundsUpdater = ({ lots }) => {
        const map = useMap();
        useEffect(() => {
            if (lots && lots.length > 0) {
                const bounds = L.latLngBounds(lots.map(lot => [lot.location.coordinates[1], lot.location.coordinates[0]]));
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1 });
                }
            } else if (lots) {
                 map.flyTo(initialCenter, 13, { duration: 1 });
            }
        }, [lots, map]);
        return null;
    };

    // Component Hiển thị Markers
    const MarkersLayer = ({ lots, hoveredLotId, onMarkerHover, onMarkerClick }) => {
        const map = useMap();
        const markersRef = useRef({});

        useEffect(() => {
            // Xóa các marker cũ
            Object.keys(markersRef.current).forEach(lotId => {
                if (!lots.find(lot => lot._id === lotId)) {
                    map.removeLayer(markersRef.current[lotId]);
                    delete markersRef.current[lotId];
                }
            });

            // Thêm/Cập nhật marker mới
            lots.forEach(lot => {
                const isHovered = lot._id === hoveredLotId;
                const position = [lot.location.coordinates[1], lot.location.coordinates[0]];
                const icon = isHovered ? highlightedIcon : defaultIcon;
                const zIndexOffset = isHovered ? 1000 : 0;
                
                const popupContent = `
                    <div class="font-sans text-sm w-48">
                        <h4 class="font-bold text-blue-600 mb-1 truncate">${lot.name}</h4>
                        <p class="text-xs text-gray-500 mb-1.5 truncate">${lot.address}</p>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-600">Trống: <strong class="text-green-600">${lot.availableSpots ?? '?'}</strong>/${lot.totalSpots ?? '?'}</span>
                            <span class="text-yellow-500 flex items-center gap-0.5"><i class="fas fa-star"></i>${lot.rating?.toFixed(1) ?? 'N/A'}</span>
                        </div>
                        <a href="/parking/${lot._id}" class="text-xs text-blue-500 hover:text-blue-700 font-medium mt-2 block w-full text-center bg-blue-50 hover:bg-blue-100 p-1 rounded">
                            Xem chi tiết &rarr;
                        </a>
                    </div>
                `;

                if (markersRef.current[lot._id]) {
                    const marker = markersRef.current[lot._id];
                    if (marker.options.icon !== icon) marker.setIcon(icon);
                    if (marker.options.zIndexOffset !== zIndexOffset) marker.setZIndexOffset(zIndexOffset);
                    marker.setPopupContent(popupContent);
                    if (isHovered && !marker.isPopupOpen()) marker.openPopup();
                } else {
                    const marker = L.marker(position, { icon, riseOnHover: true, zIndexOffset });
                    marker.bindPopup(popupContent, { closeButton: false });
                    marker.on('mouseover', () => onMarkerHover(lot._id));
                    marker.on('mouseout', () => onMarkerHover(null));
                    marker.on('click', () => onMarkerClick(lot._id));
                    marker.addTo(map);
                    markersRef.current[lot._id] = marker;
                    if (isHovered) marker.openPopup();
                }
            });

            // Cleanup
            return () => {
                 Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
                 markersRef.current = {};
            };
        }, [lots, hoveredLotId, map, onMarkerHover, onMarkerClick]);

        return null;
    };

    return (
        <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full rounded-xl shadow-lg z-0" ref={mapRef}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsUpdater lots={lots} />
            <MarkersLayer lots={lots} hoveredLotId={hoveredLotId} onMarkerHover={onMarkerHover} onMarkerClick={onMarkerClick}/>
        </MapContainer>
    );
};

// --- Component Item Lịch sử Đặt chỗ (Hoàn thiện) ---
const BookingHistoryItem = ({ booking, isCancelling, onCancel, onReview }) => {
    const statusColor = getStatusColor(booking.status);
    const statusText = getStatusText(booking.status);
    const statusIcon = getStatusIcon(booking.status);
    const canCancel = (booking.status === 'confirmed' || booking.status === 'pending') && new Date(booking.startTime) > new Date(Date.now() + 3600*1000); // Chỉ hủy trước 1h
    // (Bùng nổ) Cần backend trả về trường `hasReview`
    const canReview = booking.status === 'completed' && !booking.hasReview; 

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
            className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-3"
        >
            <div className="flex-1">
                <Link href={`/parking/${booking.parkingLot?._id}`} legacyBehavior>
                    <a className="font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1 inline-block">
                        {booking.parkingLot?.name ?? 'Bãi xe không còn tồn tại'}
                    </a>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 flex-shrink-0"/> {booking.parkingLot?.address ?? 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 flex-shrink-0"/>
                    {new Date(booking.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })} - {new Date(booking.endTime).toLocaleString('vi-VN', { timeStyle: 'short' })}
                </p>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0 w-full sm:w-auto">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(booking.totalPrice)}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1.5 inline-flex items-center gap-1.5 bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/50 dark:text-${statusColor}-300`}>
                     <FontAwesomeIcon icon={statusIcon} className={`w-3 h-3 ${status === 'pending' ? 'animate-pulse' : ''}`}/>
                    {statusText}
                </span>
                 <div className="mt-2 flex sm:justify-end gap-2">
                     {canCancel && (
                         <button
                            onClick={() => onCancel(booking._id)}
                            disabled={isCancelling}
                            className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            {isCancelling ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Hủy đặt chỗ'}
                         </button>
                     )}
                     {canReview && (
                          <button
                            onClick={() => onReview(booking.parkingLot._id)}
                            className="text-xs text-blue-500 dark:text-blue-400 hover:underline font-medium"
                          >
                             Viết đánh giá
                          </button>
                     )}
                 </div>
            </div>
        </motion.div>
    );
};


// --- Component Chính của Trang Dashboard ---
const DashboardPage = () => {
    // --- Hooks & Context ---
    const { user, token, logout } = useAuth();
    const router = useRouter();

    // --- State Dữ liệu ---
    const [parkingLots, setParkingLots] = useState([]);
    const [bookings, setBookings] = useState([]);

    // --- State UI ---
    const [isLoadingLots, setIsLoadingLots] = useState(true);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [isCancelling, setIsCancelling] = useState(null); // ID booking đang hủy
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredLotId, setHoveredLotId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    // --- State Filters ---
    const [searchTerm, setSearchTerm] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState([]);

    // --- API URL ---
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // --- Hàm Fetch Bãi xe ---
    const fetchParkingLots = useCallback(async (location = null) => {
        setIsLoadingLots(true);
        setError(null);
        try {
            let params = new URLSearchParams();
            if (searchTerm.trim()) params.append('keyword', searchTerm.trim());
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (minRating) params.append('minRating', minRating);
            if (location) {
                params.append('lat', location.lat);
                params.append('lng', location.lng);
                params.append('radius', location.radius || 10);
            }
            if (selectedAmenities.length > 0) params.append('amenities', selectedAmenities.join(','));

            const res = await fetch(`${API_URL}/parking-lots?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}: Không thể tải danh sách bãi xe`);
            const data = await res.json();
            setParkingLots(data);
        } catch (err) {
            setError(err.message);
            setParkingLots([]);
        } finally {
            setIsLoadingLots(false);
        }
    }, [searchTerm, maxPrice, minRating, selectedAmenities, token, API_URL]);

    // --- Hàm Fetch Bookings ---
    const fetchBookings = useCallback(async () => {
        if (!showHistory) return;
        setIsLoadingBookings(true);
        try {
            const res = await fetch(`${API_URL}/bookings/mybookings`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không thể tải lịch sử đặt chỗ');
            const data = await res.json();
            setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error("Lỗi tải booking:", err);
            setError(err.message);
            setBookings([]);
        } finally {
            setIsLoadingBookings(false);
        }
    }, [showHistory, token, API_URL]);

    // --- useEffect: Fetch Bãi xe lần đầu ---
    useEffect(() => {
        fetchParkingLots();
    }, [fetchParkingLots]); // Chạy 1 lần khi load

    // --- useEffect: Fetch Bookings khi showHistory thay đổi ---
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // --- Handlers ---
    const handleFindNearMe = () => {
         if (!navigator.geolocation) {
             setError('Trình duyệt không hỗ trợ định vị.');
             return;
         }
         setIsLoadingLots(true); // Hiển thị loading
         navigator.geolocation.getCurrentPosition(
             (position) => {
                 fetchParkingLots({ lat: position.coords.latitude, lng: position.coords.longitude });
             },
             (geoError) => {
                 setError(`Lỗi định vị: ${geoError.message}`);
                 setIsLoadingLots(false);
             }
         );
    };
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleSearchSubmit = (e) => { e.preventDefault(); fetchParkingLots(); };
    const handleMarkerHover = useCallback((lotId) => setHoveredLotId(lotId), []);
    const handleMarkerClick = useCallback((lotId) => router.push(`/parking/${lotId}`), [router]);
    const handleAmenityChange = (amenity) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };
    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Bạn có chắc chắn muốn hủy lượt đặt chỗ này? (Chỉ có thể hủy trước 1 giờ)')) return;
        setIsCancelling(bookingId);
        try {
            const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Hủy thất bại');
            
            // toast.success('Đã hủy đặt chỗ thành công!');
            alert('Đã hủy đặt chỗ thành công!');
            fetchBookings();
            fetchParkingLots(); // Tải lại bãi xe vì slot đã được giải phóng

        } catch (err) {
            console.error("Lỗi hủy booking:", err);
            // toast.error(`Lỗi: ${err.message}`);
            setError(err.message);
        } finally {
            setIsCancelling(null);
        }
    };
    const handleWriteReview = (parkingLotId) => {
        router.push(`/parking/${parkingLotId}?review=true`);
    };

    // ======================================================
    // --- RENDER GIAO DIỆN ---
    // ======================================================
    return (
        <>
            <Head>
                <title>Dashboard - ParkWise</title>
                <meta name="description" content="Tìm kiếm, xem bản đồ và quản lý đặt chỗ đỗ xe thông minh với ParkWise." />
            </Head>
            {/* <Toaster /> */}

            {/* --- Header --- */}
             <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                         {/* Logo */}
                         <Link href="/dashboard" legacyBehavior>
                             <a className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                <FontAwesomeIcon icon={faParking} className="text-2xl" />
                                <span className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:inline">ParkWise</span>
                            </a>
                        </Link>
                         {/* User Menu Dropdown */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 hidden md:inline">{user?.name}</span>
                            <div className="relative group">
                                <button className="user-avatar bg-gradient-to-br from-blue-500 to-cyan-500 text-white w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-300 dark:ring-offset-gray-800 transition-all">
                                     {user?.name?.charAt(0).toUpperCase() ?? <FontAwesomeIcon icon={faUser} />}
                                 </button>
                                 <motion.div
                                     initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                     animate={{ opacity: 1, y: 0, scale: 1 }}
                                     exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                     transition={{ duration: 0.15 }}
                                     className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 invisible opacity-0 group-hover:visible group-hover:opacity-100 z-50"
                                 >
                                     <Link href="/profile" legacyBehavior><a className="dropdown-item">Hồ sơ của tôi</a></Link>
                                     <Link href="/settings" legacyBehavior><a className="dropdown-item">Cài đặt</a></Link>
                                     <hr className="my-1 border-gray-200 dark:border-gray-600"/>
                                     <button onClick={logout} className="dropdown-item text-red-600 dark:text-red-400 w-full text-left">
                                         Đăng xuất
                                     </button>
                                 </motion.div>
                             </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* --- Welcome Header --- */}
                 <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-blue-900 rounded-xl shadow border border-gray-200 dark:border-gray-700"
                 >
                    <div>
                         <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Chào mừng, {user?.name}!</h1>
                         <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tìm bãi đỗ xe hoặc xem lịch sử đặt chỗ của bạn.</p>
                     </div>
                     <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="btn-secondary text-sm py-2 px-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 flex-shrink-0"
                    >
                        <FontAwesomeIcon icon={faHistory} className="mr-2"/>
                         {showHistory ? 'Ẩn Lịch sử' : 'Xem Lịch sử'}
                    </button>
                 </motion.div>

                 {/* --- Layout Chính: Filters + Content --- */}
                 <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* --- Filters Sidebar --- */}
                     <motion.aside
                        layout
                        className={`lg:w-1/4 xl:w-1/5 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-fit ${ showFilters ? 'block fixed top-0 left-0 w-full h-full z-50 overflow-y-auto' : 'hidden'} lg:sticky lg:top-24 lg:block`}
                     >
                         <div className="flex justify-between items-center mb-5">
                             <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                <FontAwesomeIcon icon={faSlidersH} className="text-blue-500 dark:text-blue-400"/> Bộ lọc
                             </h2>
                             <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-500 dark:text-gray-400 text-xl">
                                 <FontAwesomeIcon icon={faTimes} />
                             </button>
                         </div>
                         <form onSubmit={handleSearchSubmit} className="space-y-5">
                             {/* Search */}
                             <div>
                                 <label htmlFor="searchInput" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Tên / Địa chỉ</label>
                                 <div className="relative">
                                     <input
                                        type="text" id="searchInput" value={searchTerm} onChange={handleSearchChange}
                                        className="input-field w-full !pl-8 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="Tìm kiếm..."
                                    />
                                     <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs"/>
                                 </div>
                             </div>
                             {/* Find Near Me */}
                             <button type="button" onClick={handleFindNearMe} disabled={isLoadingLots}
                                className="w-full btn-secondary text-sm py-2 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 disabled:opacity-50"
                             >
                                <FontAwesomeIcon icon={faLocationArrow} className="mr-2"/> Tìm gần tôi
                            </button>
                             {/* Price */}
                             <div>
                                 <label htmlFor="priceFilter" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Giá tối đa (/giờ)</label>
                                 <select id="priceFilter" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input-field w-full text-sm dark:bg-gray-700 dark:border-gray-600">
                                     <option value="">Tất cả</option>
                                     <option value="20000">Dưới 20.000đ</option>
                                     <option value="50000">Dưới 50.000đ</option>
                                     <option value="100000">Dưới 100.000đ</option>
                                 </select>
                             </div>
                             {/* Rating */}
                             <div>
                                 <label htmlFor="ratingFilter" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Đánh giá tối thiểu</label>
                                 <select id="ratingFilter" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="input-field w-full text-sm dark:bg-gray-700 dark:border-gray-600">
                                     <option value="">Tất cả</option>
                                     <option value="4">4 sao trở lên</option>
                                     <option value="3">3 sao trở lên</option>
                                     <option value="2">2 sao trở lên</option>
                                 </select>
                             </div>
                              {/* (Bùng nổ) Amenities Filter */}
                             <div className="pt-2">
                                 <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Tiện ích</label>
                                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                     {[
                                         { key: 'covered_parking', label: 'Có mái che' },
                                         { key: 'ev_charging', label: 'Sạc xe điện' },
                                         { key: 'cctv', label: 'Camera' },
                                         { key: 'security_24h', label: 'Bảo vệ 24/7' },
                                         { key: 'car_wash', label: 'Rửa xe' }
                                     ].map(amenity => (
                                         <label key={amenity.key} className="flex items-center text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                                             <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                                                checked={selectedAmenities.includes(amenity.key)}
                                                onChange={() => handleAmenityChange(amenity.key)}
                                            />
                                             <FontAwesomeIcon icon={getAmenityIcon(amenity.key)} className="w-3.5 h-3.5 mx-2 text-gray-400 dark:text-gray-500"/>
                                             {amenity.label}
                                         </label>
                                     ))}
                                 </div>
                             </div>
                             {/* Nút Áp dụng lọc */}
                              <button type="submit" disabled={isLoadingLots} className="w-full btn-primary py-2.5 text-sm mt-4 flex items-center justify-center gap-2">
                                  {isLoadingLots ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
                                  {isLoadingLots ? ' Đang tìm...' : ' Áp dụng lọc'}
                              </button>
                         </form>
                     </motion.aside>

                     {/* --- Content Area --- */}
                     <div className="flex-1 lg:w-3/4 xl:w-4/5">
                         <div className="mb-4 flex items-center justify-between">
                            <button onClick={() => setShowFilters(true)} className="lg:hidden btn-secondary text-sm py-2 px-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                <FontAwesomeIcon icon={faSlidersH} /> Bộ lọc
                            </button>
                             <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg ml-auto">
                                 <button
                                     onClick={() => setViewMode('list')}
                                     className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                 >
                                     <FontAwesomeIcon icon={faList} className="mr-1" /> Danh sách
                                 </button>
                                 <button
                                     onClick={() => setViewMode('map')}
                                     className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                 >
                                     <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-1" /> Bản đồ
                                 </button>
                             </div>
                         </div>
                         {/* Hiển thị Loading / Error / Content */}
                         <AnimatePresence mode="wait">
                         {isLoadingLots ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <LoadingSpinner message="Đang tìm bãi xe..." />
                            </motion.div>
                         ) : error && parkingLots.length === 0 ? ( // Chỉ hiện lỗi chính nếu không có data
                             <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <ErrorDisplay message={error} showRetryButton={true} onRetry={fetchParkingLots} />
                            </motion.div>
                         ) : (
                             <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                 {viewMode === 'list' && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                         {parkingLots.length > 0 ? (
                                             parkingLots.map(lot => (
                                                <ParkingCard key={lot._id} lot={lot} onHover={handleMarkerHover} isHovered={lot._id === hoveredLotId}/>
                                             ))
                                         ) : (
                                             <p className="md:col-span-2 xl:col-span-3 text-center text-gray-500 dark:text-gray-400 py-10">
                                                 Không tìm thấy bãi xe nào phù hợp với bộ lọc của bạn.
                                             </p>
                                         )}
                                     </div>
                                 )}
                                 {viewMode === 'map' && (
                                     <div className="h-[500px] md:h-[600px] lg:h-[calc(100vh-250px)] relative">
                                        <MapView
                                            lots={parkingLots}
                                            hoveredLotId={hoveredLotId}
                                            onMarkerHover={handleMarkerHover}
                                            onMarkerClick={handleMarkerClick}
                                        />
                                     </div>
                                 )}
                            </motion.div>
                         )}
                         </AnimatePresence>
                         {/* Lịch sử Đặt chỗ */}
                         <AnimatePresence>
                         {showHistory && (
                             <motion.section
                                key="history"
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: '3rem' }} // Thêm marginTop khi xuất hiện
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="overflow-hidden"
                             >
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                     <FontAwesomeIcon icon={faHistory} /> Lịch sử Đặt chỗ
                                </h2>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                     {isLoadingBookings && <LoadingSpinner message="Đang tải lịch sử..."/>}
                                     {!isLoadingBookings && error && bookings.length === 0 && <ErrorDisplay message={error} />}
                                     {!isLoadingBookings && !error && bookings.length === 0 && (
                                        <p className="text-center text-gray-500 dark:text-gray-400 py-6">Bạn chưa có lượt đặt chỗ nào.</p>
                                     )}
                                     {!isLoadingBookings && !error && bookings.length > 0 && (
                                         bookings.map(booking => (
                                             <BookingHistoryItem
                                                key={booking._id}
                                                booking={booking}
                                                isCancelling={isCancelling === booking._id}
                                                onCancel={handleCancelBooking}
                                                onReview={handleWriteReview}
                                            />
                                         ))
                                     )}
                                     {/* Nút "Xem tất cả" */}
                                     {!isLoadingBookings && bookings.length > 0 && (
                                         <div className="pt-2 text-center border-t border-gray-200 dark:border-gray-600">
                                             <Link href="/history" legacyBehavior>
                                                 <a className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                     Xem toàn bộ lịch sử
                                                 </a>
                                             </Link>
                                         </div>
                                     )}
                                </div>
                            </motion.section>
                         )}
                         </AnimatePresence>
                     </div>
                 </div>
            </main>
            
            {/* --- CSS Global --- */}
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
                 .dropdown-item {
                     @apply block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
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

export default withAuth(DashboardPage);