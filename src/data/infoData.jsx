import successImage from "../assets/images/icons/success.png"
import failImage from "../assets/images/icons/no-wifi.png";

const infoData = [
    {
        type: 'connect-failed',
        title: 'Connection Failed!!!',
        desc: 'Please check again your Internet connection',
        thumb: failImage
    },
    {
        type: 'upload-success',
        title: 'Success!!!',
        desc: 'Data upload completed! Please wait your confirm Email!!!',
        thumb: successImage
    },
]

export default infoData;