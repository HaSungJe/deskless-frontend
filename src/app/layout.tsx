import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { withBasePath } from '@/shared/utils/base-path';
import { SITE_NAME } from '@/shared/utils/site';
import RootLayoutContent from './RootLayoutContent';
import './css/globals.css';

const notoSansKr = Noto_Sans_KR({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap',
    variable: '--font-noto-sans-kr',
});

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
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
    title: SITE_NAME, // 탭 제목 — 서비스 이름(바로방)
    description: SITE_NAME,
    icons: {
        icon: withBasePath('/favicon.ico'), // 메타데이터 주소에는 Next 가 basePath 를 붙이지 않는다
    },
    openGraph: {
        type: 'website',
        title: SITE_NAME,
        description: SITE_NAME,
        images: [
            {
                url: withBasePath('/og.jpg'),
                width: 512,
                height: 269,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        images: [withBasePath('/og.jpg')],
    },
    other: adsensePublisherId ? { 'google-adsense-account': adsensePublisherId } : undefined,
}

type RootLayoutProps = {
    children: React.ReactNode;
    modal: React.ReactNode; // src/app/@modal — 경로 모달 슬롯
};

export default function RootLayout({ children, modal }: RootLayoutProps): React.ReactNode {
    return (
        // 문서 — 글꼴 변수를 <html> 에 붙인다
        <html lang="ko" className={notoSansKr.variable}>
            <body>
                {/* 로그인 상태 · Provider · 경로 모달 */}
                <RootLayoutContent modal={modal}>
                    {children}
                </RootLayoutContent>
            </body>
        </html>
    )
}
