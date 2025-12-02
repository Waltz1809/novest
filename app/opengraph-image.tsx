import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export const alt = 'Novest - LightNovel, WebNovel và hơn nữa';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0B0C10',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #34D399 2%, transparent 0%), radial-gradient(circle at 75px 75px, #34D399 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                }}
            >
                {/* Logo/Icon */}
                <div
                    style={{
                        display: 'flex',
                        backgroundColor: '#F59E0B',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        boxShadow: '0 0 60px rgba(245, 158, 11, 0.5)',
                    }}
                >
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0B0C10"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: 80,
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '20px',
                        textShadow: '0 0 40px rgba(245, 158, 11, 0.8)',
                    }}
                >
                    Novest
                </div>

                {/* Tagline */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: 36,
                        color: '#9CA3AF',
                        textAlign: 'center',
                        maxWidth: '900px',
                        lineHeight: 1.4,
                    }}
                >
                    LightNovel, WebNovel và hơn nữa
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: 24,
                        color: '#34D399',
                        marginTop: '32px',
                    }}
                >
                    Nền tảng đọc truyện chữ online hàng đầu Việt Nam
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
