import { ImageResponse } from '@vercel/og';
import { db } from '@/lib/db';

export const runtime = 'edge';

export const alt = 'Novel Detail';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

interface Props {
    params: Promise<{ slug: string }>;
}

/**
 * Fetch external image and convert to base64 data URL
 * Required for Edge runtime to display external images
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'image/*',
            },
        });

        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Failed to fetch image:', error);
        return null;
    }
}

export default async function Image({ params }: Props) {
    const { slug } = await params;

    // Fetch novel data
    const novel = await db.novel.findUnique({
        where: { slug },
        select: {
            title: true,
            author: true,
            status: true,
            coverImage: true,
            viewCount: true,
        },
    });

    if (!novel) {
        // Return default fallback image
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0B0C10',
                    }}
                >
                    <div style={{ display: 'flex', fontSize: 60, color: 'white' }}>
                        Novel Not Found
                    </div>
                </div>
            ),
            { ...size }
        );
    }

    // Fetch cover image as base64 (required for Edge runtime)
    let coverImageDataUrl: string | null = null;
    if (novel.coverImage && novel.coverImage.startsWith('http')) {
        coverImageDataUrl = await fetchImageAsDataUrl(novel.coverImage);
    }

    // Format view count
    const formatViews = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    backgroundColor: '#0B0C10',
                    backgroundImage: coverImageDataUrl
                        ? `linear-gradient(rgba(11, 12, 16, 0.85), rgba(11, 12, 16, 0.95))`
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Main Content */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        padding: '60px 80px',
                        gap: '60px',
                    }}
                >
                    {/* Left: Cover Image */}
                    <div
                        style={{
                            display: 'flex',
                            width: '360px',
                            height: '510px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '4px solid rgba(52, 211, 153, 0.4)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(52, 211, 153, 0.3)',
                            backgroundColor: '#1E293B',
                            flexShrink: 0,
                        }}
                    >
                        {coverImageDataUrl ? (
                            <img
                                src={coverImageDataUrl}
                                alt={novel.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                                    color: '#0B0C10',
                                    fontSize: '120px',
                                }}
                            >
                                📖
                            </div>
                        )}
                    </div>

                    {/* Right: Novel Info */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            flex: 1,
                            gap: '24px',
                        }}
                    >
                        {/* Title */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 64,
                                fontWeight: 'bold',
                                color: 'white',
                                lineHeight: 1.2,
                                textShadow: '0 0 40px rgba(245, 158, 11, 0.6)',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {novel.title}
                        </div>

                        {/* Author */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                color: '#D1D5DB',
                                gap: '12px',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ color: '#9CA3AF' }}>Tác giả:</span>
                            <span>{novel.author}</span>
                        </div>

                        {/* Stats Row */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '32px',
                                marginTop: '16px',
                            }}
                        >
                            {/* Status Badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    padding: '12px 24px',
                                    borderRadius: '9999px',
                                    backgroundColor: novel.status === 'ONGOING'
                                        ? 'rgba(16, 185, 129, 0.2)'
                                        : 'rgba(245, 158, 11, 0.2)',
                                    border: novel.status === 'ONGOING'
                                        ? '3px solid #10B981'
                                        : '3px solid #F59E0B',
                                    color: novel.status === 'ONGOING'
                                        ? '#34D399'
                                        : '#FBBF24',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                }}
                            >
                                {novel.status === 'ONGOING' ? 'Đang tiến hành' : 'Hoàn thành'}
                            </div>

                            {/* Views */}
                            <div
                                style={{
                                    display: 'flex',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                                    border: '2px solid rgba(52, 211, 153, 0.3)',
                                    color: '#34D399',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <span>👁️</span>
                                <span>{formatViews(novel.viewCount)}</span>
                            </div>
                        </div>

                        {/* Branding */}
                        <div
                            style={{
                                display: 'flex',
                                marginTop: 'auto',
                                alignItems: 'center',
                                gap: '16px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    backgroundColor: '#F59E0B',
                                    borderRadius: '12px',
                                    padding: '12px',
                                }}
                            >
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#0B0C10"
                                    strokeWidth="2"
                                >
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: 36,
                                    fontWeight: 'bold',
                                    color: 'white',
                                }}
                            >
                                Novest
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
