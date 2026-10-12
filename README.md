This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin workspace

Set the server-only `BACKEND_API_URL` variable in the frontend's ignored `.env.local` file to the LostNFind backend origin (for example, `BACKEND_API_URL=http://localhost:4000`). The admin workspace proxies requests through Next.js and keeps the backend JWT in an HttpOnly cookie; do not expose the URL as a `NEXT_PUBLIC_` variable.

Found-item reports and claims are sent as multipart requests through a same-origin Next.js API route to the backend. Images are optional, limited to JPG, PNG, or WEBP and 8 MB, and stored by the backend in Neon Object Storage. Configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, and `STORAGE_BUCKET` on the backend; set its `APP_URL` to the public backend origin so saved image links resolve. New reports remain pending until admin review.

Provision the admin from `D:\found-lost-backend` using the existing PowerShell command below after receiving the credentials. `SEED_ADMIN_PASSWORD` must be at least eight characters. This existing seed also upserts its sample items and claims, and updates the password if the configured admin email already exists.

```powershell
Set-Location 'D:\found-lost-backend'
$env:SEED_ADMIN_EMAIL = Read-Host 'Admin email'
$secret = Read-Host 'Admin password' -AsSecureString
$env:SEED_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
try { npm run db:seed } finally {
  Remove-Item Env:SEED_ADMIN_EMAIL, Env:SEED_ADMIN_PASSWORD
  Remove-Variable secret
}
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
