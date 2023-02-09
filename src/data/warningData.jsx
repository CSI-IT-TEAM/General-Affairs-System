import constructImage from "../assets/images/icons/under-construction.png"
import warningImage from "../assets/images/icons/warning.png";


const warningData = [
    {
        type: 'login-failed',
        title: 'Login Failed!!!',
        desc: 'The User ID entered is incorrect',
        thumb: warningImage
    },
    {
        type: 'under-construct',
        title: 'Warning!!!',
        desc: 'Services is under construction',
        thumb: constructImage
    },
    {
        type: 'upload-failed',
        title: 'Upload Failed!!!',
        desc: 'Please try again later',
        thumb: warningImage
    }
]

export default warningData;