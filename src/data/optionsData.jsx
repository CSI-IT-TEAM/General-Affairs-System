import { useTranslation } from "react-i18next";
import carImage from "../assets/images/icons/car.png";
import hospitalImage from "../assets/images/icons/hospital.png";
import planeImage from "../assets/images/icons/plane.png";
const optionData = [
    {
        id: '001',
        title: 'Request Vehicle',
        thumb: carImage,
        desc: 'Choose from a variety of vehicles to take you from A to B safely',
        desc_color: "#000000",
        bgColor: '#00c0c0',
        link: '',
        btn_order_text: "order",
    },
    {
        id: '002',
        title: 'Medical Fee',
        thumb: hospitalImage,
        desc: '의료비 등록은 매월 27에 마감합니다.',
        desc_color: "#ff0000",
        bgColor: '#e04f5f',
        link: '',
        btn_order_text: "medical_order",
    },
    {
        id: '003',
        title: 'Flight Ticket',
        thumb: planeImage,
        desc: 'Book and manage flights for employees and their family members',
        desc_color: "#000000",
        bgColor: '#6abfff',
        link: '',
        btn_order_text: "order",
    }
]

export default optionData;