"""Convert Celestia binary .cmod and .3ds models into a compact mesh format.

Output layout (little endian):
  'MSH2' | uint32 headerLen | header JSON (utf-8, padded to 4) | binary blob
Header: { vcount, icount, radius, hasUV, hasNormal, groups:[{start,count,mat}],
          materials:[{diffuse,opacity,emissive,texture,blend}], offsets:{pos,nrm,uv,idx}, idx32 }
Positions are int16 normalised to the bounding radius, normals int8, uvs uint16 (0..65535 -> 0..1,
wrapped uvs are rescaled by 'uvRange'), indices uint16 or uint32.
"""
import json, math, struct, sys
import numpy as np

T_MATERIAL, T_ENDMAT, T_DIFFUSE, T_SPEC, T_SPECPOW, T_OPACITY, T_TEXTURE = 1001, 1002, 1003, 1004, 1005, 1006, 1007
T_MESH, T_ENDMESH, T_VDESC, T_ENDVDESC, T_VERTICES, T_EMISSIVE, T_BLEND = 1009, 1010, 1011, 1012, 1013, 1014, 1015
FMT_SIZE = {0: 4, 1: 8, 2: 12, 3: 16, 4: 4}


class Reader:
    def __init__(self, data):
        self.d, self.p = data, 0

    def i16(self):
        v = struct.unpack_from('<h', self.d, self.p)[0]; self.p += 2; return v

    def u16(self):
        v = struct.unpack_from('<H', self.d, self.p)[0]; self.p += 2; return v

    def u32(self):
        v = struct.unpack_from('<I', self.d, self.p)[0]; self.p += 4; return v

    def f32(self, n=1):
        v = struct.unpack_from('<%df' % n, self.d, self.p); self.p += 4 * n; return v

    def eof(self):
        return self.p >= len(self.d)


def read_cmod(path):
    data = open(path, 'rb').read()
    assert data[:16] == b'#celmodel_binary', path
    r = Reader(data); r.p = 16
    materials, meshes = [], []
    while not r.eof():
        tok = r.i16()
        if tok == T_MATERIAL:
            m = {'diffuse': [0.8, 0.8, 0.8], 'opacity': 1.0, 'emissive': [0, 0, 0], 'texture': None, 'blend': 0}
            while True:
                t = r.i16()
                if t == T_ENDMAT:
                    break
                if t in (T_DIFFUSE, T_SPEC, T_EMISSIVE):
                    assert r.i16() == 7
                    c = list(r.f32(3))
                    if t == T_DIFFUSE: m['diffuse'] = c
                    if t == T_EMISSIVE: m['emissive'] = c
                elif t in (T_SPECPOW, T_OPACITY):
                    assert r.i16() == 1
                    v = r.f32()[0]
                    if t == T_OPACITY: m['opacity'] = v
                elif t == T_BLEND:
                    m['blend'] = r.i16()
                elif t == T_TEXTURE:
                    sem = r.i16()
                    assert r.i16() == 5
                    n = r.u16(); name = data[r.p:r.p + n].decode('latin1'); r.p += n
                    if sem == 0: m['texture'] = name
                else:
                    raise ValueError('bad material token %d in %s' % (t, path))
            materials.append(m)
        elif tok == T_MESH:
            assert r.i16() == T_VDESC
            attrs, stride = [], 0
            while True:
                sem = r.i16()
                if sem == T_ENDVDESC:
                    break
                fmt = r.i16()
                attrs.append((sem, fmt, stride)); stride += FMT_SIZE[fmt]
            assert r.i16() == T_VERTICES
            n = r.u32()
            raw = np.frombuffer(data, dtype=np.uint8, count=n * stride, offset=r.p).reshape(n, stride)
            r.p += n * stride
            def attr(sem, comps):
                for s, f, off in attrs:
                    if s == sem:
                        return raw[:, off:off + 4 * comps].copy().view('<f4').reshape(n, comps)
                return None
            pos, nrm, uv = attr(0, 3), attr(3, 3), attr(5, 2)
            groups = []
            while True:
                t = r.i16()
                if t == T_ENDMESH:
                    break
                ptype = t
                mat = r.u32(); cnt = r.u32()
                idx = np.frombuffer(data, dtype='<u4', count=cnt, offset=r.p).astype(np.int64); r.p += 4 * cnt
                if ptype == 0:
                    tri = idx
                elif ptype == 1:  # strip
                    tris = []
                    for k in range(cnt - 2):
                        a, b, c = idx[k], idx[k + 1], idx[k + 2]
                        tris += ([a, b, c] if k % 2 == 0 else [b, a, c])
                    tri = np.array(tris, dtype=np.int64)
                elif ptype == 2:  # fan
                    tris = []
                    for k in range(1, cnt - 1):
                        tris += [idx[0], idx[k], idx[k + 1]]
                    tri = np.array(tris, dtype=np.int64)
                else:
                    continue  # lines / points are not useful here
                groups.append((mat, tri))
            meshes.append((pos, nrm, uv, groups))
        else:
            raise ValueError('bad token %d at %d in %s' % (tok, r.p, path))
    return materials, meshes


def read_3ds(path):
    data = open(path, 'rb').read()
    objs, mats = [], []

    def chunks(start, end):
        p = start
        while p + 6 <= end:
            cid, ln = struct.unpack_from('<HI', data, p)
            if ln < 6: break
            yield cid, p + 6, p + ln
            p += ln

    def cstr(p):
        e = data.index(b'\0', p); return data[p:e].decode('latin1'), e + 1

    def color(s, e):
        for cid, a, b in chunks(s, e):
            if cid == 0x0011: return [data[a] / 255, data[a + 1] / 255, data[a + 2] / 255]
            if cid == 0x0010: return list(struct.unpack_from('<3f', data, a))
        return [0.8, 0.8, 0.8]

    def walk(s, e):
        for cid, a, b in chunks(s, e):
            if cid in (0x4D4D, 0x3D3D):
                walk(a, b)
            elif cid == 0xAFFF:
                m = {'name': '', 'diffuse': [0.8, 0.8, 0.8], 'opacity': 1.0, 'emissive': [0, 0, 0], 'texture': None, 'blend': 0}
                for c2, a2, b2 in chunks(a, b):
                    if c2 == 0xA000: m['name'] = cstr(a2)[0]
                    if c2 == 0xA020: m['diffuse'] = color(a2, b2)
                    if c2 == 0xA200:
                        for c3, a3, b3 in chunks(a2, b2):
                            if c3 == 0xA300: m['texture'] = cstr(a3)[0]
                mats.append(m)
            elif cid == 0x4000:
                name, p = cstr(a)
                for c2, a2, b2 in chunks(p, b):
                    if c2 != 0x4100: continue
                    o = {'name': name, 'pos': None, 'uv': None, 'faces': None, 'fmat': []}
                    for c3, a3, b3 in chunks(a2, b2):
                        if c3 == 0x4110:
                            n = struct.unpack_from('<H', data, a3)[0]
                            o['pos'] = np.frombuffer(data, '<f4', n * 3, a3 + 2).reshape(n, 3).copy()
                        elif c3 == 0x4140:
                            n = struct.unpack_from('<H', data, a3)[0]
                            o['uv'] = np.frombuffer(data, '<f4', n * 2, a3 + 2).reshape(n, 2).copy()
                        elif c3 == 0x4120:
                            n = struct.unpack_from('<H', data, a3)[0]
                            f = np.frombuffer(data, '<u2', n * 4, a3 + 2).reshape(n, 4)[:, :3].astype(np.int64)
                            o['faces'] = f
                            for c4, a4, b4 in chunks(a3 + 2 + n * 8, b3):
                                if c4 == 0x4130:
                                    mn, p4 = cstr(a4)
                                    k = struct.unpack_from('<H', data, p4)[0]
                                    o['fmat'].append((mn, np.frombuffer(data, '<u2', k, p4 + 2).astype(np.int64)))
                    if o['pos'] is not None and o['faces'] is not None:
                        objs.append(o)
    walk(0, len(data))
    names = {m['name']: i for i, m in enumerate(mats)}
    if not mats:
        mats.append({'name': 'default', 'diffuse': [0.8, 0.8, 0.8], 'opacity': 1, 'emissive': [0, 0, 0], 'texture': None, 'blend': 0})
    meshes = []
    for o in objs:
        groups = []
        if o['fmat']:
            for mn, fi in o['fmat']:
                groups.append((names.get(mn, 0), o['faces'][fi].reshape(-1)))
        else:
            groups.append((0, o['faces'].reshape(-1)))
        meshes.append((o['pos'], None, o['uv'], groups))
    return mats, meshes


def compute_normals(pos, tri):
    n = np.zeros_like(pos)
    t = tri.reshape(-1, 3)
    fn = np.cross(pos[t[:, 1]] - pos[t[:, 0]], pos[t[:, 2]] - pos[t[:, 0]])
    for k in range(3):
        np.add.at(n, t[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return n / l


def merge(materials, meshes):
    P, N, U, groups = [], [], [], []
    base = 0
    for pos, nrm, uv, gs in meshes:
        allidx = np.concatenate([g[1] for g in gs]) if gs else np.zeros(0, np.int64)
        if nrm is None:
            nrm = compute_normals(pos, allidx)
        if uv is None:
            uv = np.zeros((len(pos), 2), np.float32)
        P.append(pos); N.append(nrm); U.append(uv)
        for mat, idx in gs:
            groups.append((mat, idx + base))
        base += len(pos)
    P, N, U = np.concatenate(P), np.concatenate(N), np.concatenate(U)
    # merge groups sharing a material
    bymat = {}
    for mat, idx in groups:
        bymat.setdefault(mat, []).append(idx)
    return P, N, U, [(m, np.concatenate(v)) for m, v in sorted(bymat.items())]


def write_mesh(out, materials, P, N, U, groups, swap_yz=False, rename_tex=None):
    if swap_yz:
        P = P[:, [0, 2, 1]] * np.array([1, 1, -1]); N = N[:, [0, 2, 1]] * np.array([1, 1, -1])
    # only keep referenced vertices
    used = np.unique(np.concatenate([g[1] for g in groups]))
    remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    P, N, U = P[used], N[used], U[used]
    groups = [(m, remap[i]) for m, i in groups]
    radius = float(np.max(np.linalg.norm(P, axis=1))) or 1.0
    q_pos = np.clip(np.round(P / radius * 32767), -32767, 32767).astype('<i2')
    nl = np.linalg.norm(N, axis=1, keepdims=True); nl[nl == 0] = 1
    q_nrm = np.clip(np.round(N / nl * 127), -127, 127).astype('i1')
    umin = U.min(axis=0) if len(U) else np.zeros(2); umax = U.max(axis=0) if len(U) else np.ones(2)
    span = np.maximum(umax - umin, 1e-9)
    q_uv = np.clip(np.round((U - umin) / span * 65535), 0, 65535).astype('<u2')
    idx = np.concatenate([g[1] for g in groups])
    idx32 = len(P) > 65535
    q_idx = idx.astype('<u4' if idx32 else '<u2')
    has_uv = bool(np.any(U != 0))
    blob = bytearray()
    def add(arr):
        off = len(blob); blob.extend(arr.tobytes())
        while len(blob) % 4: blob.append(0)
        return off
    offs = {'pos': add(q_pos), 'nrm': add(q_nrm)}
    if has_uv: offs['uv'] = add(q_uv)
    offs['idx'] = add(q_idx)
    gl, start = [], 0
    used_mats = {}
    for m, ix in groups:
        mat = materials[m] if m < len(materials) else materials[0]
        key = id(mat)
        if key not in used_mats:
            tex = mat.get('texture')
            if tex and rename_tex: tex = rename_tex(tex)
            used_mats[key] = len(used_mats)
            gl_mat = {'diffuse': [round(c, 3) for c in mat['diffuse']], 'opacity': round(mat['opacity'], 3),
                      'emissive': [round(c, 3) for c in mat['emissive']], 'texture': tex}
            used_mats[key] = (len(used_mats) - 1, gl_mat)
        gl.append({'start': start, 'count': int(len(ix)), 'mat': used_mats[key][0]})
        start += len(ix)
    mats_out = [v[1] for v in sorted(used_mats.values(), key=lambda v: v[0])]
    header = {'vcount': int(len(P)), 'icount': int(len(idx)), 'radius': radius, 'hasUV': has_uv,
              'uvMin': [float(umin[0]), float(umin[1])], 'uvSpan': [float(span[0]), float(span[1])],
              'idx32': idx32, 'groups': gl, 'materials': mats_out, 'offsets': offs}
    hj = json.dumps(header, separators=(',', ':')).encode()
    while (len(hj) + 8) % 4: hj += b' '
    with open(out, 'wb') as f:
        f.write(b'MSH2'); f.write(struct.pack('<I', len(hj))); f.write(hj); f.write(bytes(blob))
    return header


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    mats, meshes = read_3ds(src) if src.lower().endswith('.3ds') else read_cmod(src)
    P, N, U, G = merge(mats, meshes)
    h = write_mesh(out, mats, P, N, U, G)
    print(out, h['vcount'], h['icount'], len(h['materials']))


def simplify(P, N, U, groups, cells=600, nq=3):
    """Vertex clustering: merge vertices sharing a grid cell, a normal bucket and a uv bucket."""
    lo, hi = P.min(axis=0), P.max(axis=0)
    size = float(np.max(hi - lo)) / cells or 1.0
    cell = np.floor((P - lo) / size).astype(np.int64)
    nb = np.round(N * nq).astype(np.int64) + 3
    ub = np.floor(U * 16).astype(np.int64) & 0xFFFF
    key = (((cell[:, 0] * 4096 + cell[:, 1]) * 4096 + cell[:, 2]) * 343 + nb[:, 0] * 49 + nb[:, 1] * 7 + nb[:, 2]) * 65536 * 65536 + ub[:, 0] * 65536 + ub[:, 1]
    uniq, first, inv = np.unique(key, return_index=True, return_inverse=True)
    newP = np.zeros((len(uniq), 3)); np.add.at(newP, inv, P)
    cnt = np.bincount(inv).astype(float)[:, None]; newP /= cnt
    newN, newU = N[first], U[first]
    out = []
    for m, idx in groups:
        t = inv[idx].reshape(-1, 3)
        ok = (t[:, 0] != t[:, 1]) & (t[:, 1] != t[:, 2]) & (t[:, 0] != t[:, 2])
        t = t[ok]
        if len(t):
            out.append((m, t.reshape(-1)))
    return newP, newN, newU, out


def convert(src, out, cells=None, rename_tex=None, nq=3):
    mats, meshes = read_3ds(src) if src.lower().endswith('.3ds') else read_cmod(src)
    P, N, U, G = merge(mats, meshes)
    if cells:
        P, N, U, G = simplify(P, N, U, G, cells, nq)
    return write_mesh(out, mats, P, N, U, G, rename_tex=rename_tex)
