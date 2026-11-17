'use client'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function LoginPage() {
  
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://autrobook.vercel.app'
      }
    })

    if (error) console.error(error)
  }

  return (
    <div style={{textAlign: 'center', marginTop: '100px'}}>
      <h1>Autrobook Login</h1>
      <button 
        onClick={handleGoogleLogin}
        style={{padding: '10px 20px', fontSize: '16px', cursor: 'pointer'}}
      >
        Continue with Google
      </button>
    </div>
  )
}
