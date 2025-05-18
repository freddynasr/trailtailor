/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "uploadthing.com",
      "utfs.io",
      "img.clerk.com",
      "subdomain",
      "files.stripe.com",
    ],
  },
  async redirects() {
    return [
      // {
      //   source: "/agency/:id",
      //   has: [
      //     {
      //       type: "header",
      //       key: "referer",
      //       value: "^(?!.*(sign-up|sign-in)).*$", // Regex to exclude sign-up and sign-in pages
      //     },
      //   ],
      //   destination: "/agency/:id/all-projects",
      //   permanent: false,
      // },
      {
        source: "/project/:id",
        destination: "/project/:id/websites",
        permanent: false,
      },
    ];
  },

  reactStrictMode: false,
};

export default nextConfig;
