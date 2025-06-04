import React, { useEffect, useRef, useState } from 'react';
import '../styles/pages/ModManager.css';

interface ModEntry {
  id: string;
  name: string;
  image?: string;
}

const STORAGE_KEY = 'se2hub-modlist';

const ModManagerPage: React.FC = () => {
  const [mods, setMods] = useState<ModEntry[]>([]);
  const [modId, setModId] = useState('');
  const [modName, setModName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModEntry[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMods(JSON.parse(saved));
      } catch {
        setMods([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
  }, [mods]);

  const addMod = (id?: string, name?: string): void => {
    const finalId = id || modId;
    const finalName = name || modName;
    if (!finalId || !finalName) return;
    if (mods.some((m) => m.id === finalId)) return;
    setMods([...mods, { id: finalId, name: finalName }]);
    setModId('');
    setModName('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMod = (id: string): void => {
    setMods(mods.filter((m) => m.id !== id));
  };

  const importMods = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json.mods)) {
          setMods(json.mods.map((m: any) => ({ id: String(m.id), name: String(m.name) })));
        }
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (): void => {
    const file = fileInput.current?.files?.[0];
    if (file) importMods(file);
  };

  const searchMods = async (query: string): Promise<void> => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const resp = await fetch(`/api/mods/search?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (Array.isArray(data.mods)) {
        setSearchResults(data.mods);
      }
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const exportMods = (): void => {
    const data = { mods };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const aElem = document.createElement('a');
    aElem.href = url;
    aElem.download = 'modlist.json';
    document.body.appendChild(aElem);
    aElem.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(aElem);
  };

  return (
    <main className="mod-manager-container">
      <h1>Mod Manager</h1>
      <p>Gérez, importez et exportez vos modlists Space Engineers.</p>

      <div className="search-box">
        <label htmlFor="modSearch">Rechercher un mod</label>
        <input
          id="modSearch"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchMods(e.target.value);
          }}
          placeholder="Nom du mod"
        />
      </div>

      {searchResults.length > 0 && (
        <ul className="search-results">
          {searchResults.map((res) => (
            <li key={res.id} className="search-item">
              {res.image && (
                <img src={res.image} alt="" aria-hidden="true" />
              )}
              <span>{res.name}</span>
              <button
                type="button"
                onClick={() => addMod(res.id, res.name)}
              >
                Ajouter
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mod-form">
        <div className="input-group">
          <label htmlFor="modId">ID du mod</label>
          <input
            id="modId"
            value={modId}
            onChange={(e) => setModId(e.target.value)}
            placeholder="123456789"
          />
        </div>
        <div className="input-group">
          <label htmlFor="modName">Nom</label>
          <input
            id="modName"
            value={modName}
            onChange={(e) => setModName(e.target.value)}
            placeholder="Nom du mod"
          />
        </div>
        <button className="add-mod-btn" onClick={() => addMod()} type="button">
          Ajouter
        </button>
      </div>

      {mods.length > 0 && (
        <ul className="mod-list">
          {mods.map((mod) => (
            <li key={mod.id} className="mod-item">
              <span className="mod-id">{mod.id}</span>
              <span className="mod-name">{mod.name}</span>
              <button
                className="delete-mod-btn"
                onClick={() => removeMod(mod.id)}
                aria-label={`Supprimer ${mod.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mod-actions">
        <input
          type="file"
          ref={fileInput}
          accept="application/json"
          onChange={handleImport}
          aria-label="Importer une modlist"
        />
        <button className="export-mods-btn" onClick={exportMods} type="button">
          Exporter
        </button>
      </div>
    </main>
  );
};

export default ModManagerPage;
