import React from 'react';
import { useSortable } from '@dnd-kit/sortable'; // <--- Change import
import { CSS } from '@dnd-kit/utilities'; // <--- Import CSS utility
import Avatar from './Avatar';

const priorityStyles = {
  LOW: { bg: '#e3fcef', color: '#006644', label: 'Low' },
  MED: { bg: '#fffae6', color: '#ff8b00', label: 'Medium' },
  HIGH: { bg: '#ffebe6', color: '#de350b', label: 'High' },
  CRITICAL: { bg: '#bf2600', color: 'white', label: 'Critical' }
};

export default function IssueCard({ issue, onDoubleClick, onChatClick }) {
  // Switch to useSortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: issue.id, data: { ...issue } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Fade out when dragging
    background: 'white',
    padding: '10px',
    borderRadius: '3px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    cursor: 'grab',
    position: 'relative',
    borderLeft: `4px solid ${priorityStyles[issue.priority]?.color || '#ccc'}`,
    marginBottom: '8px' // Margin is important for spacing in sortable lists
  };

  const pStyle = priorityStyles[issue.priority] || priorityStyles.MED;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onDoubleClick(issue)}
    >
        {/* ... Keep the exact same content inside the card ... */}
       
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>{issue.key}</span>
            <span style={{ fontSize: '10px', background: pStyle.bg, color: pStyle.color, padding: '2px 6px', borderRadius: '3px', fontWeight: '700', textTransform: 'uppercase' }}>
            {pStyle.label}
            </span>
        </div>
        
        <div style={{ fontWeight: '500', marginBottom: '10px', color: '#172b4d' }}>{issue.title}</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '24px' }}>
            {issue.assignee_details ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Avatar 
                        src={issue.assignee_details?.avatar} 
                        name={issue.assignee_details?.username} 
                        size={24} 
                    />
                </div>
            ) : (
                <span style={{fontSize:'10px', color:'#ccc'}}>Unassigned</span>
            )}

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onChatClick(issue);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px', color: '#5e6c84', display: 'flex', alignItems: 'center', borderRadius: '3px' }}
                title="Open Chat"
            >
                💬 
            </button>
        </div>
    </div>
  );
}