'use client';

import React from 'react';

/**
 * REFINED & PERFECTED 2D HERO ANIMATION – SAFE SCHOOL MAP
 * Key Enhancements & Precision Engineering:
 * 1. Modern Integrated LED Headlight Cluster:
 *    - Sleek projector diamond lens integrated seamlessly into the front apron/steering cowl
 *    - Pale ice-cyan/crystal-white glass lens (no awkward yellow squares or misaligned blobs)
 *    - Forward-projecting cone beam illuminating the roadway ahead with soft atmospheric glow
 *    - Sleek compact LED rear taillight with ruby glow for mechanical completeness
 * 2. Ground Contact & Road Plane Alignment:
 *    - Exact shared horizontal ground baseline (y = 195px in SVG) for both front and rear wheels
 *    - Both wheels are 100% complete circles, rotating around geometric (0,0) center with zero wobble
 *    - Tires touch down firmly on the dark asphalt road surface in the middle of the driving lane
 *    - Dynamic ground shadow synchronized with subtle suspension bobbing
 * 3. Correct Layer Stacking & Road Markings:
 *    - Layer 1: Distant City & School Horizon (Far Parallax - 32s)
 *    - Layer 2: Trees & Greenery (Mid Parallax - 16s)
 *    - Layer 3: School Safety Signs & Streetlights (Near Parallax - 8s)
 *    - Layer 4: Road Surface (Curb at top, Solid Yellow edge line along curb, Dashed White center line below)
 *    - Layer 5: Vehicle & Student Rider in FOREGROUND (z-20)
 *      -> Solid opaque tires and rims cleanly occlude all background road lines
 *      -> Yellow line stays near the curb in the upper perspective, never cutting across wheels
 *    - 100% mathematically uniform white dashed lane line (55px dash, 45px gap, no stuck dashes)
 * 4. Preserved Character & Aesthetic Standards:
 *    - Mature Vietnamese high school student (~1:6.5 proportion) in crisp uniform
 *    - Natural jointed arms with elbow flexion, hands gripping handlebars
 *    - Aerodynamic safety helmet with chin strap securely fastened under jaw
 *    - Full prefers-reduced-motion accessibility support
 */
export function AnimatedStudentHero() {
  // 10 mathematically uniform dashes per 1000px: Pitch = 100px (Dash: 55px, Gap: 45px)
  // Half gap at start (22.5px) + half gap at end (22.5px) = 45px seam gap!
  const laneDashes = Array.from({ length: 10 }, (_, i) => ({
    x: 22.5 + i * 100,
    width: 55,
  }));

  // 10 evenly spaced road speed streaks (Pitch = 100px)
  const speedStreaks = Array.from({ length: 10 }, (_, i) => ({
    x: 35 + i * 100,
    width: 28,
  }));

  return (
    <div
      className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] xl:h-[620px] overflow-hidden select-none pointer-events-none"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 2%, rgba(0,0,0,0.9) 8%, black 15%), linear-gradient(to top, transparent 0%, rgba(0,0,0,0.92) 6%, black 18%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 2%, rgba(0,0,0,0.9) 8%, black 15%), linear-gradient(to top, transparent 0%, rgba(0,0,0,0.92) 6%, black 18%, black 92%, transparent 100%)',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      }}
      aria-label="Minh họa 2D học sinh trung học điều khiển xe máy điện an toàn trên đường đến trường"
    >
      {/* =======================================================================
          CSS KEYFRAMES FOR SEAMLESS MOTION, WHEEL ROTATION & PARALLAX
         ======================================================================= */}
      <style jsx>{`
        /* 1. Road & Lane Scrolling (Right to Left: 3.2s infinite) */
        @keyframes roadScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* 2. Parallax: Near School Safety Signs & Streetlights (8s) */
        @keyframes sceneryNearScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* 3. Parallax: Mid Trees & Hedges (16s) */
        @keyframes sceneryMidScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* 4. Parallax: Far Skyline & School Horizon (32s) */
        @keyframes sceneryFarScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* 5. Precise Wheel Spin around geometric center (0.65s clockwise) */
        @keyframes wheelSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* 6. Bike & Student Suspension Bobbing: Subtle, natural 2px pavement texture */
        @keyframes studentSuspension {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          25% {
            transform: translate3d(0, -2px, 0) rotate(-0.25deg);
          }
          50% {
            transform: translate3d(0, 0.8px, 0) rotate(0.15deg);
          }
          75% {
            transform: translate3d(0, -1.4px, 0) rotate(-0.1deg);
          }
        }

        /* 7. Ground Shadow Pulse synchronized with suspension */
        @keyframes shadowPulse {
          0%, 100% {
            transform: scale(1, 1);
            opacity: 0.7;
          }
          25% {
            transform: scale(0.95, 0.9);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.03, 1.05);
            opacity: 0.8;
          }
          75% {
            transform: scale(0.97, 0.93);
            opacity: 0.6;
          }
        }

        /* 8. Tie & Scarf Wind Flutter */
        @keyframes windFlutter {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-6deg) translateY(-1px);
          }
        }

        /* 9. Headlight Ambient Beam Glow */
        @keyframes headlightGlow {
          0%, 100% {
            opacity: 0.75;
          }
          50% {
            opacity: 0.95;
          }
        }

        .anim-road {
          animation: roadScroll 3.2s linear infinite;
          will-change: transform;
        }

        .anim-scenery-near {
          animation: sceneryNearScroll 8s linear infinite;
          will-change: transform;
        }

        .anim-scenery-mid {
          animation: sceneryMidScroll 16s linear infinite;
          will-change: transform;
        }

        .anim-scenery-far {
          animation: sceneryFarScroll 32s linear infinite;
          will-change: transform;
        }

        .anim-wheel {
          animation: wheelSpin 0.65s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
          will-change: transform;
        }

        .anim-rider {
          animation: studentSuspension 1.8s ease-in-out infinite;
          will-change: transform;
        }

        .anim-shadow {
          animation: shadowPulse 1.8s ease-in-out infinite;
          transform-origin: center;
          will-change: transform, opacity;
        }

        .anim-wind {
          animation: windFlutter 1.1s ease-in-out infinite;
          transform-origin: 0% 50%;
        }

        .anim-headlight {
          animation: headlightGlow 2.5s ease-in-out infinite;
        }

        /* Accessibility: respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .anim-road,
          .anim-scenery-near,
          .anim-scenery-mid,
          .anim-scenery-far,
          .anim-wheel,
          .anim-rider,
          .anim-shadow,
          .anim-wind,
          .anim-headlight {
            animation: none !important;
          }
        }
      `}</style>

      {/* =======================================================================
          LAYER 1: DISTANT CITY & SCHOOL HORIZON (FAR PARALLAX - 32s)
         ======================================================================= */}
      <div className="absolute inset-x-0 bottom-44 sm:bottom-48 h-60 flex w-[200%] anim-scenery-far opacity-35 z-0">
        {[0, 1].map((copyIdx) => (
          <div key={`far-${copyIdx}`} className="w-1/2 h-full flex-shrink-0 relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Tòa nhà chính trường học THPT Tam Hiệp với cột cờ */}
              <rect x="80" y="70" width="140" height="100" rx="3" fill="#1e293b" />
              <rect x="110" y="52" width="80" height="18" rx="2" fill="#334155" />
              <line x1="150" y1="52" x2="150" y2="26" stroke="#94a3b8" strokeWidth="2" />
              <polygon points="150,26 172,32 150,38" fill="#ef4444" />
              <circle cx="150" cy="88" r="14" fill="#0284c7" opacity="0.45" />
              <rect x="100" y="112" width="20" height="26" rx="2" fill="#38bdf8" opacity="0.25" />
              <rect x="130" y="112" width="20" height="26" rx="2" fill="#38bdf8" opacity="0.25" />
              <rect x="160" y="112" width="20" height="26" rx="2" fill="#38bdf8" opacity="0.25" />
              <rect x="190" y="112" width="20" height="26" rx="2" fill="#38bdf8" opacity="0.25" />

              {/* Tòa tháp đồng hồ & thư viện trung tâm */}
              <rect x="290" y="85" width="85" height="85" rx="3" fill="#1e293b" />
              <polygon points="290,85 332,55 375,85" fill="#334155" />
              <circle cx="332,80" r="9" fill="#facc15" opacity="0.4" />

              {/* Dãy cao ốc đô thị Biên Hòa hiện đại */}
              <rect x="450" y="95" width="100" height="75" rx="2" fill="#1e293b" />
              <rect x="580" y="60" width="90" height="110" rx="2" fill="#1e293b" />
              <rect x="600" y="76" width="15" height="18" fill="#38bdf8" opacity="0.2" />
              <rect x="635" y="76" width="15" height="18" fill="#38bdf8" opacity="0.2" />
              <rect x="600" y="105" width="15" height="18" fill="#38bdf8" opacity="0.2" />
              <rect x="635" y="105" width="15" height="18" fill="#38bdf8" opacity="0.2" />

              <rect x="710" y="88" width="110" height="82" rx="2" fill="#1e293b" />
              <rect x="850" y="98" width="85" height="72" rx="2" fill="#1e293b" />
            </svg>
          </div>
        ))}
      </div>

      {/* =======================================================================
          LAYER 2: TREES & GREENERY (MID PARALLAX - 16s)
         ======================================================================= */}
      <div className="absolute inset-x-0 bottom-36 sm:bottom-40 h-48 flex w-[200%] anim-scenery-mid opacity-75 z-0">
        {[0, 1].map((copyIdx) => (
          <div key={`mid-${copyIdx}`} className="w-1/2 h-full flex-shrink-0 relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 160"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Cây bàng bóng mát cổng trường 1 */}
              <rect x="90" y="75" width="9" height="65" rx="3" fill="#334155" />
              <circle cx="94" cy="52" r="38" fill="#047857" />
              <circle cx="82" cy="46" r="28" fill="#059669" />
              <circle cx="104" cy="42" r="23" fill="#10b981" />

              {/* Cây cau kiểng đô thị thanh thoát */}
              <rect x="250" y="85" width="7" height="55" rx="2.5" fill="#334155" />
              <ellipse cx="253" cy="60" rx="28" ry="40" fill="#065f46" />
              <ellipse cx="248" cy="55" rx="20" ry="30" fill="#059669" />

              {/* Bụi cây hoa trang viền vỉa hè */}
              <path d="M 310,140 Q 330,110 350,140 Q 370,112 390,140 Z" fill="#047857" />

              {/* Cây phượng vĩ trường học */}
              <rect x="490" y="75" width="9" height="65" rx="3" fill="#334155" />
              <circle cx="494" cy="52" r="35" fill="#047857" />
              <circle cx="482" cy="45" r="26" fill="#10b981" />
              <circle cx="508" cy="48" r="22" fill="#059669" />

              {/* Cây bóng mát đô thị 4 */}
              <rect x="680" y="80" width="8" height="60" rx="3" fill="#334155" />
              <circle cx="684" cy="56" r="32" fill="#065f46" />
              <circle cx="696" cy="50" r="24" fill="#059669" />

              {/* Cây giáp mép lặp 5 */}
              <rect x="880" y="75" width="9" height="65" rx="3" fill="#334155" />
              <ellipse cx="884" cy="56" rx="30" ry="40" fill="#047857" />
              <ellipse cx="875" cy="50" rx="22" ry="28" fill="#10b981" />
            </svg>
          </div>
        ))}
      </div>

      {/* =======================================================================
          LAYER 3: NEAR ROADSIDE – SCHOOL SAFETY TRAFFIC SIGNS & LAMPS (8s)
          Spaced along sidewalk curb so signs never tangle with rider!
         ======================================================================= */}
      <div className="absolute inset-x-0 bottom-28 sm:bottom-32 h-44 flex w-[200%] anim-scenery-near z-0">
        {[0, 1].map((copyIdx) => (
          <div key={`near-${copyIdx}`} className="w-1/2 h-full flex-shrink-0 relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 1100 160"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Cột đèn đường đô thị 1 (x = 120) */}
              <path
                d="M 120,145 L 120,38 Q 120,20 138,20 L 156,20"
                stroke="#64748b"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M 152,20 L 164,25 L 150,28 Z" fill="#94a3b8" />
              <polygon points="152,26 128,95 178,95" fill="#fef08a" opacity="0.14" />

              {/* Biển báo 1: TRẺ EM QUA ĐƯỜNG / KHU VỰC TRƯỜNG HỌC (x = 320) */}
              <line x1="320" y1="145" x2="320" y2="68" stroke="#94a3b8" strokeWidth="3" />
              <polygon points="320,54 300,90 340,90" fill="#ef4444" stroke="#dc2626" strokeWidth="1.2" />
              <polygon points="320,60 306,87 334,87" fill="#facc15" />
              {/* Hình biểu tượng học sinh an toàn */}
              <circle cx="316" cy="71" r="2.2" fill="#1e293b" />
              <line x1="316" y1="73" x2="316" y2="81" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="316" y1="81" x2="313" y2="86" stroke="#1e293b" strokeWidth="1.2" />
              <line x1="316" y1="81" x2="319" y2="86" stroke="#1e293b" strokeWidth="1.2" />
              <circle cx="325" cy="73" r="1.9" fill="#1e293b" />
              <line x1="325" y1="75" x2="325" y2="82" stroke="#1e293b" strokeWidth="1.3" />
              <line x1="325" y1="82" x2="327" y2="86" stroke="#1e293b" strokeWidth="1.1" />

              {/* Cột đèn đường đô thị 2 (x = 580) */}
              <path
                d="M 580,145 L 580,38 Q 580,20 598,20 L 616,20"
                stroke="#64748b"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M 612,20 L 624,25 L 610,28 Z" fill="#94a3b8" />
              <polygon points="612,26 588,95 638,95" fill="#fef08a" opacity="0.14" />

              {/* Biển báo 2: TỐC ĐỘ TỐI ĐA 30 KM/H CỔNG TRƯỜNG (x = 800) */}
              <line x1="800" y1="145" x2="800" y2="66" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="800" cy="52" r="17" fill="#ffffff" stroke="#ef4444" strokeWidth="3.8" />
              <text
                x="800"
                y="58"
                fill="#1e293b"
                fontSize="13"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
              >
                30
              </text>

              {/* Biển báo 3: VẠCH SANG ĐƯỜNG CHO NGƯỜI ĐI BỘ (x = 1000) */}
              <line x1="1000" y1="145" x2="1000" y2="68" stroke="#94a3b8" strokeWidth="3" />
              <rect x="985" y="54" width="30" height="30" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="1000,58 988,80 1012,80" fill="#ffffff" />
              <circle cx="1000" cy="63" r="2" fill="#0284c7" />
              <line x1="994" y1="77" x2="1006" y2="77" stroke="#0284c7" strokeWidth="1.8" />
            </svg>
          </div>
        ))}
      </div>

      {/* =======================================================================
          LAYER 4: MOVING ROAD SURFACE & MARKINGS (z-10, BEHIND THE VEHICLE)
          Proper Road Architecture & Perspective:
          1. Curb (vỉa hè) at top of road strip
          2. Solid Yellow Edge Line running along the curb at top edge of asphalt
             -> Placed at the sidewalk curb, well clear of vehicle wheels
          3. Wide asphalt driving lane
          4. 100% Mathematically Uniform Dashed White Center Line beneath vehicle
         ======================================================================= */}
      <div className="absolute inset-x-0 bottom-0 h-44 sm:h-48 flex flex-col justify-end z-10 pointer-events-none">
        {/* Vỉa hè / Gờ bó vỉa đá granite đô thị */}
        <div className="h-4 w-full bg-slate-800 border-t border-slate-700/80 flex w-[200%] anim-road">
          {[0, 1].map((copyIdx) => (
            <div key={`curb-${copyIdx}`} className="w-1/2 h-full flex-shrink-0 flex">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-full border-r border-slate-900/70 bg-gradient-to-b from-slate-700 to-slate-800"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Lòng đường nhựa asphalt sẫm màu */}
        <div className="h-40 sm:h-44 w-full bg-slate-950 relative overflow-hidden flex flex-col justify-between py-2 border-t border-slate-800/90">
          {/* Vạch sơn mép đường vàng an toàn - nằm ở mép trên sát vỉa hè, chạy liên tục phía sau xe */}
          <div className="h-1.5 w-full bg-amber-400/95 shadow-xs" />

          {/* Vệt bụi tốc độ lướt mặt đường (Phía sau xe) */}
          <div className="flex w-[200%] anim-road opacity-20">
            {[0, 1].map((copyIdx) => (
              <div key={`speed-${copyIdx}`} className="w-1/2 h-2 flex-shrink-0 relative">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 1000 8"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {speedStreaks.map((s, idx) => (
                    <rect
                      key={idx}
                      x={s.x}
                      y="3"
                      width={s.width}
                      height="2"
                      rx="1"
                      fill="#38bdf8"
                    />
                  ))}
                </svg>
              </div>
            ))}
          </div>

          {/* VẠCH KẺ TIM ĐƯỜNG TRẮNG ĐỨT QUÃNG - 100% ĐỒNG ĐỀU, CHẠY LIÊN TỤC DƯỚI BÁNH XE */}
          <div className="flex w-[200%] anim-road pb-2">
            {[0, 1].map((copyIdx) => (
              <div key={`lane-${copyIdx}`} className="w-1/2 h-4 flex-shrink-0 relative">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 1000 16"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {laneDashes.map((dash, idx) => (
                    <rect
                      key={idx}
                      x={dash.x}
                      y="4"
                      width={dash.width}
                      height="8"
                      rx="4"
                      fill="#ffffff"
                      opacity="0.95"
                    />
                  ))}
                </svg>
              </div>
            ))}
          </div>

          {/* Mép đáy đường */}
          <div className="h-1.5 w-full bg-slate-900/90" />
        </div>
      </div>

      {/* =======================================================================
          LAYER 5: REFINED STUDENT CHARACTER & URBAN ELECTRIC SCOOTER (z-20 FOREGROUND)
          - Firmly Grounded: Both wheels share identical baseline y=195, planted on asphalt
          - Opaque Wheels: Solid tires and alloy rims occlude all road markings behind them
          - Redesigned Headlight: Modern integrated LED projector cluster mounted directly
            on the handlebar head unit (cụm đầu xe) with pale ice-cyan crystal lens
            and forward/downward illuminating road beam
          - Red LED taillight with subtle glow at the rear tail bracket
          - Exact 4:3 Aspect Ratio (w:h = 4:3) preventing any letterboxing or vertical misalignment
         ======================================================================= */}
      <div className="absolute bottom-8 sm:bottom-9 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        {/* Bóng đổ mặt đường thực tế dưới 2 bánh xe trên mặt đường nhựa */}
        <div className="absolute -bottom-1 left-4 right-4 h-6 rounded-full bg-slate-950/80 blur-xs anim-shadow" />

        {/* Khung nhân vật + xe (Vector 2D Semi-Flat cao cấp, tỷ lệ 4:3 chuẩn xác) */}
        <div className="anim-rider relative">
          <svg
            className="w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[380px] h-[210px] sm:h-[240px] lg:h-[270px] xl:h-[285px] overflow-visible"
            viewBox="0 0 280 210"
            fill="none"
          >
            <defs>
              {/* Chùm sáng đèn pha LED chiếu rọi về phía trước và mặt đường (Dịu nhẹ, hướng sang phải) */}
              <linearGradient id="headlightBeamLED" x1="0%" y1="10%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
                <stop offset="25%" stopColor="#e0f2fe" stopOpacity="0.22" />
                <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>

              {/* Quầng sáng nhẹ quanh mặt kính đèn pha */}
              <radialGradient id="headlightLensGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#e0f2fe" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>

              {/* Mũ bảo hiểm cao cấp */}
              <linearGradient id="helmetGradRefined" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="45%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>

              {/* Thân xe máy điện đô thị */}
              <linearGradient id="scooterBodyGradRefined" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="30%" stopColor="#0284c7" />
                <stop offset="75%" stopColor="#0f172a" />
              </linearGradient>

              {/* Vành mâm đúc hợp kim thể thao */}
              <linearGradient id="alloyRimRefined" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Yên xe da cao cấp */}
              <linearGradient id="leatherSeatRefined" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="40%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>

              {/* Kim loại sáng bóng cho phuộc nhún */}
              <linearGradient id="chromeFork" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            {/* Chùm sáng đèn pha LED chiếu rọi từ cụm đầu xe về phía trước và rọi xuống mặt đường */}
            <polygon
              points="201,80 355,106 375,195 270,195 201,84"
              fill="url(#headlightBeamLED)"
              className="anim-headlight"
            />

            {/* -------------------------------------------------------------
                A. CƠ CẤU BÁNH XE & TIẾP XÚC MẶT ĐƯỜNG CHÍNH XÁC (y = 195)
                - Bánh sau tâm: (60, 170), bán kính: 25 -> tiếp xúc đáy y = 195
                - Bánh trước tâm: (210, 170), bán kính: 25 -> tiếp xúc đáy y = 195
                - Cả 2 bánh cùng nằm trên một mặt phẳng tiếp xúc mặt đường chuẩn mực!
                - Vệt tiếp xúc bóng đổ (Contact Shadows) khóa chặt chân bánh vào mặt đường
               ------------------------------------------------------------- */}

            {/* Vết bóng đổ tiếp xúc bánh sau và bánh trước trực tiếp trên mặt đường nhựa */}
            <ellipse cx="60" cy="195" rx="20" ry="3.5" fill="#020617" opacity="0.85" />
            <ellipse cx="210" cy="195" rx="20" ry="3.5" fill="#020617" opacity="0.85" />
            <ellipse cx="135" cy="196" rx="80" ry="4.5" fill="#020617" opacity="0.4" />

            {/* 1. BÁNH XE SAU HOÀN CHỈNH (TÂM: 60, 170) */}
            <g transform="translate(60, 170)">
              <g className="anim-wheel">
                {/* Lốp cao su đặc dày vân thể thao (Đặc 100%, che khuất nền phía sau) */}
                <circle cx="0" cy="0" r="25" fill="#090d16" stroke="#1e293b" strokeWidth="3" />
                {/* Rãnh gai thể thao trên lốp */}
                <circle cx="0" cy="0" r="22.5" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="6,4" fill="none" opacity="0.75" />
                {/* Vành đúc hợp kim (Đặc 100%, không cho vạch đường xuyên qua) */}
                <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="url(#alloyRimRefined)" strokeWidth="2.2" />
                {/* Đĩa phanh cơ khí */}
                <circle cx="0" cy="0" r="12" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.6" />
                {/* 5 chấu mâm thể thao hình sao quay quanh đúng tâm */}
                <line x1="0" y1="-17" x2="0" y2="17" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="-16" y1="-6" x2="16" y2="6" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="-10" y1="14" x2="10" y2="-14" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
                {/* Ụ moay-ơ trục bánh xe */}
                <circle cx="0" cy="0" r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.6" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
              </g>
            </g>

            {/* 2. BÁNH XE TRƯỚC HOÀN CHỈNH (TÂM: 210, 170) */}
            <g transform="translate(210, 170)">
              <g className="anim-wheel">
                {/* Lốp cao su đặc dày vân thể thao (Đặc 100%, che khuất nền phía sau) */}
                <circle cx="0" cy="0" r="25" fill="#090d16" stroke="#1e293b" strokeWidth="3" />
                {/* Rãnh gai thể thao trên lốp */}
                <circle cx="0" cy="0" r="22.5" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="6,4" fill="none" opacity="0.75" />
                {/* Vành đúc hợp kim (Đặc 100%, không cho vạch đường xuyên qua) */}
                <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="url(#alloyRimRefined)" strokeWidth="2.2" />
                {/* Đĩa phanh cơ khí */}
                <circle cx="0" cy="0" r="12" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.6" />
                {/* 5 chấu mâm thể thao hình sao quay quanh đúng tâm */}
                <line x1="0" y1="-17" x2="0" y2="17" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="-16" y1="-6" x2="16" y2="6" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="-10" y1="14" x2="10" y2="-14" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round" />
                {/* Ụ moay-ơ trục bánh xe */}
                <circle cx="0" cy="0" r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.6" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
              </g>
            </g>

            {/* -------------------------------------------------------------
                B. KHUNG GẦM XE MÁY ĐIỆN & CƠ CẤU CƠ KHÍ THỰC TẾ
               ------------------------------------------------------------- */}
            {/* Dè chắn bùn ôm bánh sau */}
            <path
              d="M 38,167 A 28,28 0 0,1 78,143"
              stroke="#1e293b"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Pat biển số & đèn soi phản quang */}
            <path d="M 37,168 L 33,175" stroke="#475569" strokeWidth="2.5" />

            {/* Càng gắp sau hợp kim nối từ trục bánh sau (60, 170) vào khung thân xe */}
            <path d="M 60,170 L 106,164 L 110,139" stroke="#334155" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M 60,170 L 96,137" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
            {/* Phuộc nhún sau thể thao (Lò xo nhún đỏ) */}
            <line x1="72" y1="163" x2="88" y2="137" stroke="#e2e8f0" strokeWidth="3" />
            <line x1="70" y1="165" x2="90" y2="135" stroke="#ef4444" strokeWidth="2.2" strokeDasharray="3,3" />

            {/* Sàn để chân xe máy điện học sinh (Rộng rãi, vững chãi) */}
            <rect x="108" y="159" width="60" height="9" rx="3.5" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
            {/* Gờ cao su chống trượt trên sàn để chân */}
            <rect x="114" y="161" width="48" height="2.5" rx="1" fill="#475569" />

            {/* Khối thân xe & khoang pin điện (Đường cong liền mạch Unibody sang trọng) */}
            <path
              d="M 52,137 C 54,123 72,121 110,125 C 114,137 116,149 114,159 L 90,159 C 76,155 62,147 52,137 Z"
              fill="url(#scooterBodyGradRefined)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Dải ốp kim loại & đường gân khí động học thân xe */}
            <path d="M 64,135 Q 88,131 108,134" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.9" />
            {/* Đèn LED báo pin dung lượng xanh ngọc */}
            <circle cx="94" cy="141" r="3.2" fill="#10b981" />
            <path d="M 93,139 L 96,141 L 93,143" stroke="#ffffff" strokeWidth="1" fill="none" />

            {/* ĐÈN HẬU LED ĐỎ TINH TẾ ÔM ĐUÔI XE (Tăng tính hoàn chỉnh phương tiện) */}
            <path d="M 47,132 L 53,132 L 51,141 L 45,139 Z" fill="#ef4444" />
            <circle cx="48.5" cy="136" r="1.8" fill="#fca5a5" />
            <polygon points="46,134 32,132 30,142 45,140" fill="#ef4444" opacity="0.15" />

            {/* Yên xe máy điện đô thị (Thiết kế công thái học 2 tầng bọc da cao cấp) */}
            <path
              d="M 56,123 C 56,116 74,114 102,115 C 116,116 122,121 116,127 C 96,129 66,129 56,123 Z"
              fill="url(#leatherSeatRefined)"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Đường chỉ may yên xe trắng thanh lịch */}
            <path d="M 66,121 Q 92,118 112,122" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="4,2" fill="none" />

            {/* Yếm trước khí động học ôm mềm mại */}
            <path
              d="M 160,160 L 186,107 C 190,101 198,101 204,107 L 202,151 C 192,155 176,159 160,160 Z"
              fill="url(#scooterBodyGradRefined)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Dải LED định vị ban ngày (DRL) vuốt nhọn thể thao tích hợp chìm trên mặt nạ */}
            <path d="M 195,114 L 200,122 L 196,130" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />

            {/* Dè chắn bùn thể thao trước */}
            <path
              d="M 188,161 A 28,28 0 0,1 230,145"
              stroke="#0284c7"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Phuộc nhún đôi thủy lực mạ crôm nối từ chảng ba cổ lái (194, 107) xuống tâm trục trước (210, 170) */}
            <line x1="194" y1="107" x2="210" y2="170" stroke="url(#chromeFork)" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="191" y1="109" x2="207" y2="170" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

            {/* Cổ ghi-đông xe máy điện */}
            <line x1="190" y1="103" x2="182" y2="81" stroke="#475569" strokeWidth="5" strokeLinecap="round" />

            {/* =============================================================
                CỤM ĐẦU XE & ĐÈN PHA LED PROJECTOR HIỆN ĐẠI (INTEGRATED HEADSET & HEADLIGHT)
                - Tích hợp tự nhiên, gắn cố định vào cụm đầu xe (Handlebar Cowl Headset)
                - Vỏ ốp đầu xe màu xanh cyan khí động học ôm trọn ghi-đông
                - Mặt kính pha lê trắng / cyan nhạt (#f0f9ff / #bae6fd)
                - Thấu kính bi cầu LED Projector chiếu rọi sang phải và xuống mặt đường
                - Không sử dụng hình vuông vàng, không lệch khỏi thân xe
               ============================================================= */}
            {/* Vỏ ốp đầu xe khí động học (Handlebar Cowl Headset) */}
            <path
              d="M 174,84 C 174,75 181,73 190,73 C 196,73 200,76 201,81 C 201,86 195,89 187,89 C 179,89 174,87 174,84 Z"
              fill="url(#scooterBodyGradRefined)"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            {/* Màn hình kỹ thuật số LCD hiển thị tốc độ an toàn trên ghi-đông */}
            <rect x="177" y="75" width="10" height="5" rx="1.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
            <line x1="179" y1="77.5" x2="185" y2="77.5" stroke="#10b981" strokeWidth="1" />

            {/* Cặp tay lái ghi-đông tiện dụng */}
            <path d="M 174,82 L 168,83" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <path d="M 186,82 L 194,83" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            {/* Tay phanh (brake lever) an toàn hợp kim */}
            <line x1="168" y1="85" x2="162" y2="86" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />

            {/* Gương chiếu hậu an toàn học đường */}
            <circle cx="166" cy="75" r="3.8" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
            <line x1="168" y1="78" x2="170" y2="82" stroke="#475569" strokeWidth="1.5" />

            {/* CỤM ĐÈN PHA LED PROJECTOR ĐẦU XE (CHÍNH DIỆN HƯỚNG DI CHUYỂN) */}
            <g id="modern-led-headlight">
              {/* Khung viền chóa đèn pha mạ kim loại bạc */}
              <path
                d="M 193,76 C 197,76 201.5,78 201.5,81 C 201.5,84 197,86 193,86 Z"
                fill="#1e293b"
                stroke="#e2e8f0"
                strokeWidth="0.9"
              />
              {/* Mặt kính đèn pha Projector pha lê trong suốt trắng cyan nhạt */}
              <path
                d="M 194,77 C 198,77 202,78.5 202,81 C 202,83.5 198,85 194,85 Z"
                fill="#f0f9ff"
                stroke="#bae6fd"
                strokeWidth="0.7"
              />
              {/* Bi cầu LED Projector trung tâm - Ánh sáng trắng tinh khiết */}
              <circle cx="197.5" cy="81" r="2.3" fill="#ffffff" />
              <circle cx="197.5" cy="81" r="1.2" fill="#e0f2fe" />
              {/* Vòng hào quang Angel-Eye DRL xanh dịu */}
              <ellipse cx="197.5" cy="81" rx="3.5" ry="3" stroke="#38bdf8" strokeWidth="0.6" fill="none" opacity="0.85" />
            </g>

            {/* -------------------------------------------------------------
                D. NHÂN VẬT HỌC SINH VIỆT NAM (TỶ LỆ CHUẨN ~1:6.5 TRUNG HỌC)
                - Ngồi vững chắc trực tiếp trên yên xe (y=117)
                - Hai chân đặt ngay ngắn trên sàn để chân (y=159)
                - Hai tay cong tự nhiên với khuỷu tay gập góc thật, tay nắm chắc ghi-đông
               ------------------------------------------------------------- */}

            {/* 1. CHÂN & BÀN CHÂN (Tư thế ngồi lái tự nhiên) */}
            {/* Đùi & Đầu gối (Quần tây học sinh xanh đen nếp vải nhẹ) */}
            <path
              d="M 88,119 C 96,119 114,119 130,122 C 140,124 144,132 140,142 L 132,158 L 118,158 L 126,140 C 126,133 112,131 86,127 Z"
              fill="#1e293b"
            />
            {/* Bàn chân mang giày thể thao học sinh đặt vững vàng trên sàn xe */}
            <rect x="118" y="156" width="26" height="8.5" rx="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
            <path d="M 122,160 L 138,160" stroke="#38bdf8" strokeWidth="1.5" />

            {/* 2. BALO HỌC SINH ĐEO GỌN SAU LƯNG */}
            <path
              d="M 68,69 C 60,72 57,89 61,103 C 65,113 75,115 82,113 L 84,83 Z"
              fill="#0e7490"
              stroke="#155e75"
              strokeWidth="1.5"
            />
            {/* Quai đeo balo học sinh đệm êm */}
            <path d="M 78,71 Q 88,81 86,99" stroke="#0891b2" strokeWidth="3" fill="none" />

            {/* 3. THÂN & ÁO SƠ MI ĐỒNG PHỤC TRẮNG HỌC SINH */}
            {/* Cổ học sinh tự nhiên: nối vừa vặn từ chân hàm xuống cổ áo, tỷ lệ thanh tú */}
            <path
              d="M 102,50 C 102,56 101,62 101,67 L 112,68 C 113,64 114,60 115,58 Z"
              fill="#fed7aa"
            />
            {/* Vùng bóng đổ nhẹ dưới cằm tạo chiều sâu tự nhiên */}
            <path
              d="M 104,54 C 108,54 112,56 115,57 L 112,62 C 108,59 105,57 103,56 Z"
              fill="#fcd34d"
              opacity="0.3"
            />
            {/* Mái tóc gáy học sinh gọn gàng, ôm nhẹ sau gáy (tránh cảm giác cổ bị trơ) */}
            <path
              d="M 98,39 C 98,47 97,55 99,62 C 101,64 103,63 103,57 C 103,51 102,44 100,39 Z"
              fill="#1e293b"
            />

            {/* Thân áo sơ mi trắng học sinh */}
            <path
              d="M 82,69 C 86,64 98,64 110,70 L 114,115 C 103,119 90,119 82,115 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.4"
            />
            {/* Đường nẹp áo sơ mi & cúc áo */}
            <line x1="99" y1="73" x2="99" y2="115" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="99" cy="83" r="1.2" fill="#94a3b8" />
            <circle cx="99" cy="95" r="1.2" fill="#94a3b8" />
            <circle cx="99" cy="107" r="1.2" fill="#94a3b8" />

            {/* Cổ áo đồng phục xanh viền trắng ôm trọn cổ */}
            <polygon points="98,66 108,69 103,75 96,70" fill="#0284c7" />
            <polygon points="111,66 108,69 113,75 116,70" fill="#0284c7" />

            {/* Cà vạt / Nơ đồng phục học sinh màu đỏ (Gắn cố định trang nhã tại cổ áo, chuyển động đồng bộ cùng xe, KHÔNG di chuyển lên xuống) */}
            <g id="student-red-tie">
              {/* Nút thắt cà vạt chính giữa 2 vạt cổ áo */}
              <polygon points="106,68.5 110.5,68.5 111,72.5 105.5,72.5" fill="#dc2626" />
              {/* Thân cà vạt đỏ rủ phẳng phiu trên ngực áo */}
              <polygon points="105.5,72.5 111,72.5 111.5,78 108.5,80.5 105,78" fill="#ef4444" stroke="#dc2626" strokeWidth="0.4" />
              {/* Sống gân cà vạt */}
              <line x1="108.5" y1="72.5" x2="108.5" y2="79" stroke="#b91c1c" strokeWidth="0.6" />
            </g>

            {/* Phù hiệu trường học trên ngực áo */}
            <rect x="107" y="80" width="5.5" height="4.5" rx="1" fill="#0284c7" />

            {/* CÁNH TAY ÁO SƠ MI & CƠ TAY TỰ NHIÊN VỚI KHUỶU TAY GẬP (Articulated Arm) */}
            {/* Bắp tay từ vai (100, 71) hạ xuống khuỷu tay (128, 87), cẳng tay vươn tới cổ tay (164, 81) */}
            <path
              d="M 100,71 C 107,70 118,77 128,87 L 164,80 L 167,87 L 128,95 C 116,95 105,83 96,77 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />
            {/* Cổ tay áo sơ mi viền xanh */}
            <line x1="162" y1="79" x2="165" y2="87" stroke="#0284c7" strokeWidth="1.5" />
            {/* Nếp gấp vải tự nhiên tại khuỷu tay */}
            <path d="M 122,84 Q 126,88 124,92" stroke="#cbd5e1" strokeWidth="1" fill="none" />

            {/* Bàn tay học sinh nắm chắc chắn, tự nhiên trên tay lái ghi-đông (x=174, y=82) */}
            <circle cx="174" cy="82" r="4.8" fill="#fed7aa" stroke="#fcd34d" strokeWidth="0.8" />
            <path d="M 172,82 Q 175,85 177,82" stroke="#ea580c" strokeWidth="0.8" fill="none" />

            {/* 4. KHUÔN MẶT CÂN ĐỐI, THÂN THIỆN (NGUYÊN BẢN HỌC SINH VIỆT NAM) */}
            {/* Khuôn mặt tỷ lệ trung học (~1:6.5) */}
            <path
              d="M 100,43 C 100,35 108,30 117,30 C 126,30 131,37 131,46 C 131,53 125,61 116,61 C 107,61 100,53 100,43 Z"
              fill="#fed7aa"
            />
            {/* Mắt chăm chú quan sát giao thông an toàn (Nguyên bản tròn sáng, thân thiện) */}
            <ellipse cx="122" cy="43" rx="2.3" ry="2.6" fill="#0f172a" />
            <circle cx="123" cy="42" r="0.8" fill="#ffffff" />
            {/* Lông mày tự tin */}
            <path d="M 118,38 Q 122,35 126,38" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Sống mũi & nụ cười nhẹ nhàng */}
            <path d="M 126,45 L 128,49 L 125,50" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M 121,52 Q 124,55 127,52" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Má hồng tươi sáng */}
            <circle cx="118" cy="50" r="2.5" fill="#fca5a5" opacity="0.6" />
            {/* Tai học sinh */}
            <circle cx="108" cy="46" r="3.5" fill="#fbcfe8" />

            {/* Tóc học sinh gọn gàng */}
            <path d="M 100,38 Q 106,28 119,29 Q 112,34 108,39 Z" fill="#1e293b" />

            {/* 5. MŨ BẢO HIỂM AN TOÀN HIỆN ĐẠI CÓ QUAI CÀI ĐÚNG QUY CÁCH */}
            {/* Vỏ mũ bảo hiểm khí động học cao cấp */}
            <path
              d="M 97,39 C 97,23 107,15 122,15 C 134,15 139,25 138,37 C 136,40 128,41 121,40 C 112,39 101,42 97,39 Z"
              fill="url(#helmetGradRefined)"
              stroke="#0369a1"
              strokeWidth="1.5"
            />
            {/* Vạch decal phản quang thể thao trên mũ */}
            <path
              d="M 102,29 Q 114,21 130,26"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            {/* Kính chắn gió / Lưỡi trai mũ thời trang */}
            <path d="M 133,34 L 140,36 L 134,40 Z" fill="#0284c7" />

            {/* QUAI MŨ BẢO HIỂM ÔM SÁT XƯƠNG HÀM VÀ CẰM ĐÚNG QUY CHUẨN */}
            {/* Quai sau từ chân tai (108, 42) xuống dưới hàm */}
            <path
              d="M 107,42 Q 108,52 114,59"
              stroke="#1e293b"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Quai trước từ vành nón (116, 39) xuống chốt gài dưới cằm */}
            <path
              d="M 116,39 Q 117,49 115,59"
              stroke="#1e293b"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Khóa gài an toàn micro-buckle vàng tinh tế dưới cằm */}
            <rect x="113" y="58" width="5.5" height="3" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* =======================================================================
          LAYER 6: INTEGRATED AMBIENT FADE TO HERO TITLE
          Soft, seamless blend into hero background on left, top and bottom
         ======================================================================= */}
      <div className="absolute inset-y-0 left-0 pointer-events-none bg-gradient-to-r from-navy-950 via-navy-950/40 to-transparent w-16 sm:w-24 z-30" />
      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none bg-gradient-to-b from-navy-950 to-transparent z-30" />
      <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none bg-gradient-to-t from-navy-950 to-transparent z-30" />
    </div>
  );
}
