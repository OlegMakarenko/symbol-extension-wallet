export const Card = (props) => {
    const { children, title, color, onHeaderPress } = props;
    const style = color ? { backgroundColor: color } : null;

    return (
        <div className="bg-card rounded-lg min-h-8 overflow-hidden" style={style}>
            {!!title && (
                <div className="bg-card-transparent w-full p-x-4 p-y-2 flex flex-row items-center" onClick={onHeaderPress}>
                    <p className="s-text-label">{title}</p>
                    <img src="/images/icon-expand.png" className="w-4 h-4 m-l-2" />
                </div>
            )}
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};
