import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { AuctionCard } from '../components/AuctionCard';
import { Wallet, Info } from 'lucide-react';

export const BidderDashboard = () => {
  const { token, user, refreshUser } = useAuth();
  const { lastMessage, sendMessage } = useSocket();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<number | null>(null);

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      sendMessage('JOIN_ROOM', { roomId: `auction_${activeRoom}` });
    } else {
      sendMessage('JOIN_ROOM', { roomId: 'dashboard' });
    }
  }, [activeRoom]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'AUCTION_CREATED' || lastMessage.type === 'AUCTION_CLOSED' || lastMessage.type === 'BID_PLACED') {
        fetchAuctions();
        refreshUser();
      }
    }
  }, [lastMessage]);

  const fetchAuctions = async () => {
    const res = await fetch('http://localhost:5000/auction');
    const data = await res.json();
    setAuctions(data);
  };

  const handleBid = async (auctionId: string, amount: number) => {
    sendMessage('PLACE_BID', { token, auctionId, amount });
  };

  const handleAddCredits = async () => {
    try {
      await fetch('http://localhost:5000/add-credits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      refreshUser();
    } catch (err) {
      console.error('Failed to add credits', err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeRoom ? 'Auction Room' : 'Active Auctions'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeRoom ? 'Place your bids in real-time' : 'Browse and bid on live items'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Available Balance</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-slate-900">{user?.availableCredits || 0} <span className="text-sm font-medium text-slate-500">credits</span></p>
                <button 
                  onClick={handleAddCredits}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md transition-colors shadow-sm"
                >
                  + 1000
                </button>
              </div>
            </div>
          </div>
        </div>

        {user?.heldCredits ? (
          <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-blue-800">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">You have {user.heldCredits} credits currently held in active bids.</p>
              <p className="text-sm text-blue-600 mt-1">These credits will be returned to your available balance if you are outbid, or permanently deducted if you win the auction.</p>
            </div>
          </div>
        ) : null}

        {activeRoom ? (
          <div>
            <button onClick={() => setActiveRoom(null)} className="mb-6 text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors">
              &larr; Back to Dashboard
            </button>
            <div className="max-w-xl mx-auto">
              {auctions.filter(a => a.id === activeRoom).map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction} 
                  onBid={handleBid} 
                  isAdmin={false} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map(auction => (
              <AuctionCard 
                key={auction.id} 
                auction={auction} 
                onEnterRoom={setActiveRoom}
                isAdmin={false} 
              />
            ))}
            {auctions.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                <p className="text-lg font-medium text-slate-900 mb-1">No active auctions</p>
                <p>Check back later for new items.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
