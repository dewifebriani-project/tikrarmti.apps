'use client';

import { Users, Shield, CheckCircle, Ban } from 'lucide-react';

export type StatFilterType = 'all' | 'admin' | 'thalibah' | 'blacklisted';
 
 interface UserStatsProps {
   stats: {
     totalUsers: number;
     totalAdmins: number;
     totalThalibah: number;
     totalBlacklisted: number;
   };
   isLoading: boolean;
   onCardClick?: (filter: StatFilterType) => void;
 }
 
 export function UserStats({ stats, isLoading, onCardClick }: UserStatsProps) {
   const cards = [
     {
       id: 'all' as StatFilterType,
       label: 'Total Users',
       value: stats.totalUsers,
       icon: <Users className="h-6 w-6 text-blue-600" />,
       bg: 'bg-blue-50',
       border: 'border-blue-100',
       hoverBg: 'hover:bg-blue-100/50',
     },
     {
       id: 'admin' as StatFilterType,
       label: 'Administrators',
       value: stats.totalAdmins,
       icon: <Shield className="h-6 w-6 text-purple-600" />,
       bg: 'bg-purple-50',
       border: 'border-purple-100',
       hoverBg: 'hover:bg-purple-100/50',
     },
     {
       id: 'thalibah' as StatFilterType,
       label: 'Active Thalibah',
       value: stats.totalThalibah,
       icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
       bg: 'bg-emerald-50',
       border: 'border-emerald-100',
       hoverBg: 'hover:bg-emerald-100/50',
     },
     {
       id: 'blacklisted' as StatFilterType,
       label: 'Blacklisted',
       value: stats.totalBlacklisted,
       icon: <Ban className="h-6 w-6 text-red-600" />,
       bg: 'bg-red-50',
       border: 'border-red-100',
       hoverBg: 'hover:bg-red-100/50',
     },
   ];
 
   return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
       {cards.map((card, idx) => (
         <div
           key={card.id}
           onClick={() => onCardClick?.(card.id)}
           className={`p-6 rounded-2xl border ${card.border} ${card.bg} ${card.hoverBg} transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group active:scale-95`}
         >
           <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100/50 group-hover:scale-110 transition-transform duration-300">
               {card.icon}
             </div>
             {isLoading ? (
               <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
             ) : (
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-600 transition-colors">Overview</span>
             )}
           </div>
           <div className="space-y-1">
             {isLoading ? (
               <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
             ) : (
               <h3 className="text-3xl font-black text-gray-900 tracking-tight">{card.value.toLocaleString()}</h3>
             )}
             <p className="text-sm font-bold text-gray-600 tracking-tight group-hover:text-gray-900 transition-colors">{card.label}</p>
           </div>
         </div>
       ))}
     </div>
   );
 }
