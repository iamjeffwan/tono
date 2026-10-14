'use client'

import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  HouseIcon,
  SwatchBookIcon,
  ListChecksIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
} from 'lucide-react'
import { useParams } from 'react-router'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar> & {}) {
  const { projectId } = useParams()
  // This is sample data.
  const data = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
    teams: [
      {
        name: 'Acme Inc',
        logo: <GalleryVerticalEndIcon />,
        plan: 'Enterprise',
      },
      {
        name: 'Acme Corp.',
        logo: <AudioLinesIcon />,
        plan: 'Startup',
      },
      {
        name: 'Evil Corp.',
        logo: <TerminalIcon />,
        plan: 'Free',
      },
    ],
    navMain: [
      {
        title: '主页',
        to: `/project/${projectId}`,
        icon: <HouseIcon />,
        end: true,
      },
      {
        title: '设计体系',
        to: `/project/${projectId}/system`,
        icon: <SwatchBookIcon />,
      },
      {
        title: 'Lint',
        to: `/project/${projectId}/lint`,
        icon: <ListChecksIcon />,
      },
    ],
    projects: [
      {
        name: 'Design Engineering',
        url: '#',
        icon: <FrameIcon />,
      },
      {
        name: 'Sales & Marketing',
        url: '#',
        icon: <PieChartIcon />,
      },
      {
        name: 'Travel',
        url: '#',
        icon: <MapIcon />,
      },
    ],
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
