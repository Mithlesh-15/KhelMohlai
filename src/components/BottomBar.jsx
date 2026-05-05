import React from 'react';
import { Activity, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Matches', to: '/', icon: Activity, end: true },
  { label: 'Leaderboard', to: '/points', icon: Trophy },
];

function BottomBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-2 sm:px-6 lg:px-8">
      <nav
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center rounded-[1.75rem] border p-2 shadow-lg backdrop-blur sm:max-w-lg lg:max-w-xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(232, 240, 255, 0.94))',
          borderColor: 'rgba(191, 210, 255, 0.9)',
          boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
        }}
        aria-label="Bottom navigation"
      >
        {navItems.map(({ label, to, icon, end }) => {
          const NavIcon = icon;

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'group flex min-w-0 flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out sm:px-5 lg:px-6',
                  isActive ? 'shadow-sm' : 'hover:-translate-y-0.5',
                ].join(' ')
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(1, 69, 242, 0.12)' : 'transparent',
                color: isActive ? '#0145F2' : 'var(--text-secondary)',
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(1, 69, 242, 0.1)' : 'none',
              })}
            >
              <span className="flex items-center gap-2.5 lg:gap-3">
                <NavIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105 lg:h-6 lg:w-6" />
                <span className="whitespace-nowrap">{label}</span>
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default BottomBar;
