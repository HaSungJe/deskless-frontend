import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { connection } from 'next/server';
import { withBasePath } from '@/shared/utils/base-path';
import { getPublicEnv, publicEnvValues } from '@/shared/utils/public-env';
import { SITE_NAME } from '@/shared/utils/site';
import RootLayoutContent from './RootLayoutContent';
import './css/globals.css';

const notoSansKr = Noto_Sans_KR({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap',
    variable: '--font-noto-sans-kr',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
}

/**
 * 메타데이터 — 요청 때(공개 값 NEXT_PUBLIC_SERVER_URL · 애드센스 ID 를 실행 값으로 — 정적 metadata 는 빌드 때 굳는다)
 *
 * @returns
 */
export async function generateMetadata(): Promise<Metadata> {
    await connection();
    const serverUrl = getPublicEnv('NEXT_PUBLIC_SERVER_URL');                     // metadataBase · OG
    const adsensePublisherId = getPublicEnv('NEXT_PUBLIC_ADSENSE_PUBLISHER_ID'); // 애드센스 계정

    return {
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
    };
}

type RootLayoutProps = {
    children: React.ReactNode;
    modal: React.ReactNode; // src/app/@modal — 경로 모달 슬롯
};

/**
 * 루트 layout — 요청 때 그린다(공개 값을 빌드 값으로 굳히지 않게 `connection()`) · 공개 값을 브라우저로 넘긴다(허용 목록 — publicEnvValues)
 *
 * @param param0
 * @returns
 */
export default async function RootLayout({ children, modal }: RootLayoutProps): Promise<React.ReactNode> {
    await connection();

    return (
        // 문서 — 글꼴 변수를 <html> 에 붙인다
        <html lang="ko" className={notoSansKr.variable}>
            <body>
                {/* 로그인 상태 · Provider · 경로 모달 */}
                <RootLayoutContent modal={modal} publicEnv={publicEnvValues()}>
                    {children}
                </RootLayoutContent>
            </body>
        </html>
    )
}
