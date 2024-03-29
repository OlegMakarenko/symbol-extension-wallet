import { Progress } from '@nextui-org/react';
import { LoadingIndicator } from './LoadingIndicator';

export const Screen = ({ children, titleBar, isLoading, isRefreshing, bottomComponent }) => {
    return (
        <div className="h-full w-full animation-fade-in flex flex-col bg-screen">
            {isLoading && (
                <div className="h-full w-full animation-fade-in flex justify-center items-center">
                    <LoadingIndicator />
                </div>
            )}
            {!isLoading && (
                <>
                    {titleBar}
                    <Progress
                        size="sm"
                        isIndeterminate
                        aria-label="Loading..."
                        className="w-full"
                        style={{ opacity: isRefreshing ? 1 : 0}}
                    />
                    <div className="p-4 flex flex-col flex-1 max-w-screen-sm w-full mx-auto overflow-y-auto">
                        {children}
                    </div>
                    <div className="p-4 flex-0 max-w-screen-sm w-full mx-auto overflow-y-hidden">
                        {bottomComponent}
                    </div>
                </>
            )}
        </div>
    );
};
