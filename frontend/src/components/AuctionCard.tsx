import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Clock, TrendingUp, AlertCircle, CheckCircle, User, Users, Flame } from 'lucide-react';

export const AuctionCard = ({ auction, onBid, isAdmin, onClose, onEnterRoom }: any) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [viewers, setViewers] = useState(0);
  const { user } = useAuth();
  const { lastMessage } = useSocket();
  const isClosed = auction.status === 'closed';

  useEffect(() => {
    setViewers(Math.floor(Math.random() * 8) + 3);
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'BID_ERROR' && lastMessage.payload.auctionId === auction.id) {
      setError(lastMessage.payload.error);
    }
  }, [lastMessage, auction.id]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(auction.end_time).getTime();
      const start = new Date(auction.start_time).getTime();

      if (now < start) {
        setTimeLeft('Starts soon');
      } else if (now >= end) {
        setTimeLeft('Ended');
      } else {
        const distance = end - now;
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction.end_time, auction.start_time]);

  const handleBid = async () => {
    setError('');
    const amount = parseInt(bidAmount);
    if (isNaN(amount)) {
      setError('Invalid amount');
      return;
    }

    const minRequiredBid = auction.current_bid > 0 ? auction.current_bid + 1 : auction.min_bid;
    if (amount < minRequiredBid) {
      setError(`Minimum bid is ${minRequiredBid}`);
      return;
    }

    try {
      await onBid(auction.id, amount);
      setBidAmount('');
    } catch (err: any) {
      setError(err.message || 'Bid failed');
    }
  };

  const isHighestBidder = user?.id === auction.highest_bidder_id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
      {auction.image_url && (
        <div className="h-48 w-full bg-slate-100 relative">
          <img src={auction.image_url} alt={auction.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          {isClosed && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-xl tracking-widest uppercase">Closed</span>
            </div>
          )}
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{auction.title}</h3>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isClosed ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-600 animate-pulse'}`}>
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500 line-clamp-2 flex-1">{auction.description}</p>
          {!isClosed && (
            <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-md ml-2">
              <Users className="w-3 h-3" /> {viewers} viewing
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 relative overflow-hidden">
          {auction.current_bid > auction.min_bid * 2 && !isClosed && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
              <Flame className="w-3 h-3" /> HOT ITEM
            </div>
          )}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Bid</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {auction.current_bid > 0 ? auction.current_bid : auction.min_bid}
                </span>
                <span className="text-sm text-slate-500 font-medium">credits</span>
              </div>
            </div>
            {auction.highest_bidder_name && (
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Highest Bidder</p>
                <div className="flex items-center gap-1 justify-end">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className={`text-sm font-semibold ${isHighestBidder ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {isHighestBidder ? 'You' : auction.highest_bidder_name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {onEnterRoom ? (
          <button
            onClick={() => onEnterRoom(auction.id)}
            className="w-full mt-auto bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-md"
          >
            Enter Room
          </button>
        ) : (
          !isAdmin && !isClosed && (
            <div className="space-y-3">
              {error && <p className="text-red-500 text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
              
              {!isHighestBidder && auction.current_bid > 0 && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-2 rounded-lg font-medium flex items-center gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Someone else is winning! Bid now to secure it.
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Min: ${auction.current_bid > 0 ? auction.current_bid + 1 : auction.min_bid}`}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleBid}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-500/30 flex items-center gap-1 hover:scale-105 active:scale-95"
                >
                  <TrendingUp className="w-4 h-4" />
                  BID NOW
                </button>
              </div>
              {isHighestBidder && (
                <p className="text-emerald-600 text-xs font-medium flex items-center gap-1 justify-center bg-emerald-50 py-1.5 rounded-md border border-emerald-100">
                  <CheckCircle className="w-3 h-3" /> You are currently winning!
                </p>
              )}
            </div>
          )
        )}

        {isAdmin && !isClosed && (
          <button
            onClick={() => onClose(auction.id)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Close Auction & Declare Winner
          </button>
        )}
      </div>
    </div>
  );
};


