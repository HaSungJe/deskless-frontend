import type { NextConfig } from "next";

type RemotePattern = {
    protocol: 'http' | 'https';
    hostname: string;
    port?: string;
    pathname: string;
};

const remotePatterns: Array<RemotePattern> = [
    {
        protocol: "http",
        hostname: "localhost",
        port: process.env.NEXT_IMAGE_PORT ?? "3000",
        pathname: "/**",
    },
    {
        protocol: "https",
        hostname: "s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
    },
];

if (process.env.NEXT_IMAGE_HOSTNAME) {
    remotePatterns.push({
        protocol: "http",
        hostname: process.env.NEXT_IMAGE_HOSTNAME,
        port: process.env.NEXT_IMAGE_PORT ?? "3000",
        pathname: "/**",
    });
}

const nextConfig: NextConfig = {
    output: "standalone", // Docker 운영 이미지용 (.next/standalone 에 실행에 필요한 파일만 모은다)
    reactStrictMode: true,
    trailingSlash: true,
    reactCompiler: true,
    images: {
        remotePatterns,
    },
    basePath: process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX,
    async rewrites() {
        if (process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX) {
            return [
                {
                    source: `${process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX}/:path*`,
                    destination: `/:path*`
                },
            ]
        }

        return [];
    }
};

export default nextConfig;
