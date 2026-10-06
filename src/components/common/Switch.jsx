import React from 'react';

/** iOS-style toggle. All extra props go to the checkbox input. */
export default function Switch(props) {
  return (
    <span className="sw">
      <input type="checkbox" {...props} />
    </span>
  );
}
