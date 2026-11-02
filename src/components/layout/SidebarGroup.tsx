import type { NavigationRole, NavSection } from './navigation';
import { SidebarItem } from './SidebarItem';

type SidebarGroupProps = {
  section: NavSection;
  role?: NavigationRole;
  collapsed: boolean;
  onNavigate?: () => void;
};

export function SidebarGroup({ section, role, collapsed, onNavigate }: SidebarGroupProps) {
  const items = section.items.filter((item) => !item.roles || (role && item.roles.includes(role)));
  if (items.length === 0) return null;
  const titleId = `sidebar-section-${section.id}`;

  return (
    <div className="sidebar__group">
      {section.label && (
        <span id={titleId} className="sidebar__group-label">
          {section.label}
        </span>
      )}
      <ul className="sidebar__list" aria-labelledby={section.label ? titleId : undefined}>
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  );
}
