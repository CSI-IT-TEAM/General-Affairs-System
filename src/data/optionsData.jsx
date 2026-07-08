import { useTranslation } from "react-i18next";
// Ảnh icon - đang sử dụng
import carImage from "../assets/images/icons/car.png";
import hospitalImage from "../assets/images/icons/hospital.png";
import planeImage from "../assets/images/icons/plane.png";
import pickleballImage from "../assets/images/icons/pickleball.png";

// Ảnh banner - comment lại để dễ thay đổi trở lại
import carBanner from "../assets/images/banners/request_car.png";
import medicalBanner from "../assets/images/banners/medical_fee.png";
import flightBanner from "../assets/images/banners/flight_ticket.png";
import pickleballBanner from "../assets/images/banners/pickleball.png";
import meetingRoomBanner from "../assets/images/banners/meeting-room.png";
import temporaryResidenceBanner from "../assets/images/banners/temporary_residence.png";
import canteenRegistrationBanner from "../assets/images/banners/Canteen.png"
import businessTripBanner from "../assets/images/banners/business_trip.png"
const optionData = [
    {
        id: '001',
        title: 'Request Vehicle',
        thumb: carBanner, // Ảnh icon - đang sử dụng
        // thumb: carBanner, // Ảnh banner - comment lại
        desc: 'Choose from a variety of vehicles to take you from A to B safely',
        desc_color: "#000000",
        bgColor: '#00c0c0',
        link: '',
        btn_order_text: "order",
        sort_order: 1,
    },
    {
        id: '002',
        title: 'Medical Fee',
        thumb: medicalBanner, // Ảnh icon - đang sử dụng
        // thumb: medicalBanner, // Ảnh banner - comment lại
        desc: '의료비 등록은 매월 27에 마감합니다.',
        desc_color: "#ff0000",
        bgColor: '#e04f5f',
        link: '',
        btn_order_text: "medical_order",
        sort_order: 2,
        visible: true,
    },
    {
        id: '003',
        title: 'Flight Ticket',
        thumb: flightBanner, // Ảnh icon - đang sử dụng
        // thumb: flightBanner, // Ảnh banner - comment lại
        desc: 'Book and manage flights for employees and their family members',
        desc_color: "#000000",
        bgColor: '#6abfff',
        link: '',
        btn_order_text: "order",
        sort_order: 5,
        visible: false,
    },
    {
        id: '005',
        title: 'Meeting Room Booking',
        thumb: meetingRoomBanner, // Ảnh icon - đang sử dụng
        // thumb: pickleballBanner, // Ảnh banner - comment lại
        desc: 'Đặt lịch họp tại các phòng họp',
        desc_color: "#000000",
        bgColor: '#f97316',
        link: '',
        btn_order_text: "Booking Now",
        sort_order: 3,
        visible: true,
    },
    // {
    //     id: '004',
    //     title: 'Pickle Ball Booking',
    //     thumb: pickleballBanner, // Ảnh icon - đang sử dụng
    //     // thumb: pickleballBanner, // Ảnh banner - comment lại
    //     desc: 'Đặt lịch chơi Pickleball tại các sân thể thao',
    //     desc_color: "#000000",
    //     bgColor: '#4ade80',
    //     link: '',
    //     btn_order_text: "Booking Now",
    //     sort_order: 4,
    //     visible: true,
    // },
    {
        id: '006',
        title: 'Temporary Residence Registration',
        thumb: temporaryResidenceBanner, // Ảnh icon - đang sử dụng
        // thumb: temporaryResidenceBanner, // Ảnh banner - comment lại
        desc: '베트남 출입국 관리소 임시 거주 신고',
        desc_color: "#000000",
        bgColor: '#8b5cf6',
        link: '',
        btn_order_text: "register_now",
        sort_order: 6,
        visible: true,
    },
    {
        id: '007',
        title: 'Canteen Attendance Registration',
        thumb: canteenRegistrationBanner, // Ảnh icon - đang sử dụng
        // thumb: canteenAttendanceBanner, // Ảnh banner - comment lại
        desc: 'Register for canteen attendance',
        desc_color: "#000000",
        bgColor: '#fc00d2',
        link: '/canteen-attendance',
        btn_order_text: "register_now",
        sort_order: 7,
        visible: true,
    },
    {
        id: '008',
        title: 'Business Trip Registration',
        thumb: businessTripBanner, // Ảnh icon - đang sử dụng
        // thumb: businessTripBanner, // Ảnh banner - comment lại
        desc: 'Register for business trips',
        desc_color: "#000000",
        bgColor: '#fc00d2',
        link: '/business-trip',
        btn_order_text: "register_now",
        sort_order: 8,
        visible: true,
    }
]

export default optionData;