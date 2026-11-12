export const metadata = {
  title: "Autrobook",
  description: "Your website description",
  verification: {
    google: "SLKwmSY4xlUNvJvyx87wSLqgwzUOKTKKKGid-I_rpYs",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
