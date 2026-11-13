export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST' });
  }

  try {
    const { userId, userName, content, imageUrl } = req.body;

    // Validate required fields
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    // Create a new post object. Right now it's just a dummy
    const newPost = {
      id: Date.now().toString(),
      userId: userId,
      userName: userName || "Anonymous",
      content: content,
      imageUrl: imageUrl || null,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString()
    };

    console.log("New Post Created:", newPost);

    // TODO: Connect this to Firebase, MongoDB, or Supabase to save the post
    
    return res.status(200).json({ 
      success: true, 
      message: "Post created successfully",
      post: newPost 
    });

  } catch (error) {
    console.error("Post API Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
