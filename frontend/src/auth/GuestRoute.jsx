import React from 'react'

// Authentication pages deliberately remain visible on startup, even when an
// earlier browser session exists. The workspace is still protected separately.
export default function GuestRoute({ children }) {
  return children
}
