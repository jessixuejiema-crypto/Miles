#!/bin/bash
# usage: dl_sbdb.sh <query> <prefix> <total> <page>
q="$1"; prefix="$2"; total=$3; page=$4
F="full_name,a,e,i,om,w,ma,epoch,H,class,diameter&full-prec=1"
for ((off=0; off<total; off+=page)); do
  out="sbfp/${prefix}_$(printf %07d $off).json"
  [ -s "$out" ] && continue
  for try in 1 2 3 4; do
    curl -s --max-time 600 -o "$out.tmp" "https://ssd-api.jpl.nasa.gov/sbdb_query.api?fields=$F&$q&limit=$page&limit-from=$off" && python3 -c "import json;d=json.load(open('$out.tmp'));assert d['data']" 2>/dev/null && mv "$out.tmp" "$out" && break
    sleep $((try*10))
  done
  echo "$prefix $off $(wc -c < $out 2>/dev/null)"
done
