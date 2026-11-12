export const metadata = {
  title: "Autrobook",
  description: "Your website description",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="SLKwmSY4xlUNvJvyx87wSLqgwzUOKTKKKGid-I_rpYs" />
      </head>
      <body>{children}</body>
    </html>
  )
}
