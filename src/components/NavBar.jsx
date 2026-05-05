import React, { useEffect, useRef, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../utils/supabase';

function NavBar() {
  const [session, setSession] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!error && isMounted) {
        setSession(data.session);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsDropdownOpen(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  const handleUserClick = () => {
    if (!session) {
      window.location.assign('/login');
      return;
    }

    setIsDropdownOpen((previousState) => !previousState);
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
  const user = await supabase.auth.getUser();
console.log(user.data.user.email)
  await supabase
    .from("users")
    .update({ is_active: false })
    .eq("email", user.data.user.email);


    const { error } = await supabase.auth.signOut();

    if (!error) {
      setSession(null);
      setIsDropdownOpen(false);
    }

    setIsSigningOut(false);
};

  const userLabel = session?.user?.email || session?.user?.phone || 'Account';

  return (
    <header className="sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8">
      <div
        className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-4 py-3 shadow-sm backdrop-blur sm:px-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(232, 240, 255, 0.92))',
          borderColor: 'var(--border-soft)',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Khel Mohlai logo"
            className="h-11 w-11 rounded-2xl border object-cover shadow-sm sm:h-12 sm:w-12"
            style={{ borderColor: 'rgba(191, 210, 255, 0.9)' }}
          />
          <div className="min-w-0">
            <p
              className="truncate text-lg font-semibold tracking-tight sm:text-xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Khel Mohlai
            </p>
            <p
              className="hidden text-sm sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Community sports, scores, and updates
            </p>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleUserClick}
            className="flex h-11 w-11 items-center justify-center rounded-full border transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: session ? 'rgba(232, 240, 255, 0.95)' : '#f8fafc',
              borderColor: 'var(--border-soft)',
              color: session ? 'var(--color-primary)' : 'var(--text-secondary)',
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
            }}
            aria-label={session ? 'Open user menu' : 'Go to login'}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
          >
            <User className="h-5 w-5" />
          </button>

          {session && isDropdownOpen ? (
            <div
              className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border p-2 shadow-lg"
              style={{
                backgroundColor: 'rgba(248, 250, 252, 0.98)',
                borderColor: 'rgba(191, 210, 255, 0.9)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
              }}
              role="menu"
            >
              <div className="px-3 py-2">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {userLabel}
                </p>
                <p
                  className="mt-1 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Signed in
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ color: 'var(--danger-text)' }}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
