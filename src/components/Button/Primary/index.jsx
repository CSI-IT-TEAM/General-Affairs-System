import "./ButtonPrimary.scss";

const ButtonPrimary = ({ title, handleClick }) => {
    return (
        <div className="btn-primary" onClick={handleClick}>
            <div className="btn-primary-bg" />
            <div className="btn-primary-title">{title}</div>
        </div>
    );
}

export default ButtonPrimary;