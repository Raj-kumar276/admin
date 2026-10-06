import React, { useEffect, useRef, useState } from 'react';
import Icon from '../common/Icon.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';

/**
 * Shared dialog shell. Fields are read with FormData on submit.
 * onSubmit(values, setError) → return false to keep the dialog open.
 * children can be a node or a function (errors) => node.
 */
export default function ModalFrame({ title, ok = 'Save', danger = false, onSubmit, children }) {
  const { closeModal } = useAdmin();
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  useEffect(() => {
    const first = formRef.current && formRef.current.querySelector('input,select,textarea');
    if (first) setTimeout(() => first.focus(), 30);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    const setError = (name, msg) => (found[name] = msg);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const res = onSubmit ? onSubmit(values, setError) : true;
    setErrors(found);
    if (res !== false) closeModal();
  };

  return (
    <>
      <div className="mscrim" onClick={closeModal} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <form ref={formRef} onSubmit={submit} noValidate>
          <div className="mh">
            <h3>{title}</h3>
            <button type="button" className="ib" style={{ width: 34, height: 34 }} onClick={closeModal} aria-label="Close">
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="mb">{typeof children === 'function' ? children(errors) : children}</div>
          <div className="mf">
            <button type="button" className="btn" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className={'btn ' + (danger ? 'danger' : 'primary')}>
              {ok}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/** Inline error line under a field. */
export const FieldError = ({ msg }) => <span className="err">{msg || ''}</span>;
