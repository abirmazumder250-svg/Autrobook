export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET' });
  }

  try {
    // TODO: Fetch posts from your Database here
    const dummyPosts = [
      {
        id: "1",
        userId: "123",
        userName: "Abir Mazumder",
        content: "Welcome to Autrobook!",
        imageUrl: null,
        likes: 10,
        comments: [],
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({ 
      success: true, 
      posts: dummyPosts 
    });

  } catch (error) {
    console.error("Posts API Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
