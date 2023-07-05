const removeVietnamese = (str, c = "-") => {
  try {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");

    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
  } catch {
    return str;
  }
};

const removeNewLine = (str, c = ", ") => {
  try {
    str = str.replace(/\n|\r/g, c);

    str = str.replace(`/${c}+${c}/g`, c);
    str = str.replace(`/^${c}+|${c}+$/g`, "");

    return str;
  } catch {
    return str;
  }
};

const formatPassengerList = (data) => {
  try {
    const _list = data.map((item) => {
      return removeVietnamese(removeNewLine(item.name));
    });

    let _result = "";
    for (let iCount = 0; iCount < _list.length; iCount++) {
      if (iCount === _list.length - 1) {
        _result += _list[iCount];
      } else {
        _result += _list[iCount] + "@";
      }
    }
    return _result;
  } catch {
    return data;
  }
};

const getMainPassenger = (data) => {
  const _list = data.map((item) => {
    return removeVietnamese(removeNewLine(item.name));
  });

  let _result = "";
  for (let iCount = 0; iCount < _list.length; iCount++) {
    if (iCount === 0) {
      _result = _list[iCount];
      break;
    }
  }
  return _result;
};

const formatPassengerDropOffList = (data) => {
  const _list = data.map((item) => {
    return removeVietnamese(removeNewLine(item.dropOff));
  });

  let _result = "";
  for (let iCount = 0; iCount < _list.length; iCount++) {
    if (iCount === _list.length - 1) {
      _result += _list[iCount];
    } else {
      _result += _list[iCount] + "@";
    }
  }
  return _result;
};

export {
  removeVietnamese,
  removeNewLine,
  formatPassengerList,
  getMainPassenger,
  formatPassengerDropOffList,
};
