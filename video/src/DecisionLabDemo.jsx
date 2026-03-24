import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const C = {
  bg: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#c9d1d9",
  white: "#e6edf3",
  green: "#3fb950",
  blue: "#58a6ff",
  yellow: "#d29922",
  red: "#f85149",
  cyan: "#39c5cf",
  magenta: "#bc8cff",
  orange: "#f0883e",
  dimmed: "#484f58",
  purple: "#d2a8ff",
};

const FONT = "'SF Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace";
const SANS = "'Inter', 'Helvetica Neue', 'Segoe UI', sans-serif";

// ─── Primitives ───

const TypedText = ({ text, startFrame, speed = 1.0, color = C.text, fontSize = 28, font = FONT }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  if (elapsed < 0) return null;

  let charIndex = 0;
  let budget = elapsed * speed;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let cost = 1;
    if (ch === "." || ch === "?" || ch === "!") cost = 5;
    else if (ch === "," || ch === "—" || ch === ";") cost = 3;
    else if (ch === " ") cost = 1.3;
    budget -= cost;
    if (budget < 0) break;
    charIndex = i + 1;
  }
  charIndex = Math.min(charIndex, text.length);

  return (
    <span style={{ color, fontSize, fontFamily: font, lineHeight: 1.6 }}>
      {text.slice(0, charIndex)}
      {charIndex < text.length && (
        <span style={{ opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0, color: C.green }}>▊</span>
      )}
    </span>
  );
};

const FadeIn = ({ children, delay = 0, duration = 15 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, duration], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>;
};

const Badge = ({ label, color, icon, size = "md" }) => {
  const s = size === "lg" ? { fs: 22, px: 16, py: 6 } : { fs: 18, px: 12, py: 4 };
  return (
    <span
      style={{
        background: `${color}20`,
        color,
        border: `1.5px solid ${color}60`,
        padding: `${s.py}px ${s.px}px`,
        borderRadius: "6px",
        fontSize: s.fs,
        fontWeight: 700,
        marginRight: "14px",
        letterSpacing: "0.5px",
        fontFamily: FONT,
      }}
    >
      {icon && <span style={{ marginRight: "6px" }}>{icon}</span>}
      {label}
    </span>
  );
};

const Scene = ({ children, fadeOut: fo = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOutOp = fo
    ? interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const fadeInOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: fadeInOp * fadeOutOp }}>
      {children}
    </AbsoluteFill>
  );
};

const TerminalChrome = ({ children, title = "decision-lab — ~/analysis" }) => (
  <div
    style={{
      margin: "40px 60px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: "52px",
        background: C.panel,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "10px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.red }} />
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.yellow }} />
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.green }} />
      <span style={{ color: C.dimmed, marginLeft: "20px", fontSize: "18px", fontFamily: FONT }}>{title}</span>
      <span style={{ color: C.dimmed, fontSize: "16px", fontFamily: FONT, marginLeft: "auto" }}>dlab v0.1</span>
    </div>
    <div style={{ flex: 1, padding: "36px 48px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

// ─── Animated Bezier Path (SVG stroke-dashoffset) ───

const AnimatedPath = ({ d, color, startFrame, drawDuration = 30, strokeWidth = 3, dashed = false }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  if (elapsed < 0) return null;

  const pathLength = 1000; // approximate
  const progress = interpolate(elapsed, [0, drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? "12,8" : pathLength}
      strokeDashoffset={dashed ? 0 : pathLength * (1 - progress)}
      opacity={interpolate(elapsed, [0, 8], [0, 1], { extrapolateRight: "clamp" })}
    />
  );
};

// ─── Graph Node ───

const GraphNode = ({ x, y, width, height, label, sublabel, color, borderColor, startFrame, status, statusColor, icon }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  if (elapsed < 0) return null;

  const scale = interpolate(elapsed, [0, 12], [0.7, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(elapsed, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <g transform={`scale(${scale})`} style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}>
        {/* Glow behind node */}
        <rect
          x={-4} y={-4}
          width={width + 8} height={height + 8}
          rx={16}
          fill="none"
          stroke={borderColor || color}
          strokeWidth={1}
          opacity={0.3}
          filter="url(#nodeGlow)"
        />
        {/* Node background */}
        <rect
          width={width} height={height}
          rx={14}
          fill={C.panel}
          stroke={borderColor || color}
          strokeWidth={2}
        />
        {/* Icon */}
        {icon && (
          <text x={20} y={height / 2 + 7} fontSize={22} fill={color}>{icon}</text>
        )}
        {/* Label */}
        <text
          x={icon ? 50 : 20}
          y={sublabel ? height / 2 - 4 : height / 2 + 6}
          fontSize={18}
          fontWeight={700}
          fill={color}
          fontFamily={FONT}
        >
          {label}
        </text>
        {sublabel && (
          <text
            x={icon ? 50 : 20}
            y={height / 2 + 18}
            fontSize={14}
            fill={C.dimmed}
            fontFamily={FONT}
          >
            {sublabel}
          </text>
        )}
        {/* Status badge */}
        {status && (
          <g>
            <rect
              x={width - 140} y={height / 2 - 12}
              width={130} height={24}
              rx={5}
              fill={`${statusColor}20`}
              stroke={`${statusColor}60`}
              strokeWidth={1}
            />
            <text
              x={width - 75} y={height / 2 + 4}
              fontSize={12}
              fontWeight={700}
              fill={statusColor}
              fontFamily={FONT}
              textAnchor="middle"
            >
              {status}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

// ═══════════════════════════════════════════
// SCENE 1: Opening hook
// ═══════════════════════════════════════════

const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({ frame, fps, config: { damping: 80, stiffness: 150, mass: 0.8 } });
  const glowIntensity = interpolate(Math.sin(frame * 0.08), [-1, 1], [15, 45]);

  return (
    <Scene>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(88,166,255,${glowIntensity / 400}) 0%, transparent 70%)`,
            filter: `blur(${glowIntensity}px)`,
          }}
        />
        <div style={{ textAlign: "center", maxWidth: 1500, padding: "0 100px", transform: `scale(${textScale})` }}>
          <FadeIn delay={8}>
            <div style={{ fontFamily: SANS, fontSize: 62, fontWeight: 700, color: C.white, lineHeight: 1.35, marginBottom: 36 }}>
              We doubled Q4 ad spend.<br />
              Where's the <span style={{ color: C.cyan, fontStyle: "italic" }}>incremental lift</span>?
            </div>
          </FadeIn>
          <FadeIn delay={50}>
            <div style={{ fontFamily: SANS, fontSize: 30, color: C.dimmed, lineHeight: 1.6 }}>
              A vanilla MMM can't decompose incrementality without refitting.
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <div style={{ fontFamily: SANS, fontSize: 30, color: C.blue, lineHeight: 1.6, marginTop: 12 }}>
              decision-lab can.
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ═══════════════════════════════════════════
// SCENE 2: Terminal command typing
// ═══════════════════════════════════════════

const SceneCommand = () => {
  const frame = useCurrentFrame();

  const Spinner = () => {
    const chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    return <span style={{ color: C.cyan, fontSize: 28, fontFamily: FONT }}>{chars[Math.floor(frame / 3) % chars.length]}</span>;
  };

  return (
    <Scene>
      <TerminalChrome>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <FadeIn delay={8}>
            <div style={{ fontSize: 32, fontFamily: FONT, marginBottom: 24 }}>
              <span style={{ color: C.green, fontSize: 32 }}>❯ </span>
              <TypedText
                text="dlab --dpack mmm --data ./ad-spend.csv"
                startFrame={15}
                speed={0.8}
                color={C.text}
                fontSize={32}
              />
            </div>
          </FadeIn>

          {frame >= 70 && (
            <FadeIn delay={70}>
              <div style={{ fontSize: 28, fontFamily: FONT, marginTop: 8, marginLeft: 36 }}>
                <span style={{ color: C.dimmed }}>prompt: </span>
                <TypedText
                  text={`"We doubled Q4 spend — where's the incremental lift?"`}
                  startFrame={78}
                  speed={0.8}
                  color={C.white}
                  fontSize={28}
                />
              </div>
            </FadeIn>
          )}

          {frame >= 130 && (
            <FadeIn delay={130}>
              <div style={{ marginTop: 60, display: "flex", alignItems: "center", gap: 14 }}>
                <Spinner />
                <span style={{ color: C.dimmed, fontSize: 24, fontFamily: FONT }}>
                  Initializing decision-lab session...
                </span>
              </div>
            </FadeIn>
          )}
        </div>
      </TerminalChrome>
    </Scene>
  );
};

// ═══════════════════════════════════════════
// SCENE 3: Research Plan — text tree
// ═══════════════════════════════════════════

const SceneResearchPlan = () => {
  const frame = useCurrentFrame();

  const nodes = [
    { text: "Load & validate 2 years of weekly spend + revenue", color: C.text, delay: 30 },
    { text: "Fan out 3 researchers with different strategies", color: C.text, delay: 65 },
    { text: "Each must pass convergence + posterior predictive checks", color: C.text, delay: 100 },
    { text: "Consolidate — only trust where paths agree", color: C.text, delay: 135 },
    { text: `If paths diverge → "insufficient evidence"`, color: C.yellow, delay: 170, isLast: true },
  ];

  return (
    <Scene>
      <TerminalChrome>
        <FadeIn delay={0}>
          <div style={{ marginBottom: 36 }}>
            <Badge label="PI" color={C.blue} icon="🔬" size="lg" />
            <span style={{ color: C.white, fontWeight: 700, fontSize: 30, fontFamily: FONT }}>
              Designing research agenda
            </span>
          </div>
        </FadeIn>

        <div style={{ marginLeft: 36, flex: 1 }}>
          {nodes.map((node, i) => {
            if (frame < node.delay) return null;
            const op = interpolate(frame - node.delay, [0, 12], [0, 1], { extrapolateRight: "clamp" });
            const y = interpolate(frame - node.delay, [0, 12], [18, 0], { extrapolateRight: "clamp" });
            const connector = node.isLast ? "└─" : "├─";
            return (
              <div key={i} style={{ opacity: op, transform: `translateY(${y}px)` }}>
                {i > 0 && (
                  <div style={{ color: C.dimmed, fontSize: 28, fontFamily: FONT, paddingLeft: 4, lineHeight: 1.0 }}>│</div>
                )}
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <span style={{ color: C.dimmed, fontSize: 28, fontFamily: FONT, marginRight: 16, flexShrink: 0 }}>
                    {connector}
                  </span>
                  <span style={{ color: node.color, fontSize: 27, fontFamily: FONT, lineHeight: 1.5 }}>
                    {node.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {frame >= 210 && (
          <FadeIn delay={210}>
            <div style={{ marginTop: 30 }}>
              <span style={{ color: C.green, fontSize: 26, fontFamily: FONT }}>✓ </span>
              <span style={{ color: C.white, fontSize: 26, fontWeight: 600, fontFamily: FONT }}>104 weeks</span>
              <span style={{ color: C.text, fontSize: 26, fontFamily: FONT }}> across </span>
              <span style={{ color: C.white, fontSize: 26, fontWeight: 600, fontFamily: FONT }}>6 channels</span>
              <span style={{ color: C.dimmed, fontSize: 22, fontFamily: FONT }}>
                {" "}— TV, Paid Search, Social, Display, Email, Affiliates
              </span>
            </div>
          </FadeIn>
        )}
      </TerminalChrome>
    </Scene>
  );
};

// ═══════════════════════════════════════════
// SCENE 4: Fan-out Graph — the visual hero
// Animated SVG with bezier-connected nodes
// ═══════════════════════════════════════════

const SceneFanOut = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Layout constants (1920x1080 canvas)
  const piX = 760, piY = 60;
  const r1X = 180, r1Y = 340;
  const r2X = 710, r2Y = 340;
  const r3X = 1240, r3Y = 340;
  const prX = 710, prY = 680;

  const piW = 400, piH = 70;
  const rW = 420, rH = 100;
  const prW = 500, prH = 80;

  // Bezier paths from PI to each researcher
  const pathPI_R1 = `M ${piX + piW / 2} ${piY + piH} C ${piX + piW / 2} ${piY + piH + 80}, ${r1X + rW / 2} ${r1Y - 80}, ${r1X + rW / 2} ${r1Y}`;
  const pathPI_R2 = `M ${piX + piW / 2} ${piY + piH} C ${piX + piW / 2} ${piY + piH + 100}, ${r2X + rW / 2} ${r2Y - 100}, ${r2X + rW / 2} ${r2Y}`;
  const pathPI_R3 = `M ${piX + piW / 2} ${piY + piH} C ${piX + piW / 2} ${piY + piH + 80}, ${r3X + rW / 2} ${r3Y - 80}, ${r3X + rW / 2} ${r3Y}`;

  // Paths from researchers to peer review
  const pathR1_PR = `M ${r1X + rW / 2} ${r1Y + rH} C ${r1X + rW / 2} ${r1Y + rH + 80}, ${prX + prW / 2} ${prY - 80}, ${prX + prW / 2} ${prY}`;
  const pathR2_PR = `M ${r2X + rW / 2} ${r2Y + rH} C ${r2X + rW / 2} ${r2Y + rH + 100}, ${prX + prW / 2} ${prY - 100}, ${prX + prW / 2} ${prY}`;
  const pathR3_PR = `M ${r3X + rW / 2} ${r3Y + rH} C ${r3X + rW / 2} ${r3Y + rH + 80}, ${prX + prW / 2} ${prY - 80}, ${prX + prW / 2} ${prY}`;

  // Revision loop path (R2 back to PI and down again)
  const pathRevision = `M ${r2X + rW + 10} ${r2Y + rH / 2} C ${r2X + rW + 100} ${r2Y + rH / 2}, ${r2X + rW + 100} ${r2Y - 120}, ${r2X + rW / 2 + 50} ${r2Y - 40} L ${r2X + rW / 2 + 50} ${r2Y}`;

  // R2 status
  const r2Status = frame >= 340
    ? "✓ CONVERGED"
    : frame >= 240
    ? "REVISING..."
    : frame >= 170
    ? "✗ DIVERGENT"
    : frame >= 80
    ? "SAMPLING"
    : null;
  const r2StatusColor = frame >= 340
    ? C.green
    : frame >= 240
    ? C.yellow
    : frame >= 170
    ? C.red
    : C.cyan;

  // R2 border color changes
  const r2BorderColor = frame >= 340
    ? C.green
    : frame >= 170
    ? C.red
    : C.orange;

  // Path colors for R2 converging path
  const r2ConvergeColor = frame >= 340 ? C.green : C.dimmed;

  // Glow pulse on peer review node
  const prGlow = frame >= 370
    ? interpolate(Math.sin((frame - 370) * 0.1), [-1, 1], [0.3, 0.8])
    : 0;

  return (
    <Scene>
      <AbsoluteFill>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Title */}
          {frame >= 0 && (
            <text
              x={960} y={40}
              textAnchor="middle"
              fontSize={18}
              fill={C.dimmed}
              fontFamily={FONT}
              letterSpacing={4}
              opacity={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })}
            >
              RESEARCH WORKFLOW
            </text>
          )}

          {/* ─── Fan-out paths (PI → Researchers) ─── */}
          <AnimatedPath d={pathPI_R1} color={C.purple} startFrame={40} drawDuration={35} />
          <AnimatedPath d={pathPI_R2} color={C.orange} startFrame={50} drawDuration={35} />
          <AnimatedPath d={pathPI_R3} color={C.magenta} startFrame={60} drawDuration={35} />

          {/* ─── Converge paths (Researchers → Peer Review) ─── */}
          <AnimatedPath d={pathR1_PR} color={C.green} startFrame={200} drawDuration={35} />
          <AnimatedPath d={pathR2_PR} color={r2ConvergeColor} startFrame={350} drawDuration={30} dashed={frame < 340} />
          <AnimatedPath d={pathR3_PR} color={C.green} startFrame={210} drawDuration={35} />

          {/* ─── Revision loop (R2 → retry) ─── */}
          {frame >= 240 && (
            <AnimatedPath d={pathRevision} color={C.yellow} startFrame={240} drawDuration={40} dashed={true} strokeWidth={2.5} />
          )}
          {frame >= 255 && (
            <text
              x={r2X + rW + 80} y={r2Y - 30}
              fontSize={15}
              fill={C.yellow}
              fontFamily={FONT}
              fontWeight={600}
              opacity={interpolate(frame - 255, [0, 10], [0, 1], { extrapolateRight: "clamp" })}
            >
              ↩ revise & retry
            </text>
          )}

          {/* ─── PI Node ─── */}
          <GraphNode
            x={piX} y={piY}
            width={piW} height={piH}
            label="THE PI"
            sublabel="Orchestrator agent"
            color={C.blue}
            icon="🔬"
            startFrame={5}
          />

          {/* ─── Researcher Nodes ─── */}
          <GraphNode
            x={r1X} y={r1Y}
            width={rW} height={rH}
            label="RESEARCHER 1"
            sublabel="Hierarchical + informative priors"
            color={C.purple}
            startFrame={55}
            status={frame >= 140 ? "✓ CONVERGED" : frame >= 80 ? "SAMPLING" : null}
            statusColor={frame >= 140 ? C.green : C.cyan}
          />
          <GraphNode
            x={r2X} y={r2Y}
            width={rW} height={rH}
            label="RESEARCHER 2"
            sublabel="Additive + weakly informative"
            color={C.orange}
            borderColor={r2BorderColor}
            startFrame={65}
            status={r2Status}
            statusColor={r2StatusColor}
          />
          <GraphNode
            x={r3X} y={r3Y}
            width={rW} height={rH}
            label="RESEARCHER 3"
            sublabel="Saturating + flat priors + events"
            color={C.magenta}
            startFrame={75}
            status={frame >= 150 ? "✓ CONVERGED" : frame >= 80 ? "SAMPLING" : null}
            statusColor={frame >= 150 ? C.green : C.cyan}
          />

          {/* ─── Peer Review Node ─── */}
          {frame >= 200 && (
            <>
              {prGlow > 0 && (
                <rect
                  x={prX - 6} y={prY - 6}
                  width={prW + 12} height={prH + 12}
                  rx={18}
                  fill="none"
                  stroke={C.green}
                  strokeWidth={2}
                  opacity={prGlow}
                  filter="url(#strongGlow)"
                />
              )}
              <GraphNode
                x={prX} y={prY}
                width={prW} height={prH}
                label="PEER REVIEW"
                sublabel="Consolidate all analytical paths"
                color={C.green}
                icon="⚖"
                startFrame={200}
                status={frame >= 380 ? "CONSENSUS" : frame >= 370 ? "REVIEWING" : null}
                statusColor={frame >= 380 ? C.green : C.cyan}
              />
            </>
          )}

          {/* ─── Failure callout ─── */}
          {frame >= 175 && frame < 240 && (
            <g opacity={interpolate(frame - 175, [0, 10], [0, 1], { extrapolateRight: "clamp" })}>
              <rect
                x={r2X + rW / 2 - 180} y={r2Y + rH + 16}
                width={360} height={40}
                rx={8}
                fill={`${C.red}25`}
                stroke={`${C.red}60`}
                strokeWidth={1.5}
              />
              <text
                x={r2X + rW / 2} y={r2Y + rH + 42}
                textAnchor="middle"
                fontSize={16}
                fontWeight={700}
                fill={C.red}
                fontFamily={FONT}
              >
                ✗ PPC FAILED — under-predicts holidays by 22%
              </text>
            </g>
          )}

          {/* ─── Verdict ─── */}
          {frame >= 390 && (
            <g opacity={interpolate(frame - 390, [0, 15], [0, 1], { extrapolateRight: "clamp" })}>
              <rect
                x={prX + prW / 2 - 240} y={prY + prH + 20}
                width={480} height={50}
                rx={10}
                fill={`${C.blue}15`}
                stroke={`${C.blue}50`}
                strokeWidth={1.5}
              />
              <text
                x={prX + prW / 2} y={prY + prH + 52}
                textAnchor="middle"
                fontSize={20}
                fontWeight={700}
                fill={C.white}
                fontFamily={FONT}
              >
                Strong consensus — recommendation is robust
              </text>
            </g>
          )}

          {/* ─── Analysis stats ─── */}
          {frame >= 400 && (
            <text
              x={960} y={prY + prH + 100}
              textAnchor="middle"
              fontSize={16}
              fill={C.dimmed}
              fontFamily={FONT}
              opacity={interpolate(frame - 400, [0, 15], [0, 1], { extrapolateRight: "clamp" })}
            >
              3 models · 24,000 posterior samples · 6 channels decomposed
            </text>
          )}
        </svg>
      </AbsoluteFill>
    </Scene>
  );
};

// ═══════════════════════════════════════════
// SCENE 5: Results — chart + findings
// ═══════════════════════════════════════════

const SceneResults = () => {
  const frame = useCurrentFrame();

  const data = [
    { label: "Paid Search", value: 34, pct: "34%", color: C.green, note: "ROAS 4.2x ↑", noteColor: C.green },
    { label: "TV", value: 24, pct: "24%", color: C.cyan, note: "no Q4 lift ↓", noteColor: C.yellow },
    { label: "Social", value: 15, pct: "15%", color: C.magenta, note: "growing ↑", noteColor: C.green },
    { label: "Email", value: 13, pct: "13%", color: C.blue },
    { label: "Display", value: 9, pct: "9%", color: C.orange, note: "ROAS 0.8x ↓", noteColor: C.red },
    { label: "Affiliates", value: 5, pct: "5%", color: C.dimmed },
  ];
  const maxVal = Math.max(...data.map((d) => d.value));
  const barMaxWidth = 700;

  return (
    <Scene>
      <TerminalChrome>
        <FadeIn delay={0}>
          <div style={{
            color: C.white,
            fontWeight: 700,
            fontSize: 30,
            fontFamily: FONT,
            borderBottom: `3px solid ${C.blue}`,
            paddingBottom: 8,
            marginBottom: 30,
            display: "inline-block",
          }}>
            Channel Contribution — Consensus Across 3 Models
          </div>
        </FadeIn>

        <div style={{ marginLeft: 10, marginBottom: 28 }}>
          {data.map((d, i) => {
            const delay = 20 + i * 12;
            if (frame < delay) return null;
            const elapsed = frame - delay;
            const barProgress = interpolate(elapsed, [0, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const barWidth = (d.value / maxVal) * barMaxWidth * barProgress;
            const op = interpolate(elapsed, [0, 10], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div
                key={d.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 14,
                  opacity: op,
                }}
              >
                <span style={{ color: C.dimmed, width: 180, textAlign: "right", marginRight: 18, fontSize: 22, fontFamily: FONT }}>
                  {d.label}
                </span>
                <div
                  style={{
                    height: 34,
                    width: `${barWidth}px`,
                    background: `linear-gradient(90deg, ${d.color}aa, ${d.color})`,
                    borderRadius: 5,
                  }}
                />
                <span style={{ color: C.white, marginLeft: 14, fontSize: 22, fontWeight: 700, fontFamily: FONT, opacity: barProgress > 0.8 ? 1 : 0 }}>
                  {d.pct}
                </span>
                {d.note && barProgress > 0.9 && (
                  <span style={{ color: d.noteColor || C.dimmed, marginLeft: 14, fontSize: 18, fontFamily: FONT }}>
                    {d.note}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Key Finding */}
        {frame >= 130 && (
          <FadeIn delay={130}>
            <div style={{
              background: `${C.blue}12`,
              border: `1.5px solid ${C.blue}50`,
              borderRadius: 10,
              padding: "18px 24px",
              marginBottom: 18,
            }}>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 24, fontFamily: FONT, marginBottom: 10 }}>
                Key Finding
              </div>
              <TypedText
                text="Q4 TV spend hit saturation — doubling the budget added only 8% incremental revenue. Paid Search still has 2.3x headroom."
                startFrame={140}
                speed={1.1}
                color={C.text}
                fontSize={22}
              />
            </div>
          </FadeIn>
        )}

        {/* Recommendation */}
        {frame >= 220 && (
          <FadeIn delay={220}>
            <div style={{
              background: `${C.green}12`,
              border: `1.5px solid ${C.green}50`,
              borderRadius: 10,
              padding: "18px 24px",
            }}>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 24, fontFamily: FONT, marginBottom: 10 }}>
                Recommendation
              </div>
              <TypedText
                text="Shift 30% of TV budget → Paid Search & Social. Revenue impact: +19% (95% CI: +12% to +27%)."
                startFrame={230}
                speed={1.1}
                color={C.text}
                fontSize={22}
              />
            </div>
          </FadeIn>
        )}
      </TerminalChrome>
    </Scene>
  );
};

// ═══════════════════════════════════════════
// SCENE 6: Outro
// ═══════════════════════════════════════════

const SceneOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame: frame - 5, fps, config: { damping: 80, stiffness: 140, mass: 0.8 } });
  const glowIntensity = interpolate(Math.sin(frame * 0.07), [-1, 1], [10, 40]);

  return (
    <Scene fadeOut={false}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(88,166,255,${glowIntensity / 500}) 0%, transparent 70%)`,
            filter: `blur(${glowIntensity * 2}px)`,
          }}
        />

        <div style={{ textAlign: "center", transform: `scale(${titleScale})` }}>
          <FadeIn delay={5}>
            <div style={{ fontSize: 86, fontWeight: 800, color: C.white, letterSpacing: -2, fontFamily: FONT, marginBottom: 28 }}>
              decision-lab
            </div>
          </FadeIn>

          <FadeIn delay={25}>
            <div style={{ fontSize: 34, color: C.dimmed, fontStyle: "italic", fontFamily: SANS, marginBottom: 55 }}>
              Your data deserves a peer review, not a guess.
            </div>
          </FadeIn>

          <FadeIn delay={45}>
            <div style={{ fontSize: 24, color: C.blue, letterSpacing: 4, fontFamily: SANS, fontWeight: 600, marginBottom: 55 }}>
              AGENTIC DATA SCIENCE
            </div>
          </FadeIn>

          <FadeIn delay={65}>
            <div style={{ fontSize: 22, color: C.dimmed, fontFamily: FONT, marginBottom: 16 }}>
              pip install dlab-cli
            </div>
            <div style={{ fontSize: 20, color: C.dimmed, fontFamily: FONT }}>
              github.com/pymc-labs/decision-lab
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPOSITION — 50s total
// ═══════════════════════════════════════════

export const DecisionLabDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Scene 1: Hook (0-5s) */}
      <Sequence from={0} durationInFrames={150}>
        <SceneHook />
      </Sequence>

      {/* Scene 2: Terminal command (5-10.5s) */}
      <Sequence from={150} durationInFrames={165}>
        <SceneCommand />
      </Sequence>

      {/* Scene 3: Research Plan tree (10.5-19s) */}
      <Sequence from={315} durationInFrames={255}>
        <SceneResearchPlan />
      </Sequence>

      {/* Scene 4: Fan-out Graph — the hero scene (19-34s) */}
      <Sequence from={570} durationInFrames={450}>
        <SceneFanOut />
      </Sequence>

      {/* Scene 5: Results chart + findings (34-45s) */}
      <Sequence from={1020} durationInFrames={330}>
        <SceneResults />
      </Sequence>

      {/* Scene 6: Outro (45-50s) */}
      <Sequence from={1350} durationInFrames={150}>
        <SceneOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
