import { useEffect, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function UserSearchSelect({ id, role, value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialise les résultats quand la requête est vidée, pas de cascade de rendus réelle ici
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get('/admin/users', { params: { role, search: query, per_page: 8 } })
        .then((res) => setResults(res.data.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, role]);

  function handleSelect(user) {
    onChange(user);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm bg-[#F7F7F7]">
        <div>
          <p className="font-semibold text-black">{value.name}</p>
          <p className="text-xs text-[#707070]">{value.email}</p>
        </div>
        <button type="button" onClick={handleClear} className="text-[#707070] hover:text-black" aria-label="Clear selection">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" />
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#e5e5e5] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
        autoComplete="off"
      />
      {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#707070]" />}

      {open && query && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-[#e5e5e5] bg-white shadow-lg">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F7F7] transition-colors"
              >
                <p className="font-semibold text-black">{user.name}</p>
                <p className="text-xs text-[#707070]">{user.email}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query && !loading && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg px-3 py-2 text-xs text-[#707070]">
          No matches found.
        </div>
      )}
    </div>
  );
}