'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setIdeas(data);
    }
  }

  async function addIdea() {
    const user = await supabase.auth.getUser();

    if (!user.data.user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    await supabase.from('ideas').insert({
      title,
      description,
      user_id: user.data.user.id,
    });

    setTitle('');
    setDescription('');
    fetchIdeas();
  }

  return (
    <div>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>
        إدارة الأفكار 🚀
      </h1>

      {/* Add Idea Form */}
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
          style={{ ...inputStyle, height: '80px' }}
        />

        <button onClick={addIdea} style={buttonStyle}>
          إضافة فكرة
        </button>
      </div>

      {/* Ideas List */}
      <div style={{ marginTop: '30px' }}>
        {ideas.map((idea) => (
          <div key={idea.id} style={cardStyle}>
            <h3>{idea.title}</h3>
            <p style={{ opacity: 0.7 }}>{idea.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
  maxWidth: '400px',
};

const inputStyle = {
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
};

const buttonStyle = {
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  background: '#1e90ff',
  color: 'white',
  cursor: 'pointer',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.05)',
  padding: '20px',
  borderRadius: '15px',
  marginBottom: '15px',
};
