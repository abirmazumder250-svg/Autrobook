import CommentSection from './CommentSection'

export default function PostCard({ post, currentUser }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginBottom: 16, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={post.profiles?.avatar_url || 'https://via.placeholder.com/40'}
          alt="avatar"
          style={{ width: 40, height: 40, borderRadius: '50%' }}
        />
        <strong>{post.profiles?.full_name || 'User'}</strong>
      </div>
      <p style={{ marginTop: 12 }}>{post.content}</p>
      {post.image_url && (
        <img src={post.image_url} alt="post" style={{ width: '100%', borderRadius: 10, marginTop: 10 }} />
      )}
      <hr style={{ margin: '16px 0' }} />
      <CommentSection postId={post.id} currentUser={currentUser} />
    </div>
  )
}
