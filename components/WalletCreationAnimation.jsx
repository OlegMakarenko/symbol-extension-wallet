import { useEffect, useState } from 'react';

export const WalletCreationAnimation = ({ steps, currentStep }) => {
    const [timer, setTimer] = useState(null);
    const [index, setIndex] = useState(0);

    const currentStepText = steps[currentStep - 1];
    const currentLine = currentStepText.slice(0, index);
    const typedLines = steps.slice(0, currentStep - 1);

    useEffect(() => {
        const textLength = currentStepText.length;
        const duration = 10;
        setIndex(0);
        clearInterval(timer);

        const newTimer = setInterval(() => {
            setIndex((index) => (index < textLength ? index + 1 : index));
        }, duration);
        setTimer(newTimer);
    }, [currentStep]);

    return (
        <div className="w-full h-full flex flex-col justify-around items-center gap-4 p-2 bg-black">
            <img src="/images/logo-symbol-ascii-small.png" className="w-full m-auto object-contain" />
            <div className="w-full min-h-30">
                {typedLines.map((line, index) => (
                    <div className="w-full" key={'la' + index}>
                        <span className="font-mono text-primary">Symbol Wallet: </span>
                        <span className="font-mono">{line}</span>
                    </div>
                ))}
                <div className="w-full">
                    <span className="font-mono text-primary">Symbol Wallet: </span>
                    <span className="font-mono">{currentLine}</span>
                </div>
            </div>
        </div>
    );
};

// const styles = StyleSheet.create({
//     root: {
//         width: '100%',
//         height: '100%',
//         flexDirection: 'column',
//         justifyContent: 'space-around',
//         alignItems: 'center',
//         backgroundColor: colors.bgForm,
//         padding: spacings.padding,
//     },
// });
