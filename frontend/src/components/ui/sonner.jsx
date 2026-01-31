import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
    return (
        <Sonner
            theme="dark"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-[#1a1b26] group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg group-[.toaster]:shadow-purple-900/20 group-[.toaster]:rounded-xl group-[.toaster]:p-4",
                    description: "group-[.toast]:text-gray-400",
                    actionButton:
                        "group-[.toast]:bg-purple-600 group-[.toast]:text-white",
                    cancelButton:
                        "group-[.toast]:bg-gray-800 group-[.toast]:text-gray-400",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
