// ==============================================================================
// BETOCH MOBILE-FIRST BOTTOM NAVIGATION
// ==============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, openAuthModal } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-brand-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        <NavLink
          to="/properties"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-brand-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Search</span>
        </NavLink>

        <NavLink
          to="/renter/saved"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              openAuthModal('login');
            }
          }}
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-brand-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Heart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Saved</span>
        </NavLink>

        <NavLink
          to="/messages"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              openAuthModal('login');
            }
          }}
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-brand-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Messages</span>
        </NavLink>

        <NavLink
          to={user?.role === 'OWNER' ? '/owner/dashboard' : user?.role === 'ADMIN' ? '/admin' : '/renter/applications'}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              openAuthModal('login');
            }
          }}
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive ? 'text-brand-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{user ? 'Hub' : 'Sign In'}</span>
        </NavLink>
      </div>
    </div>
  );
};
