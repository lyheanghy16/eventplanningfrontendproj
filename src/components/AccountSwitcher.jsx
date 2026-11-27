/**
 * AccountSwitcher: accessible account menu for the signed-in user.
 * Renders account switching, adding, removal, and logout actions; used by Navbar and WelcomePage.
 */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import DemoBadge from './DemoBadge';

/**
 * Shows the active account and dropdown controls.
 * Props: triggerLabel (accessible button label), compact (short welcome-page trigger),
 * and optional showDemoBadge (active-account demo state supplied by Navbar).
 * Reads auth/toast context; open state and refs manage keyboard focus and outside-click closing.
 */
export default function AccountSwitcher({ triggerLabel = 'Account switcher', compact = false, showDemoBadge }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { accounts, currentUser, switchAccount, addAccount, removeAccount, logout, logoutAll } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  // When open changes, focus the menu and attach dismissal listeners; cleanup removes listeners on close.
  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    requestAnimationFrame(() => itemRefs.current[0]?.focus());
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function closeAndFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleSwitch(user) {
    if (switchAccount(user.id)) {
      toast.success(`Switched to ${user.name}`);
      closeAndFocus();
    }
  }

  function handleAdd() {
    closeAndFocus();
    navigate('/login?add=1', { state: { from: location } });
  }

  function handleLogoutAll() {
    logoutAll();
    closeAndFocus();
    navigate('/', { replace: true });
  }

  function handleLogout() {
    logout();
    closeAndFocus();
    navigate('/', { replace: true });
  }

  function handleRemove(userId) {
    removeAccount(userId);
    toast.success('Account removed from this browser');
  }

  function handleMenuKey(event) {
    const items = itemRefs.current.filter(Boolean);
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  }

  if (!currentUser) return null;
  const activeIsDemo = showDemoBadge ?? (currentUser.isDemo === true);
  const otherAccounts = accounts.filter((account) => account.id !== currentUser.id);

  return (
    <div className={`account-switcher ${compact ? 'account-switcher--compact' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={compact ? 'account-switch-trigger account-switch-trigger--compact' : 'account-switch-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={currentUser.name} color={currentUser.avatarColor} size={32} />
        {compact ? <span>{triggerLabel}</span> : (
          <span className="account-trigger-copy">
            <strong>{currentUser.name}</strong>
            <small>{currentUser.email}</small>
          </span>
        )}
        {activeIsDemo && <DemoBadge />}
        {!compact && <span aria-hidden="true">▾</span>}
      </button>

      {open && (
        <div className="account-menu" role="menu" onKeyDown={handleMenuKey}>
          <div className="account-menu-current">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size={40} />
            <div><strong>{currentUser.name}</strong><small>{currentUser.email}</small></div>
            {currentUser.isDemo && <DemoBadge />}
          </div>
          {otherAccounts.map((account, index) => (
            <div className="account-menu-row" key={account.id}>
              <button
                ref={(element) => { itemRefs.current[index] = element; }}
                type="button"
                role="menuitem"
                className="account-menu-account"
                onClick={() => handleSwitch(account)}
              >
                <Avatar name={account.name} color={account.avatarColor} size={36} />
                <span><strong>{account.name}</strong><small>{account.email}</small></span>
                {account.isDemo && <DemoBadge />}
              </button>
              <button
                type="button"
                className="account-remove"
                aria-label={`Remove ${account.name}`}
                onClick={() => handleRemove(account.id)}
              >×</button>
            </div>
          ))}
          <button
            ref={(element) => { itemRefs.current[otherAccounts.length] = element; }}
            type="button"
            role="menuitem"
            className="account-menu-action"
            onClick={handleAdd}
          >+ Add another account</button>
          <button
            ref={(element) => { itemRefs.current[otherAccounts.length + 1] = element; }}
            type="button"
            role="menuitem"
            className="account-menu-action"
            onClick={handleLogout}
          >Log out</button>
          <button
            ref={(element) => { itemRefs.current[otherAccounts.length + 2] = element; }}
            type="button"
            role="menuitem"
            className="account-menu-action account-menu-action--danger"
            onClick={handleLogoutAll}
          >Log out of all accounts</button>
        </div>
      )}
    </div>
  );
}

AccountSwitcher.propTypes = {
  triggerLabel: PropTypes.string,
  compact: PropTypes.bool,
  showDemoBadge: PropTypes.bool,
};
