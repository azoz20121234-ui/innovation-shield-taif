'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';

export default function IdeaDetails() {
  const { id } = useParams();
  const [idea, setIdea] = useState<any>(null);

  useEffect(() => {
    fetchIdea();
  }, []);

  async function fetchIdea() {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();

    setIdea(data);
  }

  async function approveIdea() {
    await supabase
      .from('ideas')
      .update({ status: 'approved' })
      .eq('id', id);

    fetchIdea();
  }

  if (!idea) return <div style={{ padding: 40 }}>جارٍ التحميل...</div>;

  return (
    <div style={containerStyle}>
      <h1>{idea.title}</h1>

      <p style={{ marginTop: 20, opacity: 0.8 }}>
        {idea.description}
      </p>

      <div style={{ marginTop: 30 }}>
        <strong>الحالة:</strong> {idea.status}
      </div>

      {idea.status !== 'approved' && (
        <button onClick={approveIdea} style={buttonStyle}>
          اعتماد الفكرة
        </button>
      )}
    </div>
  );
}

const containerStyle = {
  padding: '40px',
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  color: 'white',
};

const buttonStyle = {
  marginTop: '30px',
  padding: '12px 20px',
  borderRadius: '12px',
  border: 'none',
  background: '#2ecc71',
  color: 'white',
  cursor: 'pointer',
};
