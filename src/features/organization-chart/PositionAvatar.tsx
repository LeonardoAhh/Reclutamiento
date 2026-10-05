import { BriefcaseBusiness, ClipboardList, GraduationCap, HardHat, Search, Sparkles, UsersRound } from "lucide-react";

export function PositionAvatar({ title, identity, level }: { title: string; identity: string; level: 5 | 7 | 8 | 10 | 11 | 14 }) {
  const seed = Array.from(identity).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const isMale = identity === "3204" || identity === "4097";
  const hairstyle = isMale ? 0 : 1 + seed % 3;
  const Icon = title.includes("Limpieza") ? Sparkles
    : title.includes("Seguridad") ? HardHat
    : title.includes("Capacitación") ? GraduationCap
    : title.includes("Reclutamiento") ? Search
    : title.includes("Gerente") || title.includes("Jefe") ? BriefcaseBusiness
    : title.includes("Auxiliar") ? ClipboardList : UsersRound;

  return (
    <svg className={`organization-avatar organization-avatar--level-${level}`}
      viewBox="0 0 240 300" aria-hidden="true" focusable="false">
      <circle className="organization-avatar__halo" cx="120" cy="142" r="92" />
      <circle className="organization-avatar__accent" cx="43" cy="72" r="7" />
      <circle className="organization-avatar__accent" cx="204" cy="183" r="4" />
      <g className="organization-avatar__character">
        {hairstyle !== 0 && <rect className="organization-avatar__hair" x="67" y="77" width="106" height="133" rx="49" />}
        {hairstyle === 2 && <circle className="organization-avatar__hair" cx="153" cy="71" r="26" />}
        <path className="organization-avatar__shirt" d="M43 257v-32c0-38 34-59 77-59s77 21 77 59v32Z" />
        <path className="organization-avatar__skin" d="M103 149h34v32c-8 14-26 14-34 0Z" />
        <ellipse className="organization-avatar__skin" cx="120" cy="121" rx="43" ry="53" />
        <path className="organization-avatar__hair" d={hairstyle === 0
          ? "M77 117V98c0-53 85-53 86 0v16l-15-26c-21 15-49 10-59 6Z"
          : "M76 125V98c0-56 88-56 88 0v27l-13-33c-19 10-42 4-48-6-3 19-15 28-27 39Z"} />
        <g className="organization-avatar__eyes">
          <circle className="organization-avatar__hair" cx="104" cy="124" r="3" />
          <circle className="organization-avatar__hair" cx="136" cy="124" r="3" />
        </g>
        <path className="organization-avatar__smile" d="M109 145q11 11 22 0" />
        <path className="organization-avatar__collar" d="m99 178 21 16 21-16-8 33h-26Z" />
        <circle className="organization-avatar__badge" cx="165" cy="224" r="23" />
        <Icon className="organization-avatar__role" x="153" y="212" width="24" height="24" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
