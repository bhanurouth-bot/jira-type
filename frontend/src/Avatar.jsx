import React from 'react';

// 1. Helper to generate a consistent color from a string (Name)
const stringToColor = (string) => {
  if (!string) return '#dfe1e6'; 
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// 2. Helper to get Initials
const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
};

// 3. The Upgraded Component
export default function Avatar({ src, name, size = 24, style = {} }) {
  const bgColor = stringToColor(name);
  
  return (
    <div 
      title={name} 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: src ? 'transparent' : bgColor, // Transparent if image exists
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size / 2.2}px`, 
        fontWeight: 'bold',
        textTransform: 'uppercase',
        flexShrink: 0,
        boxShadow: '0 0 0 1px white',
        overflow: 'hidden', // Clip the image to the circle
        ...style
      }}
    >
      {src ? (
         <img 
            src={src} 
            alt={name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
         />
      ) : (
         getInitials(name)
      )}
    </div>
  );
}