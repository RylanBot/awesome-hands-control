const Loading: React.FC = () => {
    return (
        <>
            <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center">
                <div className="relative h-56 w-56">
                    <div className="absolute ease-linear rounded-full border-8 border-t-teal-500 h-56 w-56 animate-spin"></div>
                    <div className="absolute inset-0 flex justify-center items-center text-xl font-bold text-white">
                    </div>
                </div>
            </div>
        </>
    )
}

export default Loading;
