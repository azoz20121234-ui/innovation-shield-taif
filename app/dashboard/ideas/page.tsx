'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
      fetchIdeas(data.user.id);
    }
  }

  async function fetchIdeas(uid: string) {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) setIdeas(data);
  }

  async function addIdea() {
    if (!userId) return;

    await supabase.from('ideas').insert({
      title,
      description,
      user_id: userId,
      status: 'draft',
    });

    setTitle('');
    setDescription('');
    fetchIdeas(userId);
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🚀 أفكاري الابتكارية</h1>

      {/* Add Idea */}
      <div style={formStyle}>
        <input
          placeholder="عنوان الفكرة"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="وصف الفكرة"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, height: '100px' }}
        />

        <button onClick={addIdea} style={buttonStyle}>
          إضافة فكرة جديدة
        </button>
      </div>

      {/* Ideas Grid */}
      <div style={gridStyle}>
        {ideas.map((idea) => (
          <div key={idea.id} style={cardStyle}>
            <div style={cardHeader}>
              <h3>{idea.title}</h3>
              <span style={statusStyle(idea.status)}>
                {idea.status}
              </span>
            </div>

            <p style={{ opacity: 0.8 }}>{idea.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Styles ================= */

const containerStyle = {
  padding: '40px',
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  color: 'white',
};

const titleStyle = {
  fontSize: '32px',
  marginBottom: '30px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
  maxWidth: '500px',
  marginBottom: '40px',
};

const inputStyle = {
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  outline: 'none',
};

const buttonStyle = {
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  background: '#1e90ff',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(15px)',
  padding: '20px',
  borderRadius: '20px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
};

const statusStyle = (status: string) => ({
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  background:
    status === 'approved'
      ? '#2ecc71'
      : '#f39c12',
  color: 'white',
});
