import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@betoch/shared';
import {
  Home,
  PlusCircle,
  FileText,
  Heart,
  MessageSquare,
  ShieldCheck,
  LogOut,
  User,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center text-white shadow-md shadow-brand-900/10 group-hover:bg-brand-700 transition-colors">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">BETOCH</span>
                <span className="text-[10px] bg-brand-50 text-brand-800 px-1.5 py-0.5 rounded font-bold border border-brand-200">ቤቶች</span>
              </div>
              <span className="text-[10px] text-slate-500 block -mt-1 font-medium">Verified Home Rentals</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link to="/properties" className="hover:text-brand-700 transition-colors">
              Browse Homes
            </Link>
            <Link to="/#how-it-works" className="hover:text-brand-700 transition-colors">
              How It Works
            </Link>
            <Link to="/#trust-safeguards" className="hover:text-brand-700 transition-colors flex items-center gap-1 text-brand-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Why Trust Betoch
            </Link>
          </div>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Owner Specific CTA */}
                {user.role === UserRole.OWNER && (
                  <Link
                    to="/owner/create-listing"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    List Property
                  </Link>
                )}

                {/* Messages quick link */}
                <Link
                  to="/messages"
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs">
                      {user.profile.firstName?.[0] || 'U'}
                    </div>
                    <div className="hidden lg:block">
                      <span className="text-xs font-semibold block text-slate-800 leading-tight">
                        {user.profile.firstName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {user.role}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900">{user.profile.firstName} {user.profile.lastName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <div className="mt-1">
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Role: {user.role}
                          </span>
                        </div>
                      </div>

                      {user.role === UserRole.OWNER && (
                        <>
                          <Link to="/owner/dashboard" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                            <LayoutDashboard className="w-4 h-4 text-slate-400" />
                            Owner Dashboard
                          </Link>
                          <Link to="/owner/create-listing" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                            <PlusCircle className="w-4 h-4 text-slate-400" />
                            Create New Listing
                          </Link>
                        </>
                      )}

                      {user.role === UserRole.RENTER && (
                        <>
                          <Link to="/renter/applications" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                            <FileText className="w-4 h-4 text-slate-400" />
                            My Applications
                          </Link>
                          <Link to="/renter/saved" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                            <Heart className="w-4 h-4 text-slate-400" />
                            Saved Homes
                          </Link>
                        </>
                      )}

                      {user.role === UserRole.ADMIN && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-xs text-brand-800 hover:bg-brand-50 font-semibold">
                          <LayoutDashboard className="w-4 h-4 text-brand-600" />
                          Platform Administration
                        </Link>
                      )}

                      <Link to="/profile/verification" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Identity Verification (Fayda)
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/properties"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700"
          >
            Browse Homes
          </Link>
          <Link
            to="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700"
          >
            How It Works
          </Link>
          <Link
            to="/#trust-safeguards"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-brand-800"
          >
            Why Trust Betoch
          </Link>

          {user ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-500">Signed in as {user.profile.firstName} ({user.role})</p>
              {user.role === UserRole.OWNER && (
                <>
                  <Link to="/owner/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-slate-800">
                    Owner Dashboard
                  </Link>
                  <Link to="/owner/create-listing" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-brand-700 font-semibold">
                    + List New Property
                  </Link>
                </>
              )}
              {user.role === UserRole.RENTER && (
                <>
                  <Link to="/renter/applications" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-slate-800">
                    My Applications
                  </Link>
                  <Link to="/renter/saved" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-slate-800">
                    Saved Homes
                  </Link>
                </>
              )}
              {user.role === UserRole.ADMIN && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-brand-800 font-bold">
                  Admin Dashboard
                </Link>
              )}
              <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-slate-800">
                Messages
              </Link>
              <Link to="/profile/verification" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-xs font-medium text-emerald-700">
                Identity Verification
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="block w-full text-left py-1.5 text-xs font-medium text-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100"
              >
                Sign In
              </button>
              <button
                onClick={() => { openAuthModal('register'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-brand-700"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
