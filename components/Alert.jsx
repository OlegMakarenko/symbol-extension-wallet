export const Alert = (props) => {
    const { type, title, body, className } = props;

    const typeAlertMap = {
        warning: {
            icon: '/images/icon-warning-alert.png',
            className: 'text-warning',
        },
        danger: {
            icon: '/images/icon-danger-alert.png',
            className: 'text-danger',
        },
    };

    const alert = typeAlertMap[type];

    return (
        <div className={`flex flex-col items-center min-h-32 p-4 bg-main rounded-xl ${alert.className} ${className}`}>
            <img className="w-8 h-8" src={alert.icon} />
            <h3 className="text-center">
                {title}
            </h3>
            <p className="text-center">
                {body}
            </p>
        </div>
    );
};
