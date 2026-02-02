import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCorners, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { fetchIssues, updateIssueStatus, updateIssueOrder } from './api';
import Column from './Column';
import EditIssueModal from './EditIssueModal';
import CommentsModal from './CommentsModal';

const STATUSES = ['TODO', 'IN_PROG', 'DONE'];

export default function Board({ search }) {
  const queryClient = useQueryClient();
  const [editingIssue, setEditingIssue] = useState(null);
  const [chatIssue, setChatIssue] = useState(null);
  
  // Local state for instant drag updates
  const [issues, setIssues] = useState([]);

  // Fetch from API
  const { data: serverIssues } = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues,
  });

  // Sync server data to local state
  useEffect(() => {
    if (serverIssues) {
        // Sort by 'order' field to ensure correct display
        const sorted = [...serverIssues].sort((a, b) => a.order - b.order);
        setIssues(sorted);
    }
  }, [serverIssues]);

  // Sensors (Make drag smoother)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter Logic
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

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const isActiveTask = active.data.current?.type !== 'Column';
    const isOverTask = over.data.current?.type !== 'Column';

    if (!isActiveTask) return;

    // Finding the card objects
    const activeIssue = issues.find(i => i.id === active.id);
    const overIssue = issues.find(i => i.id === over.id);

    if (!activeIssue) return;

    // Scenario 1: Dragging over another Task in a DIFFERENT column
    if (activeIssue && overIssue && activeIssue.status !== overIssue.status) {
        setIssues((items) => {
            const activeIndex = items.findIndex(i => i.id === active.id);
            const overIndex = items.findIndex(i => i.id === over.id);
            
            // Clone and update status immediately for visual feedback
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
            return arrayMove(newItems, activeIndex, activeIndex); // Just status change
        });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Calculate final positions
    const activeIndex = issues.findIndex(i => i.id === activeId);
    const overIndex = issues.findIndex(i => i.id === overId);

    let newIssues = [...issues];

    if (activeIndex !== overIndex) {
        newIssues = arrayMove(issues, activeIndex, overIndex);
        setIssues(newIssues); // Update UI
    }

    // Identify the column (status) that changed
    const activeIssue = newIssues.find(i => i.id === activeId);
    if(!activeIssue) return;
    const currentStatus = activeIssue.status;

    // Get all items in that column (in their new order)
    const columnItems = newIssues.filter(i => i.status === currentStatus);
    
    // Save to Backend
    updateIssueOrder(columnItems); // Save order
    if (active.data.current?.status !== currentStatus) {
         updateIssueStatus({ id: activeId, status: currentStatus }); // Save status if changed
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100vh', background: '#f4f5f7' }}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners} 
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