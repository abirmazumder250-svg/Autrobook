import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function CommentSection({ postId, currentUser }) {
  const [textComments, setTextComments] = useState([])
  const [voiceComments, setVoiceComments] = useState([])
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(0)

  const loadComments = async () => {
    const { data: textData } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    const { data: voiceData } = await supabase
      .from('voice_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    setTextComments(textData || [])
    setVoiceComments(voiceData || [])
  }

  useEffect(() => {
    if (postId) loadComments()
  }, [postId])

  const sendTextComment = async () => {
    if (!text.trim() || !currentUser) return
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUser.id,
      content: text.trim()
    })
    if (!error) {
      setText('')
      loadComments()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      startTimeRef.current = Date.now()

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
        const fileName = `${postId}/${Date.now()}.webm`

        const { error: uploadError } = await supabase.storage
          .from('voices')
          .upload(fileName, blob)

        if (uploadError) {
          console.error(uploadError)
          return
        }

        const { data } = supabase.storage
          .from('voices')
          .getPublicUrl(fileName)

        await supabase.from('voice_comments').insert({
          post_id: postId,
          user_id: currentUser.id,
          audio_url: data.publicUrl,
          duration_seconds: duration
        })

        loadComments()
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone permission denied', err)
      alert('Please allow microphone permission')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div>
        {textComments.map((c) => (
          <div key={`text-${c.id}`} style={{ padding: '6px 0', display: 'flex', gap: 8 }}>
            <strong>{c.profiles?.full_name || 'User'}:</strong>
            <span>{c.content}</span>
          </div>
        ))}
        {voiceComments.map((v) => (
          <div key={`voice-${v.id}`} style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>{v.profiles?.full_name || 'User'}:</strong>
            <audio controls src={v.audio_url} style={{ height: 32, width: 200 }} />
            <span>{v.duration_seconds}s</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />
        {isRecording ? (
          <button onClick={stopRecording} style={{ background: 'red', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>
            Stop
          </button>
        ) : (
          <button onClick={startRecording} style={{ padding: '8px 12px', borderRadius: 8 }}>
            🎤
          </button>
        )}
        <button onClick={sendTextComment} style={{ padding: '8px 14px', borderRadius: 8, background: '#1877f2', color: 'white', border: 'none' }}>
          Send
        </button>
      </div>
      {isRecording && <p style={{ color: 'red' }}>Recording... Speak now</p>}
    </div>
  )
          }
