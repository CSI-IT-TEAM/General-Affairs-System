import { useTranslation } from "react-i18next";
// Ảnh icon - đang sử dụng
import carImage from "../assets/images/icons/car.png";
import hospitalImage from "../assets/images/icons/hospital.png";
import planeImage from "../assets/images/icons/plane.png";
import pickleballImage from "../assets/images/icons/pickleball.png";

// Ảnh banner - comment lại để dễ thay đổi trở lại
// import carBanner from "../assets/images/banners/request_car.png";
// import medicalBanner from "../assets/images/banners/medical_fee.png";
// import flightBanner from "../assets/images/banners/flight_ticket.png";
// import pickleballBanner from "../assets/images/banners/pickleball.png";
const optionData = [
    {
        id: '001',
        title: 'Request Vehicle',
        thumb: carImage, // Ảnh icon - đang sử dụng
        // thumb: carBanner, // Ảnh banner - comment lại
        desc: 'Choose from a variety of vehicles to take you from A to B safely',
        desc_color: "#000000",
        bgColor: '#00c0c0',
        link: '',
        btn_order_text: "order",
    },
    {
        id: '002',
        title: 'Medical Fee',
        thumb: hospitalImage, // Ảnh icon - đang sử dụng
        // thumb: medicalBanner, // Ảnh banner - comment lại
        desc: '의료비 등록은 매월 27에 마감합니다.',
        desc_color: "#ff0000",
        bgColor: '#e04f5f',
        link: '',
        btn_order_text: "medical_order",
    },
    {
        id: '003',
        title: 'Flight Ticket',
        thumb: planeImage, // Ảnh icon - đang sử dụng
        // thumb: flightBanner, // Ảnh banner - comment lại
        desc: 'Book and manage flights for employees and their family members',
        desc_color: "#000000",
        bgColor: '#6abfff',
        link: '',
        btn_order_text: "order",
    },
    {
        id: '004',
        title: 'Pickle Ball Booking',
        thumb: pickleballImage, // Ảnh icon - đang sử dụng
        // thumb: pickleballBanner, // Ảnh banner - comment lại
        desc: 'Đặt lịch chơi Pickleball tại các sân thể thao',
        desc_color: "#000000",
        bgColor: '#4ade80',
        link: '',
        btn_order_text: "order",
    }
]

export default optionData;