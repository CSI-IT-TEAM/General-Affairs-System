import "./ButtonRound.scss";

const ButtonRound = ({title, bgColor, handleClick}) => {
    return (
        <div className="btn-round" style={{backgroundColor: bgColor,}} onClick={handleClick} >
            <div className="btn-round-title">{title}</div>
        </div>
    );
}

export default ButtonRound;