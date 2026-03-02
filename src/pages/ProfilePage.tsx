import React from 'react';
import { useSession } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, ShieldCheck, Zap, History, ArrowLeft, Crown, Clock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export function ProfilePage({ onBack }: { onBack: () => void }) {
  const { user, signOut } = useSession();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          <button 
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
        >
          <div className="h-32 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6">
              <img 
                src={user.image || 'https://picsum.photos/seed/user/200/200'} 
                alt={user.name}
                className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg object-cover"
                referrerPolicy="no-referrer"
              />
              {user.isPremium && (
                <div className="absolute bottom-2 right-2 p-2 bg-amber-400 rounded-xl shadow-lg border-2 border-white">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                <div className="flex items-center gap-2 text-slate-500 mt-1">
                  <Mail className="w-4 h-4" /> {user.email}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 ${
                  user.isPremium 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {user.isPremium ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {user.isPremium ? 'Premium Member' : 'Free Tier'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Usage Status</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-500">Free Analysis Remaining</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {user.isPremium ? 'Unlimited' : `${Math.max(0, 2 - user.freeUsageCount)} / 2`}
                  </span>
                </div>
                {!user.isPremium && (
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        user.freeUsageCount >= 2 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(user.freeUsageCount / 2) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Next Reset Date</div>
                  <div className="text-sm font-bold text-slate-900">
                    {new Date(new Date(user.freeUsageResetDate).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Account History</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Member Since</div>
                <div className="text-sm font-bold text-slate-900">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              
              {!user.isPremium && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="text-sm font-bold text-amber-900 mb-1">Upgrade to Premium</div>
                  <p className="text-xs text-amber-700 mb-3">Get unlimited analyses, deep clinical insights, and priority support for just ₹15/month.</p>
                  <button 
                    onClick={onBack}
                    className="w-full py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors shadow-md"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
