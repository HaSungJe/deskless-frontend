'use client';
// GA 사용 시: npm i @next/third-parties 후 아래 import 주석 해제
// import { GoogleAnalytics } from "@next/third-parties/google";
// import Script from "next/script";
// import { getPublicEnv } from '@/shared/utils/public-env'; // 공개 값은 실행 때 읽는다 — 정적 참조로 쓰지 않는다(빌드 값으로 박힌다)

export default function Scripts(): React.ReactNode {
    return (
        <>
            {/* Google Analytics */}
            {/* <GoogleAnalytics gaId={getPublicEnv('NEXT_PUBLIC_GA4_ID') ?? ''} /> */}

            {/* 구글 애드센스 */}
            {/* {process.env.NODE_ENV === 'production' && (
                <Script
                    async
                    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${getPublicEnv('NEXT_PUBLIC_ADSENSE_PUBLISHER_ID') ?? ''}`}
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
            )} */}
        </>
    );
}