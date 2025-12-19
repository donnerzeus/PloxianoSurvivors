import { useEffect, useRef, useState } from 'react'
import { GameApp } from './game/GameApp'
import { LogIn, Play, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CHARACTERS } from './game/data/characters'

function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<GameApp | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'lobby'>('menu')
  const [username, setUsername] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState('gunner')
  const [isLevelingUp, setIsLevelingUp] = useState(false)
  const [stats, setStats] = useState({ level: 1, xp: 0, xpToNext: 100 })
  const [timer, setTimer] = useState(0)
  const [upgrades, setUpgrades] = useState<any[]>([])
  const [inventory, setInventory] = useState({ active: [] as any[], passive: [] as any[] })
  const [isPausedManually, setIsPausedManually] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current && !gameRef.current) {
      const handleLevelUp = () => {
        if (gameRef.current) {
          gameRef.current.paused = true
          setUpgrades(gameRef.current.getRandomUpgrades(3))
          setIsLevelingUp(true)
          setStats({ ...gameRef.current.stats })
        }
      }

      const handleGameOver = () => {
        setIsGameOver(true)
      }

      const game = new GameApp(selectedCharacter, handleLevelUp, handleGameOver)
      game.init(canvasRef.current).then(() => {
        gameRef.current = game
      })

      const interval = setInterval(() => {
        if (gameRef.current) {
          setStats({ ...gameRef.current.stats })
          setTimer(gameRef.current.getGameTime())
          setInventory({
            active: [...gameRef.current.inventory.active],
            passive: [...gameRef.current.inventory.passive]
          })
        }
      }, 100)

      return () => {
        clearInterval(interval)
        if (gameRef.current) {
          gameRef.current.destroy()
          gameRef.current = null
        }
      }
    }
  }, [gameState])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing' && e.key.toLowerCase() === 'p' && !isLevelingUp) {
        if (gameRef.current) {
          const newState = !gameRef.current.paused
          gameRef.current.paused = newState
          setIsPausedManually(newState)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, isLevelingUp])

  const handleUpgrade = (skillId: string) => {
    if (gameRef.current) {
      gameRef.current.applyUpgrade(skillId)
      gameRef.current.paused = false
    }
    setIsLevelingUp(false)
  }

  const handleResume = () => {
    if (gameRef.current) {
      gameRef.current.paused = false
      setIsPausedManually(false)
    }
  }

  const handleQuit = () => {
    setGameState('menu')
    setIsPausedManually(false)
    if (gameRef.current) {
      gameRef.current.destroy()
      gameRef.current = null
    }
  }

  const handleStartGame = () => {
    if (username.trim()) {
      setIsGameOver(false)
      setGameState('playing')
    }
  }

  return (
    <div className="game-container">
      {gameState === 'playing' ? (
        <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="glass p-8 flex flex-col items-center gap-6 ui-interactive"
            style={{ padding: '3rem', minWidth: '800px' }}
          >
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>
              PLOXIANO SURVIVORS
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem', width: '100%' }}>
              <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <LogIn size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 12px 14px 42px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '1.1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>SELECT CHARACTER</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {Object.values(CHARACTERS).map(char => (
                      <button
                        key={char.id}
                        onClick={() => setSelectedCharacter(char.id)}
                        className="glass"
                        style={{
                          padding: '12px',
                          border: selectedCharacter === char.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                          background: selectedCharacter === char.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ width: '12px', height: '12px', background: `#${char.color.toString(16).padStart(6, '0')}`, borderRadius: '2px' }} />
                        <span style={{ fontSize: '0.9rem' }}>{char.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  className="primary-btn"
                  disabled={!username.trim()}
                  style={{ opacity: username.trim() ? 1 : 0.5, marginTop: '2rem', padding: '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Play size={24} />
                    <span style={{ fontSize: '1.25rem' }}>START RUN</span>
                  </div>
                </button>
              </div>

              <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{CHARACTERS[selectedCharacter].name}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{CHARACTERS[selectedCharacter].description}</p>

                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '4px' }}>ÖZEL YETENEK</p>
                  <p style={{ fontWeight: 600, color: 'white' }}>{CHARACTERS[selectedCharacter].trait.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{CHARACTERS[selectedCharacter].trait.description}</p>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(CHARACTERS[selectedCharacter].stats).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>{key}</span>
                        <span style={{ fontSize: '0.8rem', color: 'white' }}>{val}</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (val / 500) * 100)}%` }}
                          style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Overlay UI when playing */}
      {gameState === 'playing' && (
        <div className="ui-layer">
          {/* Top Timer */}
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="glass" style={{ padding: '8px 24px', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-main)', border: '1px solid var(--primary)' }}>
              {Math.floor(timer / 60).toString().padStart(2, '0')}:{Math.floor(timer % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="glass" style={{ padding: '10px 20px', display: 'inline-block' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>LVL {stats.level}</span>
              <div style={{ width: '300px', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginTop: '6px', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }}
                  style={{ height: '100%', background: 'linear-gradient(to right, var(--primary), #818cf8)' }}
                />
              </div>
            </div>
          </div>

          {/* Inventory (Top Right) */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={`act-${i}`} className="glass" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: inventory.active[i] ? 'var(--primary)' : 'rgba(255,255,255,0.05)', position: 'relative' }}>
                  {inventory.active[i] && (
                    <>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{inventory.active[i].name[0]}</span>
                      <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '0.6rem', color: 'var(--primary)' }}>L{inventory.active[i].level}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={`pas-${i}`} className="glass" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', borderColor: inventory.passive[i] ? 'var(--gold)' : 'rgba(255,255,255,0.05)', position: 'relative' }}>
                  {inventory.passive[i] && (
                    <>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{inventory.passive[i].name[0]}</span>
                      <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '0.6rem', color: 'var(--gold)' }}>L{inventory.passive[i].level}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {(isLevelingUp || isPausedManually) && (
              <div className="ui-layer ui-interactive" style={{
                background: 'rgba(5, 5, 10, 0.9)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                zIndex: 100
              }}>
                {isPausedManually ? (
                  <div style={{ display: 'flex', width: '90%', maxWidth: '1200px', gap: '40px' }}>
                    {/* Left: Main Menu */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px', justifyContent: 'center', alignItems: 'center' }}>
                      <h1 style={{ fontSize: '4rem', color: 'var(--primary)', textShadow: '0 0 20px var(--primary)' }}>PAUSED</h1>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={handleResume} className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.2rem' }}>DEVAM ET</button>
                        <button onClick={handleQuit} className="btn btn-secondary" style={{ padding: '15px 40px', fontSize: '1.2rem', color: '#f43f5e', borderColor: '#f43f5e' }}>PES ET</button>
                      </div>
                    </div>

                    {/* Right: Detailed Info */}
                    <div className="glass" style={{ width: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
                      <div>
                        <h2 style={{ color: 'var(--gold)', marginBottom: '16px', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '8px' }}>ENVANTER</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>AKTİF SİLAHLAR</h3>
                          {inventory.active.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', borderLeft: s.isEvolved ? '4px solid #a21caf' : 'none' }}>
                              <span style={{ color: s.isEvolved ? '#d8b4fe' : 'white' }}>{s.name} {s.isEvolved && '✨'}</span>
                              <span style={{ color: 'var(--primary)' }}>{s.isEvolved ? 'MAX' : `LVL ${s.level}`}</span>
                            </div>
                          ))}
                          {inventory.active.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Henüz aktif silah yok</span>}

                          <h3 style={{ fontSize: '0.9rem', color: 'var(--gold)', marginTop: '12px' }}>PASİF GELİŞTİRMELER</h3>
                          {inventory.passive.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                              <span>{s.name}</span>
                              <span style={{ color: 'var(--gold)' }}>LVL {s.level}</span>
                            </div>
                          ))}
                          {inventory.passive.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Henüz pasif geliştirme yok</span>}
                        </div>
                      </div>

                      <div>
                        <h2 style={{ color: 'var(--accent)', marginBottom: '16px', borderBottom: '1px solid rgba(244,63,94,0.2)', paddingBottom: '8px' }}>İSTATİSTİKLER</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="glass" style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SEVİYE</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.level}</div>
                          </div>
                          <div className="glass" style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SÜRE</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{Math.floor(timer / 60)}:{Math.floor(timer % 60).toString().padStart(2, '0')}</div>
                          </div>
                          <div className="glass" style={{ padding: '10px', textAlign: 'center', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TECRÜBE</div>
                            <div style={{ fontSize: '1rem' }}>{stats.xp} / {stats.xpToNext}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', perspective: '1000px' }}>
                    <motion.h2
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="floating"
                      style={{ fontSize: '4rem', color: 'var(--gold)', marginBottom: '50px', textShadow: '0 10px 40px rgba(245, 158, 11, 0.4)', fontWeight: 800 }}
                    >
                      LEVEL UP!
                    </motion.h2>

                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                      {upgrades.map((upgrade, idx) => (
                        <motion.button
                          key={upgrade.id}
                          initial={{ y: 50, opacity: 0, rotateY: -20 }}
                          animate={{ y: 0, opacity: 1, rotateY: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.4 }}
                          whileHover={{ y: -10, scale: 1.05 }}
                          onClick={() => handleUpgrade(upgrade.id)}
                          className={`glass-premium ${upgrade.id.endsWith('_evo') ? 'glow-purple' : (upgrade.type === 'active' ? 'glow-blue' : 'glow-gold')}`}
                          style={{
                            width: '240px',
                            minHeight: '340px',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            background: upgrade.id.endsWith('_evo') ? 'rgba(162, 28, 175, 0.15)' : (upgrade.type === 'active' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                            padding: '24px',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)'
                          }}>
                            {upgrade.type === 'active' ? <Play size={40} color={upgrade.id.endsWith('_evo') ? '#d8b4fe' : '#6366f1'} /> : <Settings size={40} color="#f59e0b" />}
                          </div>
                          <h3 style={{ fontSize: '1.4rem', color: upgrade.id.endsWith('_evo') ? '#d8b4fe' : 'white', fontWeight: 700 }}>{upgrade.name}</h3>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{upgrade.description}</p>
                          <div style={{
                            marginTop: 'auto',
                            fontSize: '0.8rem',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            background: upgrade.id.endsWith('_evo') ? '#a21caf' : (upgrade.type === 'active' ? 'var(--primary)' : 'var(--gold)'),
                            color: 'white',
                            fontWeight: 800,
                            letterSpacing: '1px'
                          }}>
                            {upgrade.id.endsWith('_evo') ? 'EVRİM' : upgrade.type.toUpperCase()}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isGameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2000,
                  textAlign: 'center'
                }}
              >
                <div className="floating">
                  <motion.h1
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ fontSize: '6rem', color: 'var(--accent)', fontWeight: 800, textShadow: '0 0 50px rgba(244, 63, 94, 0.5)', marginBottom: '10px' }}
                  >
                    ELENDİN!
                  </motion.h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', marginBottom: '40px' }}>
                  Level {stats.level} — {Math.floor(timer)} Saniye Hayatta Kaldın
                </p>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsGameOver(false)
                      handleQuit()
                      setTimeout(() => handleStartGame(), 100)
                    }}
                    className="primary-btn glow-blue"
                    style={{ padding: '16px 48px', fontSize: '1.2rem' }}
                  >
                    TEKRAR DENE
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsGameOver(false)
                      handleQuit()
                    }}
                    className="glass"
                    style={{ padding: '16px 48px', fontSize: '1.2rem', color: 'white' }}
                  >
                    ANA MENÜ
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default App
