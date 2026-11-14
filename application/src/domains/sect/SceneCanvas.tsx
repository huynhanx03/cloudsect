import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SceneLifecycle, SceneProjection, SectScene } from '../../scene/runtime/types';
import { useAppStore } from '../../app/store';
import '../../shared/styles/sect.css';

export function SceneCanvas({ projection, onSelectSession, onFocusIsland }: {
  projection: SceneProjection;
  onSelectSession: (id: string) => void;
  onFocusIsland: (id: string) => void;
}) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SectScene | null>(null);
  const projectionRef = useRef(projection);
  const [failed, setFailed] = useState(false);
  const prefs = useAppStore((state) => state.snapshot?.preferences);
  const view = useAppStore((state) => state.view);
  const lifecycle: SceneLifecycle | null = useMemo(() => prefs ? {
    active: !document.hidden && view === 'sect',
    motion: prefs.motion === 'full' || (prefs.motion === 'system' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    mode: 'full',
    quality: prefs.quality,
    theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  } : null, [prefs, view]);
  const lifecycleRef = useRef<SceneLifecycle>(lifecycle ?? { active: true, motion: true, mode: 'full', quality: 'auto', theme: 'light' });
  const selectSessionRef = useRef(onSelectSession);
  const focusIslandRef = useRef(onFocusIsland);

  useEffect(() => {
    projectionRef.current = projection;
    selectSessionRef.current = onSelectSession;
    focusIslandRef.current = onFocusIsland;
    if (lifecycle) lifecycleRef.current = lifecycle;
  }, [lifecycle, projection, onFocusIsland, onSelectSession]);

  useEffect(() => {
    let canceled = false;
    let scene: SectScene | null = null;
    const host = hostRef.current;
    if (!host) return undefined;
    void import('../../scene/runtime/create-sect-scene').then(({ createSectScene }) => {
      if (canceled) return;
      try {
        scene = createSectScene(host, {
          onSelectSession: (id) => selectSessionRef.current(id),
          onFocusIsland: (id) => focusIslandRef.current(id),
          onFailure: () => setFailed(true),
        });
        sceneRef.current = scene;
        scene.update(projectionRef.current);
        scene.setLifecycle(lifecycleRef.current);
      } catch { setFailed(true); }
    }).catch(() => setFailed(true));
    return () => { canceled = true; scene?.dispose(); sceneRef.current = null; };
  }, []);

  useEffect(() => { sceneRef.current?.update(projection); }, [projection]);
  useEffect(() => {
    let visible = !document.hidden;
    const updateVisible = () => {
      visible = !document.hidden;
      syncLifecycle();
    };
    const syncLifecycle = () => {
      if (!prefs) return;
      lifecycleRef.current = { ...lifecycleRef.current, active: visible && view === 'sect', theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light' };
      sceneRef.current?.setLifecycle(lifecycleRef.current);
    };
    document.addEventListener('visibilitychange', updateVisible);
    syncLifecycle();
    return () => document.removeEventListener('visibilitychange', updateVisible);
  }, [prefs, view]);

  return <div className="scene-shell">
    <div className="scene-top-glow" aria-hidden="true" />
    {!failed && <div className="scene-canvas-host" ref={hostRef} role="img" aria-label={t('sceneAria')} />}
    {failed && <div className="scene-fallback"><span>CloudSect</span><p>{t('sceneFallback')}</p></div>}
  </div>;
}
