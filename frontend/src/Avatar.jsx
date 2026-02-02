import React from 'react';

// 1. Helper to generate a consistent color from a string (Name)
const stringToColor = (string) => {
  if (!string) return '#dfe1e6'; // Default grey for unknown
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// 2. Helper to get Initials (e.g. "John Doe" -> "JD")
const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
};

export default function Avatar({ name, size = 24, style = {} }) {
  const bgColor = stringToColor(name);
  
  return (
    <div 
      title={name} // Hover tooltip shows full name
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size / 2.2}px`, // Font scales with size
        fontWeight: 'bold',
        textTransform: 'uppercase',
        flexShrink: 0,
        boxShadow: '0 0 0 1px white', // White ring for overlap effect
        ...style
      }}
    >
      {getInitials(name)}
    </div>
  );
}