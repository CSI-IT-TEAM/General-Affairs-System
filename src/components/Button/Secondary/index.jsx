import "./ButtonSecondary.scss";

const ButtonSecondary = ({title}) => {
    return (
        <div className="btn-secondary">
            <div className="btn-secondary-title">{title}</div>
        </div>
    );
}

export default ButtonSecondary;