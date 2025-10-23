// components/ImageGallery.js (PHIÊN BẢN ĐẲNG CẤP - Sử dụng Swiper)

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode, Autoplay, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import Image from 'next/image'; // Sử dụng Image component của Next.js để tối ưu ảnh

// Import CSS của Swiper (quan trọng!)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

// Placeholder nếu không có ảnh
const PlaceholderImage = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-lg">
        <i className="fas fa-image text-5xl text-gray-400 dark:text-gray-500"></i>
    </div>
);


const ImageGallery = ({ images = [] }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const hasImages = images && images.length > 0;

    // --- Hiệu ứng Framer Motion ---
    const galleryVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } }
    };

    const imageVariants = {
        hover: { scale: 1.05, transition: { duration: 0.3 } }
    };


    if (!hasImages) {
        // Có thể trả về null hoặc một placeholder tinh tế hơn
        return (
            <motion.div
                className="aspect-video w-full rounded-lg overflow-hidden shadow-md" // Tỷ lệ 16:9
                variants={galleryVariants} initial="hidden" animate="visible"
            >
                <PlaceholderImage />
             </motion.div>
        );
    }

    return (
        <motion.div
            className="image-gallery-container relative rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
            variants={galleryVariants} initial="hidden" animate="visible"
        >
            {/* --- Swiper Chính (Ảnh Lớn) --- */}
            <Swiper
                modules={[Navigation, Pagination, Thumbs, Autoplay, EffectFade]}
                spaceBetween={10}
                slidesPerView={1}
                navigation={{ // Nút next/prev "đẳng cấp"
                    nextEl: '.swiper-button-next-custom',
                    prevEl: '.swiper-button-prev-custom',
                }}
                pagination={{ clickable: true, dynamicBullets: true }} // Pagination dạng chấm tròn động
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }} // Kết nối với thumbnails
                loop={images.length > 1} // Loop nếu có nhiều hơn 1 ảnh
                autoplay={{ delay: 5000, disableOnInteraction: false }} // Tự động chuyển ảnh sau 5s
                effect="fade" // Hiệu ứng mờ dần khi chuyển ảnh
                fadeEffect={{ crossFade: true }}
                className="main-swiper aspect-video" // Giữ tỷ lệ 16:9
                style={{ '--swiper-navigation-color': '#fff', '--swiper-pagination-color': '#fff' }} // Màu nút/chấm
            >
                {images.map((imgUrl, index) => (
                    <SwiperSlide key={index}>
                         {/* Sử dụng Next.js Image */}
                        <motion.div className="w-full h-full relative" variants={imageVariants} whileHover="hover">
                             <Image
                                src={imgUrl}
                                alt={`Ảnh bãi xe ${index + 1}`}
                                layout="fill" // Fill toàn bộ slide
                                objectFit="cover" // Cover để giữ tỷ lệ ảnh
                                priority={index === 0} // Ưu tiên load ảnh đầu tiên
                                // Có thể thêm placeholder="blur" và blurDataURL nếu muốn hiệu ứng mờ khi load
                                className="transition-transform duration-300"
                            />
                             {/* Lớp phủ tối nhẹ để làm nổi bật nút */}
                             <div className="absolute inset-0 bg-black/10"></div>
                         </motion.div>
                    </SwiperSlide>
                ))}

                 {/* Nút điều hướng tùy chỉnh "đẳng cấp" */}
                 {images.length > 1 && (
                     <>
                        <div className="swiper-button-prev-custom absolute top-1/2 left-4 z-10 -translate-y-1/2 cursor-pointer bg-black/30 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/50 transition-colors">
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="swiper-button-next-custom absolute top-1/2 right-4 z-10 -translate-y-1/2 cursor-pointer bg-black/30 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/50 transition-colors">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                     </>
                 )}
            </Swiper>

            {/* --- Swiper Thumbnails (Ảnh Nhỏ) --- */}
            {images.length > 1 && (
                <div className="thumbs-swiper-container bg-gray-100 dark:bg-gray-800 p-2">
                    <Swiper
                        modules={[Thumbs, FreeMode, Navigation]}
                        onSwiper={setThumbsSwiper}
                        spaceBetween={8} // Khoảng cách giữa các ảnh nhỏ
                        slidesPerView={'auto'} // Hiển thị vừa đủ, cho phép kéo
                        freeMode={true} // Cho phép kéo thả tự do
                        watchSlidesProgress={true}
                        className="thumbs-swiper max-h-24" // Giới hạn chiều cao
                         navigation={{ // Nút next/prev nhỏ cho thumbnails
                            nextEl: '.swiper-button-next-thumb',
                            prevEl: '.swiper-button-prev-thumb',
                        }}
                    >
                        {images.map((imgUrl, index) => (
                            <SwiperSlide key={index} className="!w-20 !h-16 md:!w-24 md:!h-20 cursor-pointer rounded overflow-hidden">
                                <Image
                                    src={imgUrl}
                                    alt={`Thumbnail ${index + 1}`}
                                    layout="fill"
                                    objectFit="cover"
                                     className="opacity-60 swiper-slide-thumb-inactive:opacity-100 swiper-slide-thumb-inactive:border-2 swiper-slide-thumb-inactive:border-blue-500 transition-opacity duration-200"
                                />
                            </SwiperSlide>
                        ))}
                         {/* Nút điều hướng tùy chỉnh cho Thumbnails */}
                        <div className="swiper-button-prev-thumb absolute top-1/2 left-1 z-10 -translate-y-1/2 cursor-pointer bg-white/50 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-white/80 transition-colors text-xs">
                             <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="swiper-button-next-thumb absolute top-1/2 right-1 z-10 -translate-y-1/2 cursor-pointer bg-white/50 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-white/80 transition-colors text-xs">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </Swiper>
                </div>
            )}
        </motion.div>
    );
};

export default ImageGallery;