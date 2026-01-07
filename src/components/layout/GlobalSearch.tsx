import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Users, Calendar, X } from 'lucide-react';
import { globalSearch } from '@/lib/storage';
import { Donor, Guest, Visit } from '@/types';

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    donors: Donor[];
    guests: Guest[];
    bookings: Visit[];
  }>({ donors: [], guests: [], bookings: [] });
  
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const searchResults = globalSearch(searchTerm);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults({ donors: [], guests: [], bookings: [] });
      setIsOpen(false);
    }
  }, [searchTerm]);

  const handleSelect = (type: string, id: string) => {
    setIsOpen(false);
    setSearchTerm('');
    
    switch (type) {
      case 'donor':
        navigate(`/donors?id=${id}`);
        break;
      case 'guest':
        navigate(`/bookings?guest=${id}`);
        break;
      case 'booking':
        navigate(`/bookings?booking=${id}`);
        break;
    }
  };

  const totalResults = results.donors.length + results.guests.length + results.bookings.length;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by ID, name, or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          className="input-styled pl-10 pr-10 w-full"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {totalResults === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No results found</p>
            </div>
          ) : (
            <>
              {results.donors.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    Donors ({results.donors.length})
                  </p>
                  {results.donors.slice(0, 5).map((donor) => (
                    <button
                      key={donor.id}
                      onClick={() => handleSelect('donor', donor.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{donor.name}</p>
                        <p className="text-xs text-muted-foreground">{donor.donorId} • {donor.mobile}</p>
                      </div>
                      <span className="badge-success text-xs">Donor</span>
                    </button>
                  ))}
                </div>
              )}

              {results.guests.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    Guests ({results.guests.length})
                  </p>
                  {results.guests.slice(0, 5).map((guest) => (
                    <button
                      key={guest.id}
                      onClick={() => handleSelect('guest', guest.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{guest.name}</p>
                        <p className="text-xs text-muted-foreground">{guest.mobile}</p>
                      </div>
                      <span className="badge-warning text-xs">Guest</span>
                    </button>
                  ))}
                </div>
              )}

              {results.bookings.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    Bookings ({results.bookings.length})
                  </p>
                  {results.bookings.slice(0, 5).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => handleSelect('booking', booking.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          Room {booking.roomNumbers.join(', ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.checkInDate} • {booking.guestType}
                        </p>
                      </div>
                      <span className={
                        booking.status === 'checked_in' ? 'badge-success' :
                        booking.status === 'checked_out' ? 'badge-warning' : 'badge-destructive'
                      }>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
