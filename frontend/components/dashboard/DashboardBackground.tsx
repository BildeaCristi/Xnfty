"use client";

export default function DashboardBackground() {
    return (
        <div
            className="fixed inset-0 w-full h-full z-[-1]"
            style={{
                background: `
          linear-gradient(135deg, #070715 0%, #0a0a20 25%, #0f0f35 50%, #0a0a20 75%, #070715 100%),
          radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(255, 0, 255, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(0, 255, 143, 0.03) 0%, transparent 60%)
        `,
                backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%'
            }}
        >
            <div className="absolute inset-0 opacity-10">
                {/* Grid pattern overlay */}
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Static decorative dots */}
            <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full opacity-40"></div>
            <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full opacity-30"></div>
            <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-green-400 rounded-full opacity-35"></div>
            <div className="absolute bottom-20 right-20 w-1 h-1 bg-pink-400 rounded-full opacity-40"></div>
            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-blue-400 rounded-full opacity-25"></div>
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-30"></div>
        </div>
    );
} 