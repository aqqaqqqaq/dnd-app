import React, { useState, useEffect } from 'react';
import {
  User, Map, Backpack, BookOpen, Sword,
  Plus, Minus, Edit3, Trash2, Send, PackagePlus,
  ChevronRight, Skull, UserPlus, Save
} from 'lucide-react';

const diceSound = new Audio('./4aa7e3eff066b67.mp3');

const App = () => {
  // --- СОСТОЯНИЯ ---
  const [notes, setNotes] = useState(localStorage.getItem('dnd_notes') || "");
  const [showGameOver, setShowGameOver] = useState(false);
  const [activeTab, setActiveTab] = useState('party');
  const [isCombat, setIsCombat] = useState(false);
  const [diceLog, setDiceLog] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("");
  const [editingChar, setEditingChar] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  const [inputInv, setInputInv] = useState("");

  // Про-статы (Редактор)
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('dnd_stats');
    return saved ? JSON.parse(saved) : { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
  });

  const [party, setParty] = useState(() => {
    const saved = localStorage.getItem('dnd_party');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Бендольф", class: "Маг", hp: 28, max: 28, ac: 12, icon: '🧙‍♂️' },
      { id: 2, name: "Тордин", class: "Воин", hp: 52, max: 52, ac: 18, icon: '⚔️' }
    ];
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('dnd_inv');
    return saved ? JSON.parse(saved) : [{ id: 1, name: "Зелье здоровья", count: 3 }];
  });

  const [combatants, setCombatants] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);

  // --- ЭФФЕКТЫ (Автосохранение) ---
  useEffect(() => { localStorage.setItem('dnd_party', JSON.stringify(party)); }, [party]);
  useEffect(() => { localStorage.setItem('dnd_inv', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('dnd_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('dnd_notes', notes); }, [notes]);

  // --- ЛОГИКА ---
  const updateStat = (s, d) => setStats(prev => ({ ...prev, [s]: prev[s] + d }));

  const rollDice = (s) => {
    if (isRolling) return;
    diceSound.currentTime = 0;
    diceSound.play().catch(() => {});
    setIsRolling(true);
    setTimeout(() => {
      const res = Math.floor(Math.random() * s) + 1;
      if (s === 20 && res === 1) {
        setShowGameOver(true);
        setTimeout(() => setShowGameOver(false), 3000);
      }
      setDiceLog(prev => [{ id: Date.now(), s: `d${s}`, res }, ...prev].slice(0, 5));
      setIsRolling(false);
    }, 600);
  };

  const startCombat = () => {
    const initial = party.map(p => ({ ...p, init: Math.floor(Math.random() * 20) + 1, type: 'player' }))
      .sort((a, b) => b.init - a.init);
    setCombatants(initial);
    setIsCombat(true);
    setCurrentTurn(0);
  };

  const updateHP = (id, delta) => {
    setCombatants(prev => prev.map(c => 
      c.id === id ? { ...c, hp: Math.max(0, Math.min(c.max, c.hp + delta)) } : c
    ));
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 font-sans select-none">
      
      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ГЕРОЯ */}
      {editingChar && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f18] border border-blue-500/30 p-8 rounded-[3rem] w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-white font-black uppercase text-xl mb-6 flex items-center gap-2">
              <Edit3 size={20} className="text-blue-500"/> Про-Редактор
            </h2>
            
            <div className="space-y-4">
              {/* Основное */}
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 ml-1">Имя и Класс</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input value={editingChar.name} onChange={e => setEditingChar({...editingChar, name: e.target.value})} className="bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" placeholder="Имя"/>
                  <input value={editingChar.class} onChange={e => setEditingChar({...editingChar, class: e.target.value})} className="bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" placeholder="Класс"/>
                </div>
              </div>

              {/* ХП и Броня */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-1">Max HP</label>
                  <input type="number" value={editingChar.max} onChange={e => setEditingChar({...editingChar, max: parseInt(e.target.value) || 0, hp: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-1">Armor Class</label>
                  <input type="number" value={editingChar.ac} onChange={e => setEditingChar({...editingChar, ac: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono" />
                </div>
              </div>

              {/* СТАТЫ (ПРО-блок) */}
              <div className="pt-2">
                <label className="text-[10px] uppercase font-black text-blue-500 ml-1">Характеристики</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => (
                    <div key={stat} className="bg-black/50 border border-white/5 rounded-xl p-2 text-center">
                      <div className="text-[9px] font-black text-slate-500 mb-1">{stat}</div>
                      <input 
                        type="number" 
                        value={editingChar[stat] || 10} 
                        onChange={e => setEditingChar({...editingChar, [stat]: parseInt(e.target.value) || 0})}
                        className="w-full bg-transparent text-center text-white font-black text-lg outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button onClick={() => setEditingChar(null)} className="flex-1 p-4 bg-white/5 rounded-2xl uppercase text-[10px] font-black hover:bg-white/10 transition-all">Отмена</button>
              <button onClick={() => {
                if (editingChar.type === 'enemy') {
                  setCombatants(prev => [...prev, { ...editingChar, id: Date.now() }].sort((a, b) => b.init - a.init));
                } else {
                  setParty(editingChar.id ? party.map(p => p.id === editingChar.id ? editingChar : p) : [...party, { ...editingChar, id: Date.now() }]);
                }
                setEditingChar(null);
              }} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl uppercase text-[10px] font-black shadow-lg shadow-blue-600/30">Записать</button>
            </div>
          </div>
        </div>
      )}

      {/* ШАПКА / НАВИГАЦИЯ */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-4 items-center justify-between bg-[#0a0f18]/80 border border-white/5 p-3 rounded-[2.5rem] sticky top-4 z-[100] backdrop-blur-xl shadow-2xl">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {[
            {id:'party', icon:User, label:'Отряд'}, 
            {id:'map', icon:Map, label:'Карта'}, 
            {id:'inventory', icon:Backpack, label:'Сумка'},
            {id:'notes', icon:BookOpen, label:'Блокнот'},
            {id:'editor', icon:Edit3, label:'Статы'}
          ].map(t => (
            <button key={t.id} onClick={() => {setActiveTab(t.id); setIsCombat(false);}} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === t.id && !isCombat ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <t.icon size={14}/> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => isCombat ? setIsCombat(false) : startCombat()} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border transition-all ${isCombat ? 'bg-red-600 text-white animate-pulse' : 'border-red-600/30 text-red-500 hover:bg-red-600/10'}`}>
          <Sword size={14}/> {isCombat ? 'Закончить бой' : 'Режим боя'}
        </button>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8 pb-20">
        <div className="lg:col-span-3">
          
          {/* РЕЖИМ БОЯ */}
          {isCombat ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-[3rem] flex justify-between items-center shadow-inner">
                <h2 className="text-white font-black uppercase italic tracking-wider">Ход: {combatants[currentTurn]?.name || "..."}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setEditingChar({name: "Монстр", class: "Враг", hp: 15, max: 15, ac: 12, icon: '👹', type: 'enemy', init: Math.floor(Math.random() * 20) + 1})} className="bg-black/50 border border-white/10 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all">+ Враг</button>
                  <button onClick={() => setCurrentTurn((currentTurn + 1) % combatants.length)} className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">След. ход</button>
                </div>
              </div>
              <div className="grid gap-3">
                {combatants.map((c, i) => (
                  <div key={c.id} className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between ${i === currentTurn ? 'bg-blue-600 border-blue-300 scale-[1.02] text-white shadow-xl shadow-blue-600/20' : 'bg-[#0a0f18]/60 border-white/5 opacity-60'}`}>
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center font-black text-xs">{c.init}</div>
                      <h4 className="font-black uppercase text-sm">{c.icon} {c.name} ({c.hp} HP)</h4>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => updateHP(c.id, -1)} className="bg-black/20 p-3 rounded-xl hover:bg-black/40"><Minus size={14}/></button>
                       <button onClick={() => updateHP(c.id, 1)} className="bg-black/20 p-3 rounded-xl hover:bg-black/40"><Plus size={14}/></button>
                       <button onClick={() => setCombatants(combatants.filter(x => x.id !== c.id))} className="bg-red-900/20 p-3 rounded-xl text-red-500 hover:bg-red-900/40"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              
              {/* ВКЛАДКА: ОТРЯД */}
              {activeTab === 'party' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {party.map(p => (
                    <div key={p.id} className="bg-[#0a0f18]/60 border border-white/5 p-7 rounded-[2.5rem] relative group hover:border-blue-500/30 transition-all shadow-xl">
                      <div className="absolute top-6 right-6 flex gap-2">
                        <button onClick={() => setEditingChar(p)} className="p-2 text-slate-700 hover:text-white transition-colors"><Edit3 size={18}/></button>
                        <button onClick={() => setParty(party.filter(x => x.id !== p.id))} className="p-2 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-4xl shadow-inner">{p.icon}</div>
                        <div>
                          <h3 className="font-black text-white uppercase text-lg leading-tight">{p.name}</h3>
                          <span className="text-[10px] text-blue-500 font-black tracking-widest">{p.class} | AC: {p.ac}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-slate-500">Здоровье</span>
                          <span className="text-blue-400">{p.hp} / {p.max}</span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-blue-600 transition-all duration-700 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{width: `${(p.hp/p.max)*100}%`}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditingChar({name:"", class:"Воин", hp:20, max:20, ac:10, icon:"🛡️"})} className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-700 hover:text-blue-500 hover:bg-blue-500/5 transition-all group">
                    <UserPlus size={40} className="mb-2 group-hover:scale-110 transition-transform"/>
                    <span className="font-black uppercase text-[10px] tracking-widest">Добавить героя</span>
                  </button>
                </div>
              )}

              {/* ВКЛАДКА: СУМКА */}
              {activeTab === 'inventory' && (
                <div className="bg-[#0a0f18]/40 border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                  <div className="flex gap-3 mb-8 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-inner">
                    <input value={inputInv} onChange={e => setInputInv(e.target.value)} className="flex-1 bg-transparent px-4 py-2 outline-none text-white font-medium" placeholder="Название предмета..."/>
                    <button onClick={() => { if(inputInv) {setInventory([...inventory, {id:Date.now(), name:inputInv}]); setInputInv("");} }} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition-all"><PackagePlus size={20} className="text-white"/></button>
                  </div>
                  <div className="grid gap-2">
                    {inventory.map(i => (
                      <div key={i.id} className="bg-black/20 p-5 rounded-2xl flex justify-between items-center border border-white/5 hover:border-white/10 transition-all">
                        <span className="font-black uppercase text-xs tracking-wider text-slate-200">{i.name}</span>
                        <button onClick={() => setInventory(inventory.filter(x => x.id !== i.id))} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ВКЛАДКА: КАРТА */}
              {activeTab === 'map' && (
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-[#0a0f18]/40 border border-white/5 rounded-[3rem] p-6 min-h-[500px] w-full flex items-center justify-center overflow-hidden shadow-2xl relative">
                    {mapImage ? (
                      <img src={mapImage} className="max-w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500" alt="Map" />
                    ) : (
                      <div className="text-center opacity-20 group">
                        <Map size={80} className="mx-auto mb-4 group-hover:scale-110 transition-transform"/>
                        <p className="font-black uppercase text-xs tracking-widest">Карта местности не загружена</p>
                      </div>
                    )}
                  </div>
                  <label className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-2xl text-[10px] font-black uppercase cursor-pointer transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                    Выбрать файл
                    <input type="file" className="hidden" onChange={(e) => e.target.files[0] && setMapImage(URL.createObjectURL(e.target.files[0]))} />
                  </label>
                </div>
              )}

              {/* ВКЛАДКА: БЛОКНОТ (NEW) */}
              {activeTab === 'notes' && (
                <div className="bg-[#0a0f18]/40 border border-white/5 rounded-[3rem] p-8 shadow-2xl animate-in fade-in">
                  <div className="flex items-center gap-3 mb-6 text-blue-500">
                    <BookOpen size={20}/>
                    <h2 className="font-black uppercase text-sm tracking-widest text-white">Дневник приключений</h2>
                  </div>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Здесь можно описывать лор мира, квесты и важные диалоги..."
                    className="w-full h-[500px] bg-black/20 border border-white/5 rounded-[2rem] p-8 text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all resize-none leading-relaxed shadow-inner font-medium"
                  />
                </div>
              )}

              {/* ВКЛАДКА: СТАТЫ (NEW) */}
              {activeTab === 'editor' && (
                <div className="animate-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(stats).map(([name, val]) => (
                      <div key={name} className="bg-[#0a0f18]/60 p-8 rounded-[2.5rem] flex flex-col items-center border border-white/5 shadow-xl hover:border-blue-500/30 transition-all">
                        <span className="uppercase text-[10px] font-black text-blue-500 mb-4 tracking-widest">{name}</span>
                        <div className="flex items-center gap-5">
                          <button onClick={() => updateStat(name, -1)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center font-bold font-mono">-</button>
                          <span className="font-mono text-4xl font-black text-white w-12 text-center">{val}</span>
                          <button onClick={() => updateStat(name, 1)} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center font-bold font-mono">+</button>
                        </div>
                        <span className="text-[10px] mt-4 text-slate-600 font-bold uppercase">Модификатор: {Math.floor((val-10)/2) >= 0 ? '+' : ''}{Math.floor((val-10)/2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: ДАЙСЫ И КАЛЬКУЛЯТОР */}
        <div className="lg:col-span-1">
          <div className="bg-[#0a0f18] border border-blue-900/20 rounded-[3.5rem] p-8 sticky top-28 flex flex-col items-center shadow-2xl">
            
            {/* МИНИ КАЛЬКУЛЯТОР */}
            <div className="w-full mb-6 bg-black/40 p-4 rounded-[2rem] border border-white/5 shadow-inner">
              <div className="bg-black/60 p-3 rounded-xl mb-3 text-right font-mono text-xl text-blue-400 h-12 flex items-center justify-end overflow-hidden border border-white/5">{calcDisplay || "0"}</div>
              <div className="grid grid-cols-4 gap-1">
                {[7, 8, 9, '+', 4, 5, 6, '-', 1, 2, 3, '*', 'C', 0, '=', '/'].map((btn) => (
                  <button key={btn} onClick={() => {
                    if (btn === 'C') setCalcDisplay("");
                    else if (btn === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch { setCalcDisplay("Err"); } }
                    else setCalcDisplay(prev => prev + btn);
                  }} className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-black transition-colors">{btn}</button>
                ))}
              </div>
            </div>

            {/* ГЛАВНЫЙ КУБИК d20 */}
            <div onClick={() => rollDice(20)} className={`w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] flex items-center justify-center cursor-pointer shadow-2xl border border-white/10 transition-all active:scale-90 hover:border-blue-500/50 ${isRolling ? 'animate-bounce' : ''}`}>
              <span className="text-5xl font-black text-white drop-shadow-lg">{isRolling ? '?' : (diceLog[0]?.res || 20)}</span>
            </div>
            
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-4 mb-8">Бросок d20</span>

            {/* ОСТАЛЬНЫЕ КУБИКИ */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {[4, 6, 8, 10, 12, 100].map(d => (
                <button key={d} onClick={() => rollDice(d)} className="py-3 bg-black border border-white/5 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-md">d{d}</button>
              ))}
            </div>

            {/* ЛОГ БРОСКОВ */}
            <div className="w-full mt-8 space-y-2">
              <p className="text-[9px] font-black uppercase text-slate-700 mb-3 border-b border-white/5 pb-1">Последние броски</p>
              {diceLog.map((l, i) => (
                <div key={l.id} className="flex justify-between text-[10px] font-black border-b border-white/5 pb-1 transition-opacity" style={{opacity: 1-i*0.2}}>
                  <span className="text-slate-500 uppercase">{l.s}</span>
                  <span className={l.res === 20 ? "text-yellow-500" : "text-blue-500"}>{l.res}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ЭКРАН СМЕРТИ (КРИТ ПРОВАЛ) */}
      {showGameOver && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-1000">
          <div className="text-center">
            <h1 className="text-6xl md:text-9xl font-serif text-red-700 tracking-[0.3em] uppercase animate-pulse drop-shadow-[0_0_30px_rgba(185,28,28,0.5)]">YOU DIED</h1>
            <p className="text-red-900 font-black uppercase tracking-widest mt-4 opacity-50">Критический провал d20</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;