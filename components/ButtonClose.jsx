import { $t } from '@/localization';

export const ButtonClose = ({ type, className, onClick }) => {
    const textMap = {
        cancel: $t('button_cancel'),
        close: $t('button_close'),
    };
    const text = textMap[type];

    return (
        <div className={`flex flex-row items-center p-2 cursor-pointer uppercase ${className}`} onClick={onClick}>
            {!!text && (
                <div className="font-mono">
                    {text}
                </div>
            )}
            <img src="/images/icon-close.png" className="w-4 h-4" />
        </div>
    );
};
