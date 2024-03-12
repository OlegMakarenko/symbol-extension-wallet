import { AccountSelector } from './AccountSelector';
import { useRouter } from './Router';

export const TitleBar = ({ hasAccountSelector, hasSettingsButton, hasBackButton }) => {
    const router = useRouter();

    return (
        <div className="w-full h-16 bg-navbar flex flex-row justify-between items-center px-4">
            {hasAccountSelector && <AccountSelector />}
            {hasBackButton && (
                <div className="cursor-pointer" onClick={router.goBack}>
                    <img src="/images/icon-back.png" className="w-8 h-8" />
                </div>
            )}
            {hasSettingsButton && (
                <div className="cursor-pointer">
                    <img src="/images/icon-settings.png" className="w-8 h-8" />
                </div>
            )}
        </div>
    );
};
