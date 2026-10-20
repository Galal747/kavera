import Image from "next/image";

type AuthShellProps = {
    children: React.ReactNode;
};

// خلفية صورة ملء الشاشة للّوج إن والساين أب، من غير اسكرول للصفحة
export function AuthShell({ children }: AuthShellProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none px-4 py-6">
            <Image
                src="/login/login-bg.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="select-none object-cover object-[65%_center]"
                draggable={false}
            />
            {/* طبقة غامقة عشان الفورم يتقري على أي صورة */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

            {/* لو الفورم أطول من الشاشة (شاشة صغيرة جداً) بيتسكرول جواه هو بس، مش الصفحة */}
            <div
                className={[
                    "dark relative max-h-full w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl p-6 sm:p-8",
                    // كارت فحمي دافي زي خرسانة المشهد، مع حدّ خفيف بلون الغروب
                    "border border-amber-100/10 bg-[#14110f]/75 text-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl",
                    "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    // تلوين عناصر الفورم نفسها عشان تتقري على الخلفية الغامقة
                    "[&_label]:text-neutral-300",
                    "[&_input]:border-white/15 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-neutral-500",
                    "[&_input]:focus-visible:border-amber-400/70 [&_input]:focus-visible:ring-amber-400/30",
                    "[&_a]:text-amber-300 [&_a:hover]:text-amber-200",
                    "[&_button[type=submit]]:bg-amber-500 [&_button[type=submit]]:text-neutral-950 [&_button[type=submit]:hover]:bg-amber-400",
                ].join(" ")}
            >
                {children}
            </div>
        </div>
    );
}