import { NavLink, Outlet } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { UserButton } from './user-button';
import { cn } from '@/lib/utils';

export interface MenuItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface LayoutProps {
  menuSections: MenuSection[];
  children?: React.ReactNode;
}

export function Layout({ menuSections }: LayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='border-b border-sidebar-border h-16 flex px-4 justify-center'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold'>
              <img src='/public/logo.png' alt='logo' className='w-16' />
            </h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {menuSections.map((section, sectionIndex) => (
            <SidebarGroup key={sectionIndex}>
              {section.title && (
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <NavLink to={item.href}>
                        {({ isActive }) => (
                          <SidebarMenuButton
                            asChild
                            className={cn(
                              isActive &&
                                'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                            )}
                          >
                            <span>
                              {item.icon && <item.icon className='size-4' />}
                              <span>{item.title}</span>
                            </span>
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className='border-t border-sidebar-border p-2'>
          <UserButton />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className='sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4'>
          <SidebarTrigger />
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
