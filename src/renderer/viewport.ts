/** L3-021: PixiJS exclusively owns the render host canvas; no UI framework imports. */
import { Application, Graphics } from 'pixi.js';

export interface RendererMount {
  readonly canvas: HTMLCanvasElement;
  readonly destroy: () => void;
}

export async function mountRendererViewport(host: HTMLElement): Promise<RendererMount> {
  const app = new Application();
  try {
    await app.init({
      preference: 'webgl',
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
    });

    // Renderer API proof only. No mannequin, fighter, combat or character artwork.
    const marker = new Graphics();
    marker.circle(0, 0, 7).fill({ color: 0xd8b676, alpha: 0.95 });
    marker.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(marker);
    const reposition = () => marker.position.set(app.screen.width / 2, app.screen.height / 2);
    app.renderer.on('resize', reposition);
    app.stop();

    const canvas = app.canvas;
    canvas.dataset.boundaryRenderer = 'pixijs';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    host.dataset.rendererMounted = 'true';
    app.renderer.render(app.stage);
    let destroyed = false;
    return {
      canvas,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        app.renderer.off('resize', reposition);
        app.destroy(true, { children: true });
        canvas.remove();
        delete host.dataset.rendererMounted;
      },
    };
  } catch (error) {
    try { app.destroy(true, { children: true }); } catch { /* Initialization may be incomplete. */ }
    throw error;
  }
}
