import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * The traveller - a small hooded wanderer with a red scarf and a lantern.
 *
 * The walk cycle is procedural: pass the distance walked so far and the legs,
 * arms, body bob, cloak and lantern all follow from it. When the character
 * stops (distance no longer changes) the legs stop too, so you only have to
 * animate *where* the character is.
 */

export type CharacterProps = {
  /** Screen position of the feet. */
  x: number;
  y: number;
  scale?: number;
  /** Total distance walked in px. Drives the walk cycle. */
  distance: number;
  /** 0 = standing still, 1 = full stride. Blend for starting/stopping. */
  stride?: number;
  /** 0..1 - tilts the head (and lantern arm) upward. */
  lookUp?: number;
  /** 0..1 lantern brightness. */
  lanternGlow?: number;
  /** Colour of the edge light coming from the sun. */
  rimLight?: string;
  /** -1 = light from the left, 1 = light from the right. */
  lightSide?: -1 | 1;
  /** Shadow direction: horizontal skew of the ground shadow. */
  shadowSkew?: number;
};

const COLORS = {
  cloak: "#2f6f73",
  cloakDark: "#22504f",
  tunic: "#e0b26b",
  trousers: "#3b3352",
  trousersBack: "#2b2540",
  boots: "#4a2f25",
  skin: "#f2c6a0",
  scarf: "#d6423a",
  scarfDark: "#a52f2c",
  lanternMetal: "#3a2c22",
  lanternLight: "#ffd77a",
};

const STRIDE_LENGTH = 150; // px travelled per full walk cycle
const THIGH = 46;
const SHIN = 44;

const Leg: React.FC<{ thigh: number; knee: number; color: string }> = ({ thigh, knee, color }) => (
  <g transform={`rotate(${thigh})`}>
    <rect x={-8} y={-4} width={16} height={THIGH + 6} rx={8} fill={color} />
    <g transform={`translate(0 ${THIGH}) rotate(${knee})`}>
      <rect x={-7} y={-4} width={14} height={SHIN + 4} rx={7} fill={color} />
      <path d={`M -8 ${SHIN - 6} L 6 ${SHIN - 6} Q 20 ${SHIN - 2} 20 ${SHIN + 6} L -9 ${SHIN + 6} Z`} fill={COLORS.boots} />
    </g>
  </g>
);

export const Character: React.FC<CharacterProps> = ({
  x,
  y,
  scale = 1,
  distance,
  stride = 1,
  lookUp = 0,
  lanternGlow = 1,
  rimLight = "rgba(255,220,170,0.9)",
  lightSide = 1,
  shadowSkew = -30,
}) => {
  const frame = useCurrentFrame();
  // Distance is in screen px, so divide by scale to keep feet planted at any size.
  const phase = (distance / scale / STRIDE_LENGTH) * Math.PI * 2;

  // Legs: positive angle swings the leg backward (character faces right).
  const legAmp = 26 * stride;
  const frontThigh = legAmp * Math.sin(phase);
  const backThigh = -frontThigh;
  // Knee bends while the leg swings forward through the air.
  const frontKnee = 42 * stride * Math.max(0, -Math.cos(phase));
  const backKnee = 42 * stride * Math.max(0, Math.cos(phase));

  // The hips drop when the legs are spread apart (physically based bob).
  const maxThigh = (Math.max(Math.abs(frontThigh), Math.abs(backThigh)) * Math.PI) / 180;
  const breathe = Math.sin(frame * 0.08) * 1.5 * (1 - stride);
  const bob = (THIGH + SHIN) * (1 - Math.cos(maxThigh)) + breathe;
  const lean = 4 * stride; // lean forward slightly while walking

  // Arms swing opposite to legs. The front arm carries the lantern.
  const backArm = frontThigh * 0.9;
  const frontArm = -30 - lookUp * 45 + backThigh * 0.25;
  const frontForearm = -50 + lookUp * 10;
  // The lantern hangs freely and swings a little like a pendulum.
  const lanternSwing = Math.sin(phase + 0.6) * 8 * stride + Math.sin(frame * 0.05) * 2;

  // Wind on the scarf and cloak; stronger while walking.
  const wind = 0.5 + stride * 0.8;
  const scarfTail = new Array(7).fill(0).map((_, i) => {
    const t = i / 6;
    return {
      x: -14 - i * 15,
      y: -176 + i * 3 + Math.sin(frame * 0.22 - i * 0.8) * i * 1.8 * wind,
      w: 11 - t * 5,
    };
  });
  const cloakFlap = Math.sin(frame * 0.15 + phase * 0.5) * 6 * wind;

  const glow = lanternGlow * (0.92 + 0.08 * Math.sin(frame * 0.6) * Math.sin(frame * 0.23));

  const width = 360;
  const height = 340;

  return (
    <div
      style={{
        position: "absolute",
        left: x - (width / 2) * scale,
        top: y - (height - 40) * scale,
        width: width * scale,
        height: height * scale,
      }}
    >
      {/* Soft ground shadow, cast away from the light */}
      <div
        style={{
          position: "absolute",
          left: (width / 2 - 70) * scale,
          top: (height - 52) * scale,
          width: 140 * scale,
          height: 22 * scale,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          filter: `blur(${6 * scale}px)`,
          transform: `skewX(${shadowSkew}deg) scaleX(${1 + 0.08 * Math.abs(Math.sin(phase))})`,
        }}
      />
      {/* Lantern light pool on the ground */}
      {lanternGlow > 0 && (
        <div
          style={{
            position: "absolute",
            left: (width / 2 - 40) * scale,
            top: (height - 70) * scale,
            width: 200 * scale,
            height: 50 * scale,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, rgba(255,210,120,${0.45 * glow}) 0%, rgba(255,210,120,0) 70%)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      <svg
        viewBox={`${-width / 2} ${-(height - 40)} ${width} ${height}`}
        width={width * scale}
        height={height * scale}
        style={{
          position: "absolute",
          overflow: "visible",
          // Rim light: a light-coloured drop shadow offset toward the sun reads as edge light.
          filter: `drop-shadow(${lightSide * 3}px -1px 0px ${rimLight}) drop-shadow(0 0 ${2}px rgba(0,0,0,0.35))`,
        }}
      >
        <defs>
          <radialGradient id="lantern-glow">
            <stop offset="0%" stopColor="#fff3c4" stopOpacity={1} />
            <stop offset="35%" stopColor={COLORS.lanternLight} stopOpacity={0.55} />
            <stop offset="100%" stopColor={COLORS.lanternLight} stopOpacity={0} />
          </radialGradient>
        </defs>

        <g transform={`translate(0 ${bob}) rotate(${lean} 0 -95)`}>
          {/* Back arm */}
          <g transform={`translate(-2 -166) rotate(${backArm})`}>
            <rect x={-6} y={0} width={12} height={34} rx={6} fill={COLORS.cloakDark} />
            <g transform="translate(0 30) rotate(-15)">
              <rect x={-5} y={0} width={10} height={30} rx={5} fill={COLORS.cloakDark} />
              <circle cx={0} cy={32} r={6} fill={COLORS.skin} opacity={0.85} />
            </g>
          </g>

          {/* Back leg */}
          <g transform="translate(-4 -95)">
            <Leg thigh={backThigh} knee={backKnee} color={COLORS.trousersBack} />
          </g>

          {/* Cloak (behind the body) */}
          <path
            d={`M -14 -176 C -40 -150 ${-52 + cloakFlap} -110 ${-62 + cloakFlap * 1.4} -78
               L ${-30 + cloakFlap * 0.5} -84 C -20 -110 -10 -140 -2 -170 Z`}
            fill={COLORS.cloakDark}
          />

          {/* Front leg */}
          <g transform="translate(4 -95)">
            <Leg thigh={frontThigh} knee={frontKnee} color={COLORS.trousers} />
          </g>

          {/* Torso: tunic + cloak */}
          <path d="M -20 -172 Q 0 -180 22 -172 L 26 -96 Q 2 -88 -24 -96 Z" fill={COLORS.tunic} />
          <path d="M -24 -102 L 26 -102 L 26 -94 L -24 -94 Z" fill={COLORS.boots} />
          <path
            d={`M -22 -176 Q 2 -186 20 -176 L 14 -150 Q -2 -118 -28 -104 Q ${-36 + cloakFlap * 0.4} -140 -22 -176 Z`}
            fill={COLORS.cloak}
          />

          {/* Scarf tail flowing in the wind */}
          <path
            d={
              `M -6 ${-182} ` +
              scarfTail.map((p) => `L ${p.x} ${p.y - p.w / 2}`).join(" ") +
              " " +
              [...scarfTail].reverse().map((p) => `L ${p.x + 2} ${p.y + p.w / 2}`).join(" ") +
              " L -6 -170 Z"
            }
            fill={COLORS.scarfDark}
          />

          {/* Head, tilted by lookUp */}
          <g transform={`rotate(${-lookUp * 18} 4 -182)`}>
            {/* Hood back */}
            <path d="M -26 -196 Q -30 -238 6 -240 Q 40 -238 36 -202 L 30 -180 L -20 -178 Z" fill={COLORS.cloak} />
            {/* Face */}
            <ellipse cx={14} cy={-206} rx={18} ry={20} fill={COLORS.skin} />
            <circle cx={23} cy={-210} r={2.6} fill="#2a1c1a" />
            <ellipse cx={22} cy={-199} rx={4} ry={2.5} fill="#e89a8a" opacity={0.6} />
            {/* Hood rim framing the face */}
            <path
              d="M 30 -232 Q 2 -246 -18 -224 Q -24 -200 -12 -184 Q -6 -200 -4 -214 Q 6 -230 30 -232 Z"
              fill={COLORS.cloakDark}
            />
            <path d="M 30 -232 Q 40 -226 38 -214 Q 34 -222 26 -226 Z" fill={COLORS.cloakDark} />
          </g>

          {/* Scarf wrap around the neck */}
          <path d="M -16 -186 Q 4 -178 26 -186 L 26 -172 Q 4 -166 -16 -172 Z" fill={COLORS.scarf} />

          {/* Front arm holding the lantern */}
          <g transform={`translate(6 -166) rotate(${frontArm})`}>
            <rect x={-7} y={0} width={14} height={34} rx={7} fill={COLORS.cloak} />
            <g transform={`translate(0 30) rotate(${frontForearm})`}>
              <rect x={-6} y={0} width={12} height={30} rx={6} fill={COLORS.cloak} />
              <circle cx={0} cy={32} r={6.5} fill={COLORS.skin} />
              {/* Lantern - counter-rotated so it always hangs down */}
              <g transform={`translate(0 34) rotate(${-(frontArm + frontForearm + lean) + lanternSwing})`}>
                <circle cx={0} cy={36} r={110 * glow} fill="url(#lantern-glow)" opacity={0.55 * glow} />
                <path d="M -6 0 Q 0 -6 6 0" stroke={COLORS.lanternMetal} strokeWidth={2} fill="none" />
                <line x1={0} y1={0} x2={0} y2={14} stroke={COLORS.lanternMetal} strokeWidth={2} />
                <path d="M -12 16 L 12 16 L 8 12 L -8 12 Z" fill={COLORS.lanternMetal} />
                <rect x={-10} y={16} width={20} height={30} rx={3} fill={COLORS.lanternLight} opacity={0.4 + 0.6 * glow} />
                <ellipse cx={0} cy={32} rx={5} ry={8} fill="#fff8de" opacity={glow} />
                <rect x={-10} y={16} width={20} height={30} rx={3} fill="none" stroke={COLORS.lanternMetal} strokeWidth={2.5} />
                <line x1={0} y1={16} x2={0} y2={46} stroke={COLORS.lanternMetal} strokeWidth={1.5} opacity={0.6} />
                <path d="M -12 46 L 12 46 L 9 51 L -9 51 Z" fill={COLORS.lanternMetal} />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
