"""Minimal parser for Celestia .ssc catalog files."""
import re

TOKEN = re.compile(r'"((?:[^"\\]|\\.)*)"|(\{|\}|\[|\])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)|([A-Za-z_][A-Za-z0-9_]*(?:<[^>]*>)?)|(#[^\n]*)|(\s+)')


def tokenize(text):
    pos = 0
    out = []
    while pos < len(text):
        m = TOKEN.match(text, pos)
        if not m:
            pos += 1
            continue
        pos = m.end()
        s, br, num, ident, comment, ws = m.groups()
        if s is not None:
            out.append(('str', s))
        elif br:
            out.append(('br', br))
        elif num:
            out.append(('num', float(num)))
        elif ident:
            out.append(('id', ident))
    return out


def parse_value(toks, i):
    kind, v = toks[i]
    if kind == 'br' and v == '{':
        return parse_block(toks, i + 1)
    if kind == 'br' and v == '[':
        arr = []
        i += 1
        while toks[i] != ('br', ']'):
            if toks[i] == ('br', '{'):
                blk, i = parse_block(toks, i + 1)
                arr.append(blk)
            else:
                arr.append(toks[i][1]); i += 1
        return arr, i + 1
    return v, i + 1


def parse_block(toks, i):
    d = {}
    while i < len(toks) and toks[i] != ('br', '}'):
        kind, key = toks[i]
        if kind != 'id':
            i += 1
            continue
        unit = key.split('<')[1].rstrip('>') if '<' in key else None
        key = key.split('<')[0]
        if unit:
            d[key + '_unit'] = unit
        # a key may be followed directly by a block (e.g. OrbitFrame { EquatorJ2000 { } })
        if i + 1 < len(toks) and toks[i + 1][0] in ('br', 'str', 'num', 'id') and not (toks[i + 1][0] == 'br' and toks[i + 1][1] == '}'):
            if toks[i + 1][0] == 'id':
                # bare identifier key with nested key (e.g. "EquatorJ2000 {}" inside a block)
                d.setdefault(key, {})
                i += 1
                continue
            val, i = parse_value(toks, i + 1)
        else:
            val, i = {}, i + 1
        if key in d:
            if not isinstance(d[key], list) or not d.get('__multi_' + key):
                d[key] = [d[key]]; d['__multi_' + key] = True
            d[key].append(val)
        else:
            d[key] = val
    return d, i + 1


def parse_file(path):
    toks = tokenize(open(path, encoding='utf-8', errors='replace').read())
    entries = []
    i = 0
    while i < len(toks):
        disposition = None
        if toks[i][0] == 'id' and toks[i][1] in ('Add', 'Modify', 'Replace', 'Body', 'ReferencePoint', 'SurfaceObject', 'AltSurface', 'Location'):
            disposition = toks[i][1]
            i += 1
        if i + 2 < len(toks) and toks[i][0] == 'str' and toks[i + 1][0] == 'str' and toks[i + 2] == ('br', '{'):
            names, parent = toks[i][1], toks[i + 1][1]
            body, i = parse_block(toks, i + 3)
            entries.append({'names': names.split(':'), 'parent': parent, 'disp': disposition, 'p': body})
        elif i + 1 < len(toks) and toks[i][0] == 'str' and toks[i + 1] == ('br', '{'):
            body, i = parse_block(toks, i + 2)
        else:
            i += 1
    return entries
