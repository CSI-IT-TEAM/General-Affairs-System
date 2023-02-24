import "./ButtonPrimary.scss";

const ButtonPrimary = ({ title, handleClick, type="" }) => {
    return (
        <div className="btn-primary" onClick={handleClick} type={type}>
            <div className="btn-primary-bg" />
            <div className="btn-primary-title">{title}</div>
        </div>
    );
}

export default ButtonPrimary;