// pages/profile/vehicles.js (TRANG QUẢN LÝ XE "ĐẲNG CẤP")

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/hoc/withAuth'; // Bảo vệ trang này
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCarSide, faMotorcycle, faChargingStation, faPlus, faEdit, faTrash, faStar,
    faSpinner, faArrowLeft, faCheckCircle, faExclamationTriangle, faTimes,
    // Import thêm icon nếu cần
} from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '@/utils/LoadingSpinner';
import ErrorDisplay from '@/utils/ErrorDisplay';

// --- Kiểu dữ liệu ---
/**
 * @typedef {import('@/utils/helpers').UserVehicle} UserVehicle
 */

// --- Component Form Thêm/Sửa Xe (Modal) ---
const VehicleFormModal = ({ isOpen, onClose, vehicleToEdit = null, onSave, isLoading }) => {
    const [nickname, setNickname] = useState('');
    const [numberPlate, setNumberPlate] = useState('');
    const [type, setType] = useState('car_4_seats'); // Mặc định
    const [isDefault, setIsDefault] = useState(false);
    const [error, setError] = useState('');

    // Lấy danh sách loại xe hợp lệ (cần lấy từ đâu đó, ví dụ context hoặc props)
    // Tạm thời dùng list cứng
    const validVehicleTypes = ['motorbike', 'car_4_seats', 'car_7_seats', 'suv', 'ev_car'];


    useEffect(() => {
        if (vehicleToEdit) {
            setNickname(vehicleToEdit.nickname || '');
            setNumberPlate(vehicleToEdit.numberPlate || '');
            setType(vehicleToEdit.type || 'car_4_seats');
            setIsDefault(vehicleToEdit.isDefault || false);
            setError('');
        } else {
            // Reset form khi mở để thêm mới
            setNickname('');
            setNumberPlate('');
            setType('car_4_seats');
            setIsDefault(false);
            setError('');
        }
    }, [vehicleToEdit, isOpen]); // Chạy lại khi mở modal hoặc đổi xe cần sửa

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!numberPlate.trim() || !type) {
            setError('Biển số xe và loại xe là bắt buộc.');
            return;
        }
        // Thêm validation biển số nếu cần
        onSave({
            _id: vehicleToEdit?._id, // Gửi _id nếu là sửa
            nickname: nickname.trim() || null,
            numberPlate: numberPlate.trim().toUpperCase(),
            type,
            isDefault
        });
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose} // Đóng khi click nền
        >
            <motion.div
                initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()} // Ngăn click bên trong đóng modal
            >
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                            {vehicleToEdit ? 'Chỉnh sửa thông tin xe' : 'Thêm xe mới'}
                        </h2>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-md flex items-center gap-2">
                               <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
                           </div>
                        )}
                        <div>
                            <label htmlFor="nickname" className="label-form">Tên gợi nhớ <span className="label-optional">(VD: Xe Vợ)</span></label>
                            <input type="text" id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Để trống nếu không cần" className="input-field" maxLength={50} />
                        </div>
                        <div>
                            <label htmlFor="numberPlate" className="label-form">Biển số xe *</label>
                            <input type="text" id="numberPlate" value={numberPlate} onChange={e => setNumberPlate(e.target.value)} required placeholder="VD: 29A12345" className="input-field uppercase" disabled={!!vehicleToEdit} />
                             {vehicleToEdit && <p className="text-xs text-gray-500 mt-1 italic">(Không thể thay đổi biển số xe)</p>}
                        </div>
                        <div>
                            <label htmlFor="type" className="label-form">Loại xe *</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value)} required className="input-field">
                                {validVehicleTypes.map(vt => (
                                    <option key={vt} value={vt}>{vt.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="isDefault" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Đặt làm xe mặc định</label>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                        <motion.button type="button" onClick={onClose} disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary py-2 px-4 text-sm disabled:opacity-50">
                            <FontAwesomeIcon icon={faTimes} className="mr-1.5" /> Hủy
                        </motion.button>
                        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50">
                            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                            {isLoading ? 'Đang lưu...' : (vehicleToEdit ? 'Cập nhật' : 'Thêm xe')}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};


// --- Component Hiển thị một Xe ---
const VehicleItem = ({ vehicle, onEdit, onDelete, onSetDefault, isDeleting, isSettingDefault }) => {
    // Lấy icon tương ứng
    const getVehicleIcon = (type) => {
        switch (type) {
            case 'motorbike': return faMotorcycle;
            case 'ev_car': return faChargingStation;
            default: return faCarSide;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={getVehicleIcon(vehicle.type)} className="text-3xl w-8 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{vehicle.nickname || vehicle.numberPlate}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.numberPlate} - {vehicle.type.replace(/_/g, ' ')}
                    </p>
                    {vehicle.isDefault && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 inline-flex items-center gap-1 mt-1">
                            <FontAwesomeIcon icon={faStar} className="w-3 h-3"/> Mặc định
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {!vehicle.isDefault && (
                     <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => onSetDefault(vehicle._id)}
                        disabled={isSettingDefault || isDeleting}
                        className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                        title="Đặt làm mặc định"
                    >
                         {isSettingDefault ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faStar} />}
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(vehicle)}
                    disabled={isDeleting || isSettingDefault}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                    title="Chỉnh sửa"
                >
                    <FontAwesomeIcon icon={faEdit} />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(vehicle._id)}
                    disabled={isDeleting || isSettingDefault}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Xóa xe"
                >
                     {isDeleting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}
                </motion.button>
            </div>
        </motion.div>
    );
};


// --- Component Trang Chính ---
const ManageVehiclesPage = () => {
    const { user, token, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [vehicles, setVehicles] = useState(/** @type {UserVehicle[]} */ ([]));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vehicleToEdit, setVehicleToEdit] = useState(/** @type {UserVehicle | null} */(null));
    const [actionLoading, setActionLoading] = useState(/** @type {{ delete: string | null, setDefault: string | null, save: boolean }} */ ({ delete: null, setDefault: null, save: false })); // Lưu ID đang xử lý hoặc trạng thái lưu chung

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const headers = useMemo(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    // --- Fetch danh sách xe ---
    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/users/profile/vehicles`, { headers });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || `Lỗi ${response.status} khi tải danh sách xe.`);
            }
            const data = await response.json();
            setVehicles(data);
        } catch (err) {
            console.error("Lỗi tải xe:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, headers]);

    useEffect(() => {
        if (token) { // Chỉ fetch khi có token
            fetchVehicles();
        } else if (!isAuthLoading) {
            // Nếu không loading auth mà vẫn không có token -> lỗi?
             setError("Lỗi xác thực, không thể tải danh sách xe.");
             setIsLoading(false);
        }
    }, [token, isAuthLoading, fetchVehicles]);

    // --- Hàm xử lý Modal ---
    const handleOpenAddModal = () => {
        setVehicleToEdit(null);
        setIsModalOpen(true);
    };
    const handleOpenEditModal = (vehicle) => {
        setVehicleToEdit(vehicle);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        if (actionLoading.save) return; // Không cho đóng khi đang lưu
        setIsModalOpen(false);
        setVehicleToEdit(null); // Reset form
    };

    // --- Hàm xử lý Lưu (Thêm/Sửa) ---
    const handleSaveVehicle = async (vehicleData) => {
        setActionLoading(prev => ({ ...prev, save: true }));
        setError(null); // Xóa lỗi cũ
        const isEditing = !!vehicleData._id;
        const url = isEditing
            ? `${API_URL}/users/profile/vehicles/${vehicleData._id}`
            : `${API_URL}/users/profile/vehicles`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(vehicleData)
            });
            const updatedVehicles = await response.json();
            if (!response.ok) {
                throw new Error(updatedVehicles.message || `Không thể ${isEditing ? 'cập nhật' : 'thêm'} xe.`);
            }
            setVehicles(updatedVehicles); // Cập nhật state với danh sách mới nhất từ backend
            handleCloseModal();
            // toast.success(`Đã ${isEditing ? 'cập nhật' : 'thêm'} xe thành công!`); // Thông báo thành công
        } catch (err) {
            console.error("Lỗi lưu xe:", err);
            // Hiển thị lỗi ngay trên modal thay vì state chung
            // setError(err.message);
             if (err instanceof Error) {
                 // Gán lỗi vào state của modal để hiển thị trực tiếp
                 const formErrorSetter = (msg) => {
                      // Cần truy cập state error của modal từ đây, hơi phức tạp
                      // Giải pháp đơn giản hơn là truyền setError của modal vào đây
                      // Hoặc throw lỗi để catch bên ngoài và set vào state error chung
                      setError(err.message); // Tạm thời vẫn dùng state chung
                 };
                 formErrorSetter(err.message);
             }

        } finally {
            setActionLoading(prev => ({ ...prev, save: false }));
        }
    };

    // --- Hàm xử lý Xóa ---
    const handleDeleteVehicle = async (vehicleId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa xe này?')) return;
        setActionLoading(prev => ({ ...prev, delete: vehicleId }));
        setError(null);
        try {
            const response = await fetch(`${API_URL}/users/profile/vehicles/${vehicleId}`, {
                method: 'DELETE',
                headers: headers
            });
             const updatedVehicles = await response.json();
             if (!response.ok) {
                 throw new Error(updatedVehicles.message || 'Không thể xóa xe.');
             }
             setVehicles(updatedVehicles);
             // toast.success('Đã xóa xe thành công!');
        } catch (err) {
            console.error("Lỗi xóa xe:", err);
            setError(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, delete: null }));
        }
    };

     // --- Hàm xử lý Đặt làm mặc định ---
    const handleSetDefaultVehicle = async (vehicleId) => {
        setActionLoading(prev => ({ ...prev, setDefault: vehicleId }));
        setError(null);
         try {
             const response = await fetch(`${API_URL}/users/profile/vehicles/${vehicleId}`, {
                 method: 'PUT',
                 headers: headers,
                 body: JSON.stringify({ isDefault: true }) // Chỉ cần gửi isDefault: true
             });
              const updatedVehicles = await response.json();
              if (!response.ok) {
                  throw new Error(updatedVehicles.message || 'Không thể đặt làm mặc định.');
              }
              setVehicles(updatedVehicles);
              // toast.success('Đã đặt xe làm mặc định!');
         } catch (err) {
             console.error("Lỗi đặt mặc định:", err);
             setError(err.message);
         } finally {
             setActionLoading(prev => ({ ...prev, setDefault: null }));
         }
    };


    // --- Render ---
    if (isLoading || isAuthLoading) {
        return <LoadingSpinner message="Đang tải danh sách xe..." fullScreen />;
    }

    return (
        <>
            <Head>
                <title>Quản lý Xe của tôi - ParkWise</title>
            </Head>

             {/* Container Trang */}
             <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">

                    {/* Header Trang */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex items-center justify-between"
                    >
                         <div className="flex items-center gap-3">
                            <Link href="/profile" legacyBehavior>
                                <a className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                                    <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                                </a>
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                                Xe của tôi ({vehicles.length})
                            </h1>
                        </div>
                        <motion.button
                            onClick={handleOpenAddModal}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                        >
                            <FontAwesomeIcon icon={faPlus} /> Thêm xe mới
                        </motion.button>
                    </motion.div>

                     {/* Hiển thị lỗi chung */}
                    <AnimatePresence>
                    {error && (
                        <motion.div
                             key="general-error"
                             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm flex items-center gap-2" role="alert"
                        >
                            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
                             <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900 text-lg">&times;</button>
                        </motion.div>
                    )}
                    </AnimatePresence>


                    {/* Danh sách Xe */}
                    <div className="space-y-4">
                        <AnimatePresence>
                            {vehicles.length > 0 ? (
                                vehicles.map(vehicle => (
                                    <VehicleItem
                                        key={vehicle._id}
                                        vehicle={vehicle}
                                        onEdit={handleOpenEditModal}
                                        onDelete={handleDeleteVehicle}
                                        onSetDefault={handleSetDefaultVehicle}
                                        isDeleting={actionLoading.delete === vehicle._id}
                                        isSettingDefault={actionLoading.setDefault === vehicle._id}
                                    />
                                ))
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                                    <p className="text-gray-500 dark:text-gray-400">Bạn chưa thêm xe nào.</p>
                                    <button onClick={handleOpenAddModal} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                        Thêm xe đầu tiên của bạn
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* Modal Form */}
             <AnimatePresence>
                {isModalOpen && (
                    <VehicleFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        vehicleToEdit={vehicleToEdit}
                        onSave={handleSaveVehicle}
                        isLoading={actionLoading.save}
                    />
                )}
            </AnimatePresence>


            {/* CSS dùng chung */}
             <style jsx global>{`
                 .label-form {
                    @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
                }
                .label-optional {
                    @apply text-xs text-gray-400 dark:text-gray-500 font-normal;
                }
                .input-field {
                    @apply block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-offset-gray-800;
                }
                 .btn-primary {
     @apply bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 shadow-md disabled:opacity-60 disabled:cursor-wait;
 }
 .btn-secondary {
      @apply px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-gray-900 hover:bg-gray-50 dark:hover:bg-gray-600;
 }
             `}</style>
        </>
    );
};

export default withAuth(ManageVehiclesPage); // Bảo vệ trang này