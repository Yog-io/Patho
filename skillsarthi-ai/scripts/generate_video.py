#!/usr/bin/env python3
import sys
import math
import subprocess
import os

WIDTH = 1280
HEIGHT = 720
FPS = 30
DURATION_SEC = 10
TOTAL_FRAMES = FPS * DURATION_SEC

# Palette
BG_COLOR = (242, 240, 236)         # #f2f0ec
BLUE_COLOR = (24, 95, 165)         # #185FA5
TEAL_COLOR = (42, 138, 142)        # #2A8A8E
LIGHT_TEAL = (78, 168, 172)
MUTED_DARK = (13, 12, 11)

os.makedirs("assets", exist_ok=True)
os.makedirs("public/assets", exist_ok=True)

# Build a fast software canvas in pure Python
# Using bytearray for fast pixel operations

def clamp(v, a, b):
    return max(a, min(b, v))

def lerp(a, b, t):
    return a + (b - a) * t

def ease_in_out(t):
    t = clamp(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

# Pre-generate noise/fleck mask for paper texture
import random
random.seed(42)

flecks = []
for _ in range(350):
    fx = random.randint(0, WIDTH - 1)
    fy = random.randint(0, HEIGHT - 1)
    flen = random.randint(3, 8)
    fangle = random.uniform(0, math.pi)
    fcol = random.choice([(218, 214, 206), (225, 222, 215), (200, 196, 188)])
    flecks.append((fx, fy, flen, fangle, fcol))

def draw_aa_line(pixels, x0, y0, x1, y1, color, thickness):
    dx = x1 - x0
    dy = y1 - y0
    dist = math.hypot(dx, dy)
    if dist < 0.5:
        return
    steps = max(1, int(dist * 1.5))
    rad = thickness / 2.0
    r_ceil = int(math.ceil(rad))
    r_sq = rad * rad

    cr, cg, cb = color
    w, h = WIDTH, HEIGHT

    for s in range(steps + 1):
        t = s / steps
        cx = x0 + dx * t
        cy = y0 + dy * t
        ix = int(round(cx))
        iy = int(round(cy))

        for py in range(max(0, iy - r_ceil), min(h, iy + r_ceil + 1)):
            for px in range(max(0, ix - r_ceil), min(w, ix + r_ceil + 1)):
                d2 = (px - cx)**2 + (py - cy)**2
                if d2 <= r_sq:
                    # Antialiased blend
                    alpha = 1.0
                    edge_dist = rad - math.sqrt(d2)
                    if edge_dist < 1.0:
                        alpha = max(0.0, edge_dist)
                    idx = (py * w + px) * 3
                    pr, pg, pb = pixels[idx], pixels[idx+1], pixels[idx+2]
                    pixels[idx] = int(pr + (cr - pr) * alpha)
                    pixels[idx+1] = int(pg + (cg - pg) * alpha)
                    pixels[idx+2] = int(pb + (cb - pb) * alpha)

def draw_circle(pixels, cx, cy, radius, color, fill=False, thickness=2):
    r_int = int(math.ceil(radius + thickness))
    cr, cg, cb = color
    w, h = WIDTH, HEIGHT
    ix, iy = int(round(cx)), int(round(cy))

    for py in range(max(0, iy - r_int), min(h, iy + r_int + 1)):
        for px in range(max(0, ix - r_int), min(w, ix + r_int + 1)):
            d = math.hypot(px - cx, py - cy)
            if fill:
                if d <= radius:
                    alpha = min(1.0, max(0.0, radius - d + 0.5))
                    idx = (py * w + px) * 3
                    pr, pg, pb = pixels[idx], pixels[idx+1], pixels[idx+2]
                    pixels[idx] = int(pr + (cr - pr) * alpha)
                    pixels[idx+1] = int(pg + (cg - pg) * alpha)
                    pixels[idx+2] = int(pb + (cb - pb) * alpha)
            else:
                diff = abs(d - radius)
                if diff <= thickness / 2.0:
                    alpha = min(1.0, max(0.0, (thickness / 2.0 - diff) + 0.5))
                    idx = (py * w + px) * 3
                    pr, pg, pb = pixels[idx], pixels[idx+1], pixels[idx+2]
                    pixels[idx] = int(pr + (cr - pr) * alpha)
                    pixels[idx+1] = int(pg + (cg - pg) * alpha)
                    pixels[idx+2] = int(pb + (cb - pb) * alpha)

def draw_bezier(pixels, pts, color, thickness_start, thickness_end, max_t=1.0):
    if max_t <= 0.0:
        return
    segments = int(60 * max_t) + 2
    prev_x, prev_y = None, None
    for i in range(segments + 1):
        t = (i / segments) * max_t
        # Cubic bezier: (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
        p0, p1, p2, p3 = pts
        u = 1.0 - t
        x = (u**3)*p0[0] + 3*(u**2)*t*p1[0] + 3*u*(t**2)*p2[0] + (t**3)*p3[0]
        y = (u**3)*p0[1] + 3*(u**2)*t*p1[1] + 3*u*(t**2)*p2[1] + (t**3)*p3[1]
        thick = lerp(thickness_start, thickness_end, t)
        if prev_x is not None:
            draw_aa_line(pixels, prev_x, prev_y, x, y, color, thick)
        prev_x, prev_y = x, y

def draw_wrench(pixels, cx, cy, size, color, alpha=1.0):
    if alpha <= 0.01:
        return
    # Wrench tilted at 45 deg
    col = tuple(int(lerp(BG_COLOR[c], color[c], alpha)) for c in range(3))
    # Handle
    draw_aa_line(pixels, cx - size*0.5, cy + size*0.5, cx + size*0.3, cy - size*0.3, col, size*0.28)
    # Head circle
    draw_circle(pixels, cx - size*0.5, cy + size*0.5, size*0.32, col, fill=True)
    draw_circle(pixels, cx - size*0.5, cy + size*0.5, size*0.14, BG_COLOR, fill=True)
    # Head open jaw
    draw_circle(pixels, cx + size*0.4, cy - size*0.4, size*0.36, col, fill=True)
    draw_circle(pixels, cx + size*0.45, cy - size*0.45, size*0.22, BG_COLOR, fill=True)

def draw_laptop(pixels, cx, cy, size, color, alpha=1.0):
    if alpha <= 0.01:
        return
    col = tuple(int(lerp(BG_COLOR[c], color[c], alpha)) for c in range(3))
    # Screen outline
    w = size * 0.9
    h = size * 0.6
    draw_aa_line(pixels, cx - w/2, cy - h/2, cx + w/2, cy - h/2, col, size*0.1)
    draw_aa_line(pixels, cx + w/2, cy - h/2, cx + w/2, cy + h/2, col, size*0.1)
    draw_aa_line(pixels, cx + w/2, cy + h/2, cx - w/2, cy + h/2, col, size*0.1)
    draw_aa_line(pixels, cx - w/2, cy + h/2, cx - w/2, cy - h/2, col, size*0.1)
    # Base
    draw_aa_line(pixels, cx - w*0.7, cy + h/2 + size*0.06, cx + w*0.7, cy + h/2 + size*0.06, col, size*0.14)

def draw_stethoscope(pixels, cx, cy, size, color, alpha=1.0):
    if alpha <= 0.01:
        return
    col = tuple(int(lerp(BG_COLOR[c], color[c], alpha)) for c in range(3))
    # U-tube
    draw_bezier(pixels, [
        (cx - size*0.4, cy - size*0.4),
        (cx - size*0.4, cy + size*0.3),
        (cx + size*0.4, cy + size*0.3),
        (cx + size*0.4, cy - size*0.4)
    ], col, size*0.12, size*0.12, 1.0)
    # Lower tube down to chest piece
    draw_bezier(pixels, [
        (cx, cy + size*0.3),
        (cx, cy + size*0.6),
        (cx + size*0.2, cy + size*0.6),
        (cx + size*0.3, cy + size*0.4)
    ], col, size*0.1, size*0.1, 1.0)
    draw_circle(pixels, cx + size*0.3, cy + size*0.4, size*0.18, col, fill=True)

# Define paths:
# Trunk:
trunk_pts = [(WIDTH*0.5, HEIGHT*1.05), (WIDTH*0.5, HEIGHT*0.88), (WIDTH*0.5, HEIGHT*0.75), (WIDTH*0.5, HEIGHT*0.68)]
# Left main branch:
left_branch = [(WIDTH*0.5, HEIGHT*0.68), (WIDTH*0.46, HEIGHT*0.52), (WIDTH*0.28, HEIGHT*0.42), (WIDTH*0.22, HEIGHT*0.25)]
# Center main branch:
center_branch = [(WIDTH*0.5, HEIGHT*0.68), (WIDTH*0.51, HEIGHT*0.52), (WIDTH*0.49, HEIGHT*0.35), (WIDTH*0.50, HEIGHT*0.23)]
# Right main branch:
right_branch = [(WIDTH*0.5, HEIGHT*0.68), (WIDTH*0.54, HEIGHT*0.52), (WIDTH*0.72, HEIGHT*0.42), (WIDTH*0.78, HEIGHT*0.25)]

# Sub-branches:
left_sub1 = [(WIDTH*0.44, HEIGHT*0.56), (WIDTH*0.36, HEIGHT*0.50), (WIDTH*0.26, HEIGHT*0.52), (WIDTH*0.12, HEIGHT*0.48)]
left_sub2 = [(WIDTH*0.32, HEIGHT*0.44), (WIDTH*0.24, HEIGHT*0.38), (WIDTH*0.18, HEIGHT*0.30), (WIDTH*0.15, HEIGHT*0.18)]
right_sub1 = [(WIDTH*0.56, HEIGHT*0.56), (WIDTH*0.64, HEIGHT*0.50), (WIDTH*0.74, HEIGHT*0.52), (WIDTH*0.88, HEIGHT*0.48)]
right_sub2 = [(WIDTH*0.68, HEIGHT*0.44), (WIDTH*0.76, HEIGHT*0.38), (WIDTH*0.82, HEIGHT*0.30), (WIDTH*0.85, HEIGHT*0.18)]

# Base paper texture buffer
base_bg = bytearray(WIDTH * HEIGHT * 3)
for y in range(HEIGHT):
    for x in range(WIDTH):
        idx = (y * WIDTH + x) * 3
        base_bg[idx] = BG_COLOR[0]
        base_bg[idx+1] = BG_COLOR[1]
        base_bg[idx+2] = BG_COLOR[2]

for fx, fy, flen, fangle, fcol in flecks:
    dx = math.cos(fangle)
    dy = math.sin(fangle)
    for s in range(flen):
        px = int(fx + dx * s)
        py = int(fy + dy * s)
        if 0 <= px < WIDTH and 0 <= py < HEIGHT:
            idx = (py * WIDTH + px) * 3
            base_bg[idx] = fcol[0]
            base_bg[idx+1] = fcol[1]
            base_bg[idx+2] = fcol[2]

# Launch ffmpeg process
ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{WIDTH}x{HEIGHT}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "fast",
    "-x264opts", "keyint=1:min-keyint=1", # ALL-INTRA for instantaneous scrubbing!
    "-movflags", "+faststart",
    "assets/journey.mp4"
]

print("Starting video generation to assets/journey.mp4...")
proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

for f in range(TOTAL_FRAMES):
    time_sec = f / FPS
    # progress across whole 10 seconds: 0.0 to 1.0
    p = time_sec / DURATION_SEC
    
    # Clone base background
    buf = bytearray(base_bg)
    
    # 1. Trunk growth: 0.0s to 1.5s
    t_trunk = ease_in_out(p / 0.15)
    draw_bezier(buf, trunk_pts, BLUE_COLOR, 18, 14, t_trunk)
    
    # 2. Main branches: 1.2s to 4.5s
    t_branch = ease_in_out((p - 0.12) / 0.33)
    if t_branch > 0:
        draw_bezier(buf, left_branch, BLUE_COLOR, 14, 8, t_branch)
        draw_bezier(buf, center_branch, BLUE_COLOR, 14, 8, t_branch)
        draw_bezier(buf, right_branch, BLUE_COLOR, 14, 8, t_branch)
        
    # 3. Sub branches: 2.0s to 5.0s
    t_sub = ease_in_out((p - 0.20) / 0.30)
    if t_sub > 0:
        draw_bezier(buf, left_sub1, TEAL_COLOR, 8, 4, t_sub)
        draw_bezier(buf, left_sub2, BLUE_COLOR, 7, 4, t_sub)
        draw_bezier(buf, right_sub1, TEAL_COLOR, 8, 4, t_sub)
        draw_bezier(buf, right_sub2, BLUE_COLOR, 7, 4, t_sub)
        
    # 4. Floating bubbles / rings / nodes: 2.5s to 7.0s
    t_nodes = ease_in_out((p - 0.25) / 0.45)
    if t_nodes > 0:
        # teal dot
        draw_circle(buf, WIDTH*0.48, HEIGHT*0.62, 5 * t_nodes, TEAL_COLOR, fill=True)
        # small rings
        draw_circle(buf, WIDTH*0.25, HEIGHT*0.65, 8 * t_nodes, TEAL_COLOR, fill=False, thickness=2)
        draw_circle(buf, WIDTH*0.75, HEIGHT*0.65, 8 * t_nodes, TEAL_COLOR, fill=False, thickness=2)
        draw_circle(buf, WIDTH*0.83, HEIGHT*0.52, 6 * t_nodes, LIGHT_TEAL, fill=False, thickness=2)
        draw_circle(buf, WIDTH*0.17, HEIGHT*0.52, 6 * t_nodes, LIGHT_TEAL, fill=False, thickness=2)
        draw_circle(buf, WIDTH*0.49, HEIGHT*0.40, 4 * t_nodes, BLUE_COLOR, fill=True)
        draw_circle(buf, WIDTH*0.73, HEIGHT*0.35, 4 * t_nodes, BLUE_COLOR, fill=True)

    # 5. Icons appear at endpoints: 3.8s to 6.0s
    t_icons = ease_in_out((p - 0.38) / 0.22)
    if t_icons > 0:
        draw_wrench(buf, WIDTH*0.22, HEIGHT*0.20, 36, BLUE_COLOR, t_icons)
        draw_laptop(buf, WIDTH*0.50, HEIGHT*0.17, 42, BLUE_COLOR, t_icons)
        draw_stethoscope(buf, WIDTH*0.78, HEIGHT*0.20, 38, BLUE_COLOR, t_icons)
        
    # 6. Canopy & horizontal link: 7.2s to 10.0s
    t_canopy = ease_in_out((p - 0.72) / 0.28)
    if t_canopy > 0:
        # Horizontal crossbar connecting icons
        h_len = WIDTH * 0.7 * t_canopy
        draw_aa_line(buf, WIDTH*0.5 - h_len/2, HEIGHT*0.17, WIDTH*0.5 + h_len/2, HEIGHT*0.17, BLUE_COLOR, 3)
        # Arcing canopy lines radiating downward
        canopy_count = 7
        for k in range(canopy_count):
            factor = (k - 3) / 3.0 # -1.0 to 1.0
            cx_end = WIDTH*0.5 + factor * WIDTH*0.38
            cy_end = HEIGHT*0.17 + HEIGHT*0.55
            ctrl_x = WIDTH*0.5 + factor * WIDTH*0.15
            ctrl_y = HEIGHT*0.17 + HEIGHT*0.15
            canopy_pts = [
                (WIDTH*0.5, HEIGHT*0.17),
                (ctrl_x, ctrl_y),
                (WIDTH*0.5 + factor * WIDTH*0.28, HEIGHT*0.45),
                (cx_end, cy_end)
            ]
            draw_bezier(buf, canopy_pts, TEAL_COLOR, 3, 2, t_canopy)

    proc.stdin.write(buf)

proc.stdin.close()
proc.wait()

# Copy to public/assets/journey.mp4 as well
import shutil
shutil.copyfile("assets/journey.mp4", "public/assets/journey.mp4")
print("Video generated successfully at assets/journey.mp4 and copied to public/assets/journey.mp4!")
