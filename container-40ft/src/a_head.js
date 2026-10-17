import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

/* ---------- units: inches. X = length (0 at the front wall → L at the cargo doors), Y = up (0 = container floor), Z = width (near side −) ---------- */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const D = window.DW_DESIGN;                                  // shared with the BOM / calculations tabs
const L = D.intLengthIn, HW = D.intWidthIn / 2, H = D.intHeightIn;
const RUN_L = D.runLengthIn, NB = D.bays, BAY = RUN_L / NB, PANEL = BAY - 4;
const WALL = 5, WATER = 3, LED = 9, PITCH = 11.75, BASE = 8, TIERS = 8;
const GROUND = -13, SECTION_X = 2 * BAY + 31;
const COLW = HW - 1.75;                                      // wall-side edge of each run column
const COLS = [{ w: -COLW, s: 1 }, { w: COLW, s: -1 }];      // direction toward the aisle
const AISLE = Math.round((2 * COLW - 72) * 4) / 4;
const Z = (c, d) => COLS[c].w + COLS[c].s * d;               // d = inches from wall-side tray edge (0..36)
const TB = t => BASE + t * PITCH;                            // top of run floor for tier t
const FRAMES = Array.from({ length: NB + 1 }, (_, k) => k * BAY);
const BRACED = [0, Math.floor(NB / 2), NB - 1];
const fx = x => Math.min(Math.max(x - 0.75, 0), RUN_L - 1.5);
const B = RUN_L, CONV_END = RUN_L - 28, HEAD_X = RUN_L + 1.2;
const FTIN = window.DW_FTIN;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
