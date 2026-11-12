import type { Metadata, Viewport } from 'next';
import RootLayoutContent from './RootLayoutContent';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
const serverName = process.env.NEXT_PUBLIC_SERVER_NAME;
const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export const metadata: Metadata = {
    metadataBase: serverUrl ? new URL(serverUrl) : undefined,
    title: serverName,
    description: serverName,
    icons: {
        icon: '/favicon.ico',
    },
    openGraph: {
        type: 'website',
        title: serverName,
        description: serverName,
        images: [
            {
                url: '/og.jpg',
                width: 512,
                height: 269,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        images: ['/og.jpg'],
    },
    other: adsensePublisherId ? { 'google-adsense-account': adsensePublisherId } : undefined,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <RootLayoutContent>
                    {children}
                </RootLayoutContent>
            </body>
        </html>
    )
}
