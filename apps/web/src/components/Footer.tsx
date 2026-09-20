import React from 'react';
import { Home, Shield, Scale, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">BETOCH</span>
              <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">ቤቶች</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find a place you can trust. Ethiopia's premier residential rental marketplace with verified homes, verified owners, and transparent digital contracts.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>+251 11 661 0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>support@betoch.et</span>
              </div>
            </div>
          </div>

          {/* Sub-Cities Coverage */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Popular Sub-Cities</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link to="/properties?subCity=Bole" className="hover:text-white transition-colors">Bole (Atlas, Medhanialem)</Link></li>
              <li><Link to="/properties?subCity=Kirkos" className="hover:text-white transition-colors">Kirkos (Kazanchis, Olympia)</Link></li>
              <li><Link to="/properties?subCity=Nifas+Silk-Lafto" className="hover:text-white transition-colors">Nifas Silk (Sarbet, Bisrate Gabriel)</Link></li>
              <li><Link to="/properties?subCity=Yeka" className="hover:text-white transition-colors">Yeka (CMC, Megenagna, Ayat)</Link></li>
              <li><Link to="/properties?subCity=Lemi+Kura" className="hover:text-white transition-colors">Lemi Kura (Summit, Arabsa)</Link></li>
              <li><Link to="/properties?subCity=Arada" className="hover:text-white transition-colors">Arada (Piassa, Arat Kilo)</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform & Legal</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link to="/properties" className="hover:text-white transition-colors">Browse All Verified Homes</Link></li>
              <li><Link to="/owner/create-listing" className="hover:text-white transition-colors">List Your Property</Link></li>
              <li><Link to="/profile/verification" className="hover:text-white transition-colors">Fayda National ID Verification</Link></li>
              <li><span className="cursor-pointer hover:text-white">Proclamation No. 1320/2024 Guide</span></li>
              <li><span className="cursor-pointer hover:text-white">Privacy Policy</span></li>
              <li><span className="cursor-pointer hover:text-white">Terms of Service</span></li>
            </ul>
          </div>

          {/* Legal Compliance Box */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
              <Scale className="w-4 h-4" />
              <span>Proclamation No. 1320/2024</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Betoch complies strictly with the <em>Residential Housing Rent Control and Administration Proclamation</em>. Advance deposits are legally capped at max 2 months. All completed rentals generate documentation formatted for Woreda Housing office registration.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Betoch Technologies PLC. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>Powered by Telebirr Gateway</span>
            <span>•</span>
            <span>Argon2id Encrypted</span>
            <span>•</span>
            <span>Made with pride in Ethiopia 🇪🇹</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
