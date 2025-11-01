import React from 'react';
import 'remixicon/fonts/remixicon.css';

const RemixIcon = ({ name, size = '20px', color, style = {} }) => {
  // Add ri- prefix if not already present
  const iconClass = name.startsWith('ri-') ? name : `ri-${name}`;

  return (
    <i
      className={iconClass}
      style={{
        fontSize: size,
        lineHeight: 1,
        color: color || 'inherit',
        ...style
      }}
    />
  );
};

export default RemixIcon;