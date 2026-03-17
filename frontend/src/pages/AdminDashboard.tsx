import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { AuctionCard } from '../components/AuctionCard';
import { Plus, Users, Activity, Settings, DollarSign, Database } from 'lucide-react';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const { lastMessage } = useSocket();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('auctions');
  
  // New Auction Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minBid, setMinBid] = useState('');

  useEffect(() => {
    fetchAuctions();
    fetchUsers();
    fetchBids();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'AUCTION_CREATED' || lastMessage.type === 'AUCTION_CLOSED' || lastMessage.type === 'BID_PLACED') {
        fetchAuctions();
        fetchBids();
      }
    }
  }, [lastMessage]);

  const fetchAuctions = async () => {
    const res = await fetch('/api/auctions');
    const data = await res.json();
    setAuctions(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
  };

  const fetchBids = async () => {
    const res = await fetch('/api/reports/bids', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setBids(data);
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/auctions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title, description, image_url: imageUrl,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        min_bid: parseInt(minBid)
      })
    });
    setTitle(''); setDescription(''); setImageUrl(''); setStartTime(''); setEndTime(''); setMinBid('');
    setActiveTab('auctions');
  };

  const handleAssignCredits = async (userId: number, amount: number) => {
    await fetch(`/api/admin/users/${userId}/credits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    fetchUsers();
  };

  const handleCloseAuction = async (auctionId: number) => {
    await fetch(`/api/auctions/${auctionId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleGenerateMockData = async () => {
    await fetch('/api/admin/mock-data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAuctions();
    fetchUsers();
    fetchBids();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage auctions, users, and credits</p>
          </div>
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button onClick={() => setActiveTab('auctions')} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${activeTab === 'auctions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="w-4 h-4" /> Auctions
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users className="w-4 h-4" /> Users
            </button>
            <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${activeTab === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Activity className="w-4 h-4" /> Reports
            </button>
            <button onClick={handleGenerateMockData} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 ml-2 border border-emerald-200">
              <Database className="w-4 h-4" /> Mock Data
            </button>
          </div>
        </div>

        {activeTab === 'auctions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Create Auction
                </h2>
                <form onSubmit={handleCreateAuction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input type="url" required value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                      <input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                      <input type="datetime-local" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Bid</label>
                    <input type="number" required value={minBid} onChange={e => setMinBid(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
                    Create Listing
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {auctions.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} isAdmin={true} onClose={handleCloseAuction} />
                ))}
                {auctions.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                    No auctions found. Create one to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Credits</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                        {u.credits}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleAssignCredits(u.id, 100)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ml-auto">
                        <DollarSign className="w-4 h-4" /> Add 100
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No bidders registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Auction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bidder</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {bids.map(b => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{b.auction_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{b.bidder_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold text-right">{b.amount}</td>
                  </tr>
                ))}
                {bids.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No bids placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
