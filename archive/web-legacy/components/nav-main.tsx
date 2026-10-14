import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavLink } from 'react-router'

export function NavMain({
  items,
}: {
  items: {
    title: string
    to: string
    icon?: React.ReactNode
    end?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <NavLink to={item.to} end={item.end}>
              {({ isActive }) => (
                <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
