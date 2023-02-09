const getDevice = () => {
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        return true; 
        //"mobile";
    }else{
       return false; 
       //"not mobile";
    }
}

export default getDevice;