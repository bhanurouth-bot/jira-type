import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// FIX 1: Cleaned up imports (removed duplicate closestCorners)
import { DndContext, closestCorners, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { fetchIssues, updateIssueStatus, updateIssueOrder } from './api';
import Column from './Column';
import EditIssueModal from './EditIssueModal';
import CommentsModal from './CommentsModal';

const STATUSES = ['TODO', 'IN_PROG', 'DONE'];

export default function Board({ search, projectId }) {
  const queryClient = useQueryClient();
  const [editingIssue, setEditingIssue] = useState(null);
  const [chatIssue, setChatIssue] = useState(null);
  
  const [issues, setIssues] = useState([]);
  const [activeDragIssue, setActiveDragIssue] = useState(null);

  const { data: serverIssues } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => fetchIssues(projectId),
    enabled: !!projectId,
    // FIX 2: Removed refetchInterval: 2000 to prevent dragging glitches
  });

  useEffect(() => {
    if (serverIssues) {
        const sorted = [...serverIssues].sort((a, b) => a.order - b.order);
        setIssues(sorted);
    }
  }, [serverIssues]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredIssues = useMemo(() => {
    if (!search) return issues;
    const lowerSearch = search.toLowerCase();
    return issues.filter(i => i.title.toLowerCase().includes(lowerSearch) || i.key.toLowerCase().includes(lowerSearch));
  }, [issues, search]);

  const columns = useMemo(() => {
    const cols = { TODO: [], IN_PROG: [], DONE: [] };
    filteredIssues.forEach((issue) => {
        if (cols[issue.status]) cols[issue.status].push(issue);
    });
    return cols;
  }, [filteredIssues]);

  // --- DRAG HANDLERS ---

  const handleDragStart = (event) => {
    const issueId = event.active.id;
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
        setActiveDragIssue(issue);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const isActiveTask = active.data.current?.type !== 'Column';

    if (!isActiveTask) return;

    const activeIssue = issues.find(i => i.id === active.id);
    const overIssue = issues.find(i => i.id === over.id);

    if (!activeIssue) return;

    // Scenario 1: Dragging over another Task in a DIFFERENT column
    if (activeIssue && overIssue && activeIssue.status !== overIssue.status) {
        setIssues((items) => {
            const activeIndex = items.findIndex(i => i.id === active.id);
            const overIndex = items.findIndex(i => i.id === over.id);
            
            const newItems = [...items];
            newItems[activeIndex] = { ...newItems[activeIndex], status: overIssue.status };
            
            return arrayMove(newItems, activeIndex, overIndex);
        });
    }

    // Scenario 2: Dragging over an Empty Column
    const isOverColumn = STATUSES.includes(over.id);
    if (isOverColumn && activeIssue.status !== over.id) {
         setIssues((items) => {
            const activeIndex = items.findIndex(i => i.id === active.id);
            const newItems = [...items];
            newItems[activeIndex] = { ...newItems[activeIndex], status: over.id };
            return arrayMove(newItems, activeIndex, activeIndex);
        });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    const originalIssue = activeDragIssue;
    setActiveDragIssue(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let newStatus = originalIssue ? originalIssue.status : 'TODO';

    if (STATUSES.includes(overId)) {
        newStatus = overId;
    } else {
        const overIssue = issues.find(i => i.id === overId);
        if (overIssue) newStatus = overIssue.status;
    }

    const oldIndex = issues.findIndex((i) => i.id === activeId);
    const newIndex = issues.findIndex((i) => i.id === overId);
    let newIssues = [...issues];

    if (oldIndex !== -1) {
        newIssues[oldIndex] = { ...newIssues[oldIndex], status: newStatus };
    }
    if (oldIndex !== newIndex) {
        newIssues = arrayMove(newIssues, oldIndex, newIndex);
    }
    setIssues(newIssues);

    if (originalIssue && originalIssue.status !== newStatus) {
         updateIssueStatus({ id: activeId, status: newStatus })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['issues'] }); 
            });
    }

    const columnItems = newIssues.filter(i => i.status === newStatus);
    updateIssueOrder(columnItems)
        .then(() => {
            queryClient.invalidateQueries({ queryKey: ['issues'] });
        });
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100vh', background: '#f4f5f7' }}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners} // <--- Important: Kept this for better empty column detection
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {STATUSES.map((status) => (
          <Column 
            key={status} 
            id={status} 
            issues={columns[status]}
            onIssueDblClick={setEditingIssue}
            onChatClick={setChatIssue} 
          />
        ))}
      </DndContext>

      <EditIssueModal isOpen={!!editingIssue} issue={editingIssue} onClose={() => setEditingIssue(null)} />
      <CommentsModal isOpen={!!chatIssue} issue={chatIssue} onClose={() => setChatIssue(null)} />
    </div>
  );
}