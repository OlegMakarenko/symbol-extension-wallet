import { copyToClipboard, showMessage } from '@/utils/helper';

export const ButtonCopy = ({ content, className }) => {
    const handlePress = (e) => {
		e.stopPropagation();
        try {
            copyToClipboard(content);
            showMessage({ message: content, type: 'info' });
        } catch (error) {
            showMessage({ message: error.message, type: 'danger' });
        }
    };

	return (
		<div className={`w-4 h-4 cursor-pointer ${className}`} onClick={handlePress}>
			<img src="/images/icon-copy.png" className="w-full h-full" alt="Copy" />
		</div>
	);
};
