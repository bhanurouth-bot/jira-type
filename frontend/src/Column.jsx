import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'; // <--- Import
import IssueCard from './IssueCard';

export default function Column({ id, issues, onIssueDblClick, onChatClick }) {
  const { setNodeRef } = useDroppable({ id: id });
  const titleMap = { TODO: 'To Do', IN_PROG: 'In Progress', DONE: 'Done' };

  return (
    <div 
      ref={setNodeRef} 
      style={{
        background: '#ebecf0',
        width: '300px',
        borderRadius: '5px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px' // Gap is handled by Card margin now
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#5e6c84', textTransform: 'uppercase' }}>
        {titleMap[id]} ({issues.length})
      </h3>
      
      {/* Wrap cards in SortableContext */}
      <SortableContext 
        items={issues.map(i => i.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div style={{ minHeight: '0px', paddingBottom: '20px' }}></div>
        {issues.map((issue) => (
            <IssueCard 
            key={issue.id} 
            issue={issue} 
            onDoubleClick={onIssueDblClick}
            onChatClick={onChatClick}
            />
        ))}
      </SortableContext>
    </div>
  );
}