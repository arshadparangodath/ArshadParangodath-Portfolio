const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

// Compile the actual TypeScript modules in memory; substitute only external I/O.
function load(relative, mocks = {}, cache = new Map()) {
  const filename = path.resolve(__dirname, '..', relative)
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }
  cache.set(filename, module)
  const requireHere = createRequire(filename)
  const requireMock = (id) => {
    if (id in mocks) return mocks[id]
    if (id.startsWith('.')) {
      const target = path.resolve(path.dirname(filename), id + '.ts')
      return load(path.relative(path.resolve(__dirname, '..'), target), mocks, cache)
    }
    return requireHere(id)
  }
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  new Function('require', 'module', 'exports', outputText)(requireMock, module, module.exports)
  return module.exports
}
const { groupBlobAssets, matchBlobProject, mergeBlobProject } = load('src/data/blobImport.ts')
const root = 'Assets/Projects/'
const asset = (name) => ({ pathname: root + name, url: 'https://store.example/' + name })
const files = [asset('Healine/UI/10.png'), asset('Healine/UI/2.png'), asset('Healine/Motion/cover.gif'),
  asset('Healine/Branding/1.jpg'), asset('TitanX_Branding/thumbnail.mp4'), asset('TitanX_Branding/10.jpg'),
  asset('TitanX_Branding/._junk.jpg'), asset('TitanX_Branding/readme.txt'), asset('TitanX_Branding/.DS_Store')]

test('top-level grouping combines nested media, filters non-media, selects animated covers', () => {
  const groups = groupBlobAssets([...files, files[0]], root, false)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].gallery.length, 4)
  assert.equal(groups[0].gallery.find((m) => m.isCover).type, 'gif')
  assert.equal(groups[1].title, 'Titan X Branding')
  assert.equal(groups[1].gallery.find((m) => m.isCover).type, 'video')
})
test('split grouping finds three Healine works; natural sort; single project prefix', () => {
  const split = groupBlobAssets(files, root, true)
  assert.equal(split.length, 4)
  const ui = split.find((c) => c.folder.endsWith('/UI/'))
  assert.match(ui.title, /Healine — UI/)
  assert.match(ui.gallery[0].url, /2.png$/)
  assert.equal(groupBlobAssets(files, root + 'Healine/UI/', false)[0].gallery.length, 2)
  assert.deepEqual(groupBlobAssets(files, 'Other/', false), [])
})
test('existing project matching, repeat imports, legacy cover and editorial preservation', () => {
  const candidate = groupBlobAssets(files, root, false)[1]
  const existing = { id: 'custom', title: 'My title', summary: 'My copy', blobFolder: candidate.folder,
    gallery: [{ type: 'image', url: '/custom-cover.png', isCover: true }] }
  assert.equal(matchBlobProject(candidate, [existing]), existing)
  const merged = mergeBlobProject(existing, candidate)
  assert.equal(merged.title, existing.title)
  assert.equal(merged.summary, existing.summary)
  for (const [key, value] of Object.entries(existing.gallery[0])) assert.equal(merged.gallery[0][key], value)
  assert.equal(mergeBlobProject(merged, candidate).gallery.length, merged.gallery.length)
  const legacy = mergeBlobProject({ id: 'legacy', thumb: '/old.gif' }, candidate)
  assert.equal(mergeBlobProject({ id: 'old-format', gallery: ['/old.gif'] }, candidate).gallery[0].type, 'gif')
  assert.equal(legacy.gallery[0].url, '/old.gif')
  assert(legacy.gallery[0].isCover)
  assert.equal(matchBlobProject(candidate, [{ id: 'a', gallery: candidate.gallery }]).id, 'a')
  assert.equal(matchBlobProject(candidate, [{ id: 'a', gallery: candidate.gallery }, { id: 'b', gallery: candidate.gallery }]), undefined)
})

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v }, status(s) { this.code = s; return this }, json(body) { this.body = body; return this } }
}
test('inventory endpoint enforces authentication, validates prefix, forwards pagination and filters files', async () => {
  const previous = { ADMIN_PASS: process.env.ADMIN_PASS, BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN }
  process.env.ADMIN_PASS = 'test-pass'; process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  let called = 0
  const handler = load('api/blob-assets.ts', { '@vercel/blob': { list: async (options) => {
    called++; assert.equal(options.prefix, root); assert.equal(options.cursor, 'page-two')
    return { blobs: files, hasMore: true, cursor: 'page-three' }
  } } }).default
  try {
    const unauthorized = response(); await handler({ method: 'GET', headers: {}, query: {} }, unauthorized)
    assert.equal(unauthorized.code, 401); assert.equal(called, 0)
    const invalid = response(); await handler({ method: 'GET', headers: { 'x-admin-token': 'test-pass' }, query: { prefix: '../' } }, invalid)
    assert.equal(invalid.code, 400); assert.equal(called, 0)
    const ok = response(); await handler({ method: 'GET', headers: { 'x-admin-token': 'test-pass' }, query: { prefix: 'Assets/Projects', cursor: 'page-two' } }, ok)
    assert.equal(ok.code, 200); assert.equal(ok.body.files.length, 6); assert.equal(ok.body.cursor, 'page-three')
    assert.equal(ok.headers['Cache-Control'], 'no-store')
    const wrongMethod = response(); await handler({ method: 'POST' }, wrongMethod); assert.equal(wrongMethod.code, 405)
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
})

test('batch import preserves existing projects, avoids ID collisions and stays unchanged after failed save', async () => {
  const originalFetch = global.fetch
  let fail = false, writes = []
  const original = { id: 'titan-x-branding', title: 'Existing work', gallery: [] }
  global.fetch = async (_url, options = {}) => {
    if (options.method === 'POST') {
      writes.push(JSON.parse(options.body))
      return { ok: !fail, json: async () => ({ error: 'Test save failed' }) }
    }
    return { ok: true, json: async () => [original] }
  }
  const store = load('src/data/projectStore.ts', { '../lib/adminAuth': { getAdminToken: () => 'test' } })
  const candidate = groupBlobAssets(files, root, false)[1]
  try {
    await store.importBlobProjects([{ candidate, targetId: null }])
    assert.equal(store.getProjects().length, 2)
    assert.equal(store.getProjects()[1].id, 'titan-x-branding-2')
    assert.equal(writes.length, 1)
    const id = store.getProjects()[1].id
    await store.importBlobProjects([{ candidate, targetId: id }])
    assert.equal(store.getProjects().length, 2)
    assert.equal(store.getProjects()[1].gallery.length, 2)
    fail = true
    const before = JSON.stringify(store.getProjects())
    await assert.rejects(store.importBlobProjects([{ candidate: { ...candidate, folder: 'New/', title: 'New' }, targetId: null }]), /Test save failed/)
    assert.equal(JSON.stringify(store.getProjects()), before)
    await assert.rejects(store.importBlobProjects([{ candidate, targetId: id }, { candidate: { ...candidate, folder: 'Other/' }, targetId: id }]), /different existing project/)
  } finally { global.fetch = originalFetch }
})

test('empty database stays empty; initial load failure blocks batch writes', async () => {
  const originalFetch = global.fetch
  try {
    global.fetch = async () => ({ ok: true, json: async () => [] })
    const empty = load('src/data/projectStore.ts')
    await new Promise((r) => setImmediate(r))
    assert.deepEqual(empty.getProjects(), [])
    let writes = 0
    global.fetch = async (_url, opts = {}) => { if (opts.method === 'POST') writes++; return { ok: false, json: async () => ({}) } }
    const failed = load('src/data/projectStore.ts')
    await assert.rejects(failed.importBlobProjects([{ candidate: groupBlobAssets(files, root, false)[0], targetId: null }]), /Could not load/)
    assert.equal(writes, 0)
  } finally { global.fetch = originalFetch }
})
