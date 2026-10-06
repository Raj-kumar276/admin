import React from 'react';
import logo from '../../assets/onebuddy-logo.png';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function SignedOutLock() {
  const { signedOut, setSignedOut, toast } = useAdmin();
  if (!signedOut) return null;
  return (
    <div className="lock">
      <div className="box">
        <div className="coin">
          <img src={logo} alt="OneBuddy" />
        </div>
        <h2 style={{ fontSize: 22 }}>You're signed out</h2>
        <p>Sign back in to keep managing food, grocery, rides, care and home services.</p>
        <button
          className="btn primary"
          onClick={() => {
            setSignedOut(false);
            toast('Signed in as Ops Admin');
          }}
        >
          Sign in as Ops Admin
        </button>
      </div>
    </div>
  );
}
