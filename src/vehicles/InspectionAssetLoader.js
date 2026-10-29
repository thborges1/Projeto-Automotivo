/** Decoder setup and model parsing are imported only for an explicitly configured detail asset. */
export class InspectionAssetLoader {
  constructor(engine, baseURL = '/') {
    Object.assign(this, { engine, baseURL });
    this.disposed = false;
  }

  async getLoader() {
    if (this.disposed) throw new Error('Carregador de inspeção encerrado.');
    if (this.engine.fleet?.loader) return this.engine.fleet.loader;
    this.pendingLoader ??= this.createLoader();
    return this.pendingLoader;
  }

  async createLoader() {
    const [{ GLTFLoader }, { DRACOLoader }, { KTX2Loader }] = await Promise.all([
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/loaders/DRACOLoader.js'),
      import('three/addons/loaders/KTX2Loader.js'),
    ]);
    if (this.disposed) throw new Error('Carregamento cancelado.');
    this.draco = new DRACOLoader().setDecoderPath(`${this.baseURL}decoders/draco/`).setWorkerLimit(2);
    this.ktx2 = new KTX2Loader()
      .setTranscoderPath(`${this.baseURL}decoders/basis/`)
      .setWorkerLimit(2)
      .detectSupport(this.engine.renderer);
    return new GLTFLoader().setDRACOLoader(this.draco).setKTX2Loader(this.ktx2);
  }

  async load(path, signal) {
    const url = new URL(path, new URL(this.baseURL, document.baseURI));
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Falha no modelo de inspeção (${response.status}): ${url}`);
    const buffer = await response.arrayBuffer();
    signal.throwIfAborted();
    const loader = await this.getLoader();
    signal.throwIfAborted();
    const gltf = await loader.parseAsync(buffer, new URL('.', url).href);
    return gltf.scene;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.draco?.dispose();
    this.ktx2?.dispose();
    this.pendingLoader = null;
  }
}
