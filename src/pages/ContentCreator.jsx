import { useState, useEffect } from 'react';
import { Plus, Camera, Video, TrendingUp, Instagram, Clock, CheckCircle, Edit2, Trash2, X, Sparkles, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Gen-Z style encouraging messages
const encourageMessages = [
  "Content creator vibes on point! 📸✨",
  "Main character energy in every post! 💅",
  "Your content is literally fire rn! 🔥",
  "The algorithm is eating this up bestie! 📈",
  "No cap, your posts are bussin! 🚀",
  "Slay queen/king of content! 👑",
  "This content hit different fr fr! 💖",
  "Era content kamu lagi peak banget! 😌",
  "Living rent-free in everyone's feed! 🎯",
  "CEO of viral content tbh! 🏆"
];

const getRandomEncourage = () => {
  return encourageMessages[Math.floor(Math.random() * encourageMessages.length)];
};

const contentTypes = [
  { id: 'reel', label: 'Reels/Video Pendek', icon: Video, color: 'pink' },
  { id: 'photo', label: 'Photo Post', icon: Camera, color: 'blue' },
  { id: 'story', label: 'Stories', icon: Instagram, color: 'purple' },
  { id: 'carousel', label: 'Carousel', icon: Camera, color: 'green' },
];

export default function ContentCreator({ user }) {
  const [creators, setCreators] = useState([]);
  const [posts, setPosts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showEditCreator, setShowEditCreator] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [editingCreator, setEditingCreator] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [encourageMsg, setEncourageMsg] = useState(getRandomEncourage());
  const [activeTab, setActiveTab] = useState('leaderboard');
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [creatorsRes, staffRes, postsRes] = await Promise.all([
        fetch('/api/contentcreator/creators', { headers }),
        fetch('/api/staff', { headers }),
        fetch('/api/contentcreator/posts', { headers })
      ]);

      const creatorsData = creatorsRes.ok ? await creatorsRes.json() : [];
      const staffData = staffRes.ok ? await staffRes.json() : [];
      const postsData = postsRes.ok ? await postsRes.json() : [];

      setCreators(Array.isArray(creatorsData) ? creatorsData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreator = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const staffId = formData.get('staff_id');
    const targetPosts = formData.get('monthly_target_posts');
    const platforms = formData.get('platforms');
    
    if (!staffId) {
      alert('Pilih staff terlebih dahulu!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contentcreator/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          staff_id: parseInt(staffId),
          monthly_target_posts: parseInt(targetPosts) || 30,
          platforms: platforms || 'Instagram'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddCreator(false);
        setEncourageMsg(getRandomEncourage());
        fetchData();
        alert('Creator berhasil ditambahkan! 🎉');
      } else {
        alert('Gagal menambahkan creator: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding creator:', error);
      alert('Gagal menambahkan creator: ' + error.message);
    }
  };

  const handleEditCreator = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contentcreator/creators/${editingCreator.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          monthly_target_posts: parseInt(formData.get('monthly_target_posts')),
          platforms: formData.get('platforms')
        })
      });

      if (response.ok) {
        setShowEditCreator(false);
        setEditingCreator(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error editing creator:', error);
    }
  };

  const handleDeleteCreator = async (id) => {
    if (!confirm('Fr fr mau hapus creator ini? Semua post history juga bakal ilang! 🙈')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/contentcreator/creators/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting creator:', error);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Get creator_id: from selectedCreator, form dropdown, or auto-detected from logged-in user
    let creatorId = selectedCreator?.id || formData.get('creator_id');
    
    // If not admin, auto-detect creator based on logged-in user
    if (!creatorId && !isAdmin && user?.name) {
      const myCreator = creators.find(c => 
        c.name?.toLowerCase() === user.name?.toLowerCase()
      );
      creatorId = myCreator?.id;
    }
    
    if (!creatorId) {
      alert('Creator tidak ditemukan untuk akun kamu!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contentcreator/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          creator_id: creatorId,
          date: formData.get('date'),
          content_type: formData.get('content_type'),
          platform: formData.get('platform'),
          title: formData.get('title'),
          url: formData.get('url'),
          views: parseInt(formData.get('views') || 0),
          likes: parseInt(formData.get('likes') || 0),
          comments: parseInt(formData.get('comments') || 0),
          shares: parseInt(formData.get('shares') || 0)
        })
      });

      if (response.ok) {
        setShowAddPost(false);
        setSelectedCreator(null);
        setEncourageMsg(getRandomEncourage());
        fetchData();
      }
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contentcreator/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: formData.get('date'),
          content_type: formData.get('content_type'),
          platform: formData.get('platform'),
          title: formData.get('title'),
          url: formData.get('url'),
          views: parseInt(formData.get('views') || 0),
          likes: parseInt(formData.get('likes') || 0),
          comments: parseInt(formData.get('comments') || 0),
          shares: parseInt(formData.get('shares') || 0)
        })
      });

      if (response.ok) {
        setShowAddPost(false);
        setSelectedCreator(null);
        setEditingPost(null);
        setEncourageMsg(getRandomEncourage());
        fetchData();
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Hapus post ini bestie? 🤔')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/contentcreator/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Calculate stats for charts
  const chartData = creators.map(c => ({
    name: c.name?.split(' ')[0] || 'Unknown',
    posts: c.current_month_posts || 0,
    target: c.monthly_target_posts || 0
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading content creators... 📸</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Camera className="text-pink-500" />
            Content Creator
          </h1>
          <p className="text-gray-600 mt-1">KPI tracking untuk content creator - Let's make it viral! 🚀</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddCreator(true)}
            className="btn bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Tambah Creator
          </button>
        )}
      </div>

      {/* Encourage Message */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <p className="font-medium text-lg">{encourageMsg}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-pink-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-100 rounded-xl">
              <Camera className="text-pink-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Creator</p>
              <p className="text-2xl font-bold text-gray-800">{creators.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Video className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Posts Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-800">{posts.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(posts.reduce((sum, p) => sum + (p.views || 0), 0))}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Award className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Engagement</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Award size={20} />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'posts'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Camera size={20} />
          Posts
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'chart'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <TrendingUp size={20} />
          Chart
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-yellow-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Leaderboard Creator 🏆</h2>
          </div>

          <div className="space-y-3">
            {creators.map((creator, index) => {
              const progress = creator.monthly_target_posts > 0 
                ? ((creator.current_month_posts || 0) / creator.monthly_target_posts) * 100 
                : 0;
              
              return (
                <div key={creator.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`text-2xl font-bold w-8 ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    
                    {creator.photo_url ? (
                      <img src={creator.photo_url} alt={creator.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {creator.name?.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{creator.name}</h3>
                      <p className="text-sm text-gray-600">
                        {(creator.current_month_posts || 0)} / {creator.monthly_target_posts} posts
                        {creator.platforms && <span className="ml-2 text-pink-500">• {creator.platforms}</span>}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-600">{progress.toFixed(0)}%</div>
                      {isAdmin && (
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => {
                              setEditingCreator(creator);
                              setShowEditCreator(true);
                            }}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Edit KPI
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeleteCreator(creator.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            
            {creators.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Belum ada creator nih bestie! 📸</p>
                <p className="text-sm">Klik "Tambah Creator" untuk mulai tracking!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Video className="text-purple-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-800">Posts Terbaru</h2>
            </div>
            <button
              onClick={() => {
                setSelectedCreator(null);
                setEditingPost(null);
                setShowAddPost(true);
              }}
              className="btn bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah Post
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Creator</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Likes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts.slice(0, 30).map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{post.date}</td>
                    <td className="px-4 py-3 text-sm font-medium">{post.creator_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.content_type === 'reel' ? 'bg-pink-100 text-pink-700' :
                        post.content_type === 'photo' ? 'bg-blue-100 text-blue-700' :
                        post.content_type === 'story' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {post.content_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{post.title || '-'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600">{formatNumber(post.views || 0)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-pink-600">{formatNumber(post.likes || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setSelectedCreator(creators.find(c => c.id === post.creator_id));
                            setShowAddPost(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          title="Edit Post"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="Hapus Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Belum ada post yang tercatat. Bikin konten dulu bestie! 🎬
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Tab */}
      {activeTab === 'chart' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Progress Chart 📊</h2>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="posts" fill="#ec4899" radius={[0, 8, 8, 0]} name="Posts">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.posts >= entry.target ? '#10b981' : '#ec4899'} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="target" fill="#e5e7eb" radius={[0, 8, 8, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-6 justify-center mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-500 rounded"></div>
              <span className="text-sm text-gray-600">Posts (Belum Tercapai)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Posts (Tercapai)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-sm text-gray-600">Target</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Creator Modal */}
      {showAddCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">✨ Tambah Creator Baru</h3>
              <button onClick={() => setShowAddCreator(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCreator} className="space-y-4">
              <div>
                <label className="label">Pilih Staff</label>
                <select name="staff_id" className="input" required>
                  <option value="">-- Pilih Staff --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Target Post Bulanan</label>
                <input
                  type="number"
                  name="monthly_target_posts"
                  className="input"
                  placeholder="Contoh: 30"
                  required
                />
              </div>

              <div>
                <label className="label">Platform (opsional)</label>
                <input
                  type="text"
                  name="platforms"
                  className="input"
                  placeholder="Instagram, TikTok, YouTube"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1 bg-gradient-to-r from-pink-500 to-purple-600">Let's Go! 🚀</button>
                <button
                  type="button"
                  onClick={() => setShowAddCreator(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Creator Modal */}
      {showEditCreator && editingCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">✏️ Edit - {editingCreator.name}</h3>
              <button onClick={() => { setShowEditCreator(false); setEditingCreator(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCreator} className="space-y-4">
              <div>
                <label className="label">Target Post Bulanan</label>
                <input
                  type="number"
                  name="monthly_target_posts"
                  className="input"
                  defaultValue={editingCreator.monthly_target_posts}
                  required
                />
              </div>

              <div>
                <label className="label">Platform</label>
                <input
                  type="text"
                  name="platforms"
                  className="input"
                  defaultValue={editingCreator.platforms}
                  placeholder="Instagram, TikTok, YouTube"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1 bg-gradient-to-r from-pink-500 to-purple-600">Update! ✨</button>
                <button
                  type="button"
                  onClick={() => { setShowEditCreator(false); setEditingCreator(null); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Post Modal */}
      {showAddPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingPost ? '✏️ Edit Post' : '📸 Tambah Post'}
                {selectedCreator && ` - ${selectedCreator.name}`}
              </h3>
              <button onClick={() => { setShowAddPost(false); setSelectedCreator(null); setEditingPost(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingPost ? handleEditPost : handleAddPost} className="space-y-4">
              {/* Creator selection - only show for admin when not pre-selected */}
              {!selectedCreator && isAdmin && (
                <div>
                  <label className="label">Pilih Creator</label>
                  <select 
                    name="creator_id" 
                    className="input" 
                    required
                    defaultValue={editingPost?.creator_id || ''}
                  >
                    <option value="">-- Pilih Creator --</option>
                    {creators.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Show logged-in creator name for non-admin */}
              {!selectedCreator && !isAdmin && (
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <p className="text-sm text-pink-700 font-medium">
                    📸 Posting sebagai: <span className="font-bold">{user?.name || 'Unknown'}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="label">📅 Tanggal</label>
                <input
                  type="date"
                  name="date"
                  className="input"
                  defaultValue={editingPost?.date || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipe Konten</label>
                  <select name="content_type" className="input" required defaultValue={editingPost?.content_type || 'reel'}>
                    {contentTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Platform</label>
                  <select name="platform" className="input" required defaultValue={editingPost?.platform || 'instagram'}>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Judul/Deskripsi</label>
                <input
                  type="text"
                  name="title"
                  className="input"
                  placeholder="Judul atau deskripsi konten"
                  defaultValue={editingPost?.title || ''}
                />
              </div>

              <div>
                <label className="label">URL (opsional)</label>
                <input
                  type="url"
                  name="url"
                  className="input"
                  placeholder="https://..."
                  defaultValue={editingPost?.url || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">👁️ Views</label>
                  <input type="number" name="views" className="input" placeholder="0" defaultValue={editingPost?.views || ''} />
                </div>
                <div>
                  <label className="label">❤️ Likes</label>
                  <input type="number" name="likes" className="input" placeholder="0" defaultValue={editingPost?.likes || ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">💬 Comments</label>
                  <input type="number" name="comments" className="input" placeholder="0" defaultValue={editingPost?.comments || ''} />
                </div>
                <div>
                  <label className="label">🔄 Shares</label>
                  <input type="number" name="shares" className="input" placeholder="0" defaultValue={editingPost?.shares || ''} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1 bg-gradient-to-r from-pink-500 to-purple-600">
                  {editingPost ? 'Update! ✨' : 'Post it! 🔥'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPost(false);
                    setSelectedCreator(null);
                    setEditingPost(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
