#!/bin/zsh
set -e
DIR=captures
OUT=/Users/mahammadrustamov/Desktop/remotion-library/assets/launch
mkdir -p $OUT/gif $OUT/mp4
for slug in $(node -e "const r=require('./captures/report.json');console.log(Object.keys(r).join(' '))"); do
  eval $(node -e "
    const r=require('./captures/report.json')['$slug'];
    console.log(\`SS=\${r.trimStart} DUR=\${r.duration} CW=\${r.crop.w} CH=\${r.crop.h} CX=\${r.crop.x} CY=\${r.crop.y}\`)")
  echo "== $slug ss=$SS dur=$DUR crop=${CW}x${CH}+${CX}+${CY}"
  ffmpeg -hide_banner -loglevel error -y -ss $SS -t $DUR -i $DIR/$slug.webm \
    -vf "crop=${CW}:${CH}:${CX}:${CY}" -r 30 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart \
    $OUT/mp4/$slug.mp4
  ffmpeg -hide_banner -loglevel error -y -ss $SS -t $DUR -i $DIR/$slug.webm \
    -vf "crop=${CW}:${CH}:${CX}:${CY},fps=16,palettegen=stats_mode=diff:max_colors=200" palette-$slug.png
  ffmpeg -hide_banner -loglevel error -y -ss $SS -t $DUR -i $DIR/$slug.webm -i palette-$slug.png \
    -lavfi "crop=${CW}:${CH}:${CX}:${CY},fps=16 [x]; [x][1:v] paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
    -loop 0 $OUT/gif/$slug.gif
done
ls -la $OUT/gif $OUT/mp4
