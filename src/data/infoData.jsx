import successImage from "../assets/images/icons/success.png"
import failImage from "../assets/images/icons/no-wifi.png";
import rocketImage from "../assets/images/icons/rocket.png";

const infoData = [
    {
        type: 'connect-failed',
        title: 'Connection Failed!!!',
        desc: 'Please check again your Internet connection',
        titleVn: 'Kết nối thất bại!!!',
        descVN: 'Vui lòng kiểm tra lại kết nối Internet của bạn',
        thumb: failImage
    },
    {
        type: 'upload-success',
        title: 'Success!!!',
        desc: 'Data upload completed! Please wait your confirm Email!!!',
        titleVn: 'Success!!!',
        descVN: 'Dữ liệu cập nhập thành công! Vui lòng chờ Email xác nhận của bạn!!!',
        thumb: successImage
    },
    {
        type: 'update-success',
        title: 'Success!!!',
        desc: 'Password update completed!!!',
        titleVn: 'Success!!!',
        descVN: 'Mật khẩu cập nhập thành công!!!',
        thumb: rocketImage
    },
]

export default infoData;